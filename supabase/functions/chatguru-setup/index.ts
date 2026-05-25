import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao autenticar usuário',
          details: userError?.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let body: any = {}
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch (e) {}
    }

    if (body.action === 'fetch_devices') {
      const { web_api_key, chatguru_account_id } = body
      if (!web_api_key || !chatguru_account_id) {
        return new Response(JSON.stringify({ success: false, error: 'Credenciais ausentes' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Call ChatGuru API to list devices
      let devices = []
      try {
        const chatGuruUrl = `https://chatguru.app/api/v1?action=phones&key=${web_api_key}&account_id=${chatguru_account_id}`
        const response = await fetch(chatGuruUrl)
        const text = await response.text()
        let result
        try {
          result = JSON.parse(text)
        } catch (e) {
          throw new Error('Formato de resposta inválido ou credenciais incorretas.')
        }

        if (result && result.error) {
          return new Response(JSON.stringify({ success: false, error: result.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        let rawDevices: any[] = []
        if (result && Array.isArray(result)) {
          rawDevices = result
        } else if (result && typeof result === 'object') {
          if (result.phones && Array.isArray(result.phones)) {
            rawDevices = result.phones
          } else if (result.devices && Array.isArray(result.devices)) {
            rawDevices = result.devices
          } else {
            const vals = Object.values(result)
            if (
              vals.length > 0 &&
              typeof vals[0] === 'object' &&
              vals[0] !== null &&
              ('id' in (vals[0] as any) || 'phone_id' in (vals[0] as any))
            ) {
              rawDevices = vals
            } else {
              rawDevices = [result]
            }
          }
        } else {
          throw new Error('Formato inválido retornado pela API')
        }

        // Normalize output
        devices = rawDevices.map((d: any) => ({
          id: d.id || d.phone_id || d.instance_id || String(Math.random()),
          name: d.name || d.phone_name || d.number || 'Aparelho Desconhecido',
          status: d.status || 'unknown',
        }))
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Falha ao buscar aparelhos na API do ChatGuru. Verifique suas credenciais.',
            details: e.message,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(JSON.stringify({ success: true, devices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const configId = body.config_id
    let configQuery = supabase
      .from('whatsapp_configs')
      .select('id, web_api_key, web_instance_id, verify_token')
      .eq('user_id', user.id)
      .eq('connection_type', 'chatguru')

    if (configId) {
      configQuery = configQuery.eq('id', configId)
    }

    const { data: config, error: configError } = await configQuery.limit(1).maybeSingle()

    if (configError || !config) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Configuração do ChatGuru não encontrada para o usuário. Salve as credenciais primeiro.',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { web_api_key: key, web_instance_id: phone_id } = config

    if (!key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A API Key do ChatGuru não está configurada. Salve as credenciais primeiro.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let verifyToken = config.verify_token
    if (!verifyToken) {
      verifyToken = crypto.randomUUID()
      await supabase
        .from('whatsapp_configs')
        .update({ verify_token: verifyToken })
        .eq('id', config.id)
    }

    // Construct Webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-bot?user_id=${user.id}&token=${verifyToken}`

    // Tenta registrar o webhook usando a API do ChatGuru
    const chatGuruUrl = `https://chatguru.app/api/v1?action=webhook_config`

    let response
    try {
      response = await fetch(chatGuruUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          webhook_url: webhookUrl,
          phone_id: phone_id || undefined,
        }),
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao conectar na API do ChatGuru',
          details: e.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const text = await response.text()
    let jsonResponse
    try {
      jsonResponse = JSON.parse(text)
    } catch (e) {
      jsonResponse = null
    }

    if (!response.ok || (jsonResponse && jsonResponse.error)) {
      const errorMessage =
        jsonResponse?.error ||
        jsonResponse?.message ||
        text ||
        'A API Key ou Phone ID podem ser inválidos.'
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro de comunicação com o ChatGuru ao configurar Webhook',
          details: errorMessage,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook registrado com sucesso no ChatGuru!' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
