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
      const { web_api_key, chatguru_account_id, chatguru_endpoint_url } = body
      if (!web_api_key || !chatguru_account_id || !chatguru_endpoint_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credenciais ou Endpoint URL ausentes' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Call ChatGuru API to list devices
      let devices = []
      try {
        const endpoint = chatguru_endpoint_url.endsWith('/')
          ? chatguru_endpoint_url.slice(0, -1)
          : chatguru_endpoint_url
        const chatGuruUrl = `${endpoint}?action=phones&key=${web_api_key}&account_id=${chatguru_account_id}`
        const response = await fetch(chatGuruUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: web_api_key,
          },
        })
        const text = await response.text()
        let result
        try {
          result = JSON.parse(text)
        } catch (e) {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'Erro ao fazer parse da resposta do ChatGuru',
            details: { status: response.status, rawResponse: text, endpoint },
          })
          if (
            response.status === 404 ||
            response.status === 400 ||
            text.toLowerCase().includes('not found')
          ) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'URL do Endpoint inválida ou não suportada.',
              }),
              {
                status: response.status === 200 ? 400 : response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            )
          }
          if (
            response.status === 401 ||
            response.status === 403 ||
            text.toLowerCase().includes('unauthorized') ||
            text.toLowerCase().includes('invalid')
          ) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Credenciais inválidas: Verifique seu Account ID e API Key.',
              }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }
          return new Response(
            JSON.stringify({
              success: false,
              error: `Erro na API (${response.status}): Falha na comunicação com o ChatGuru.`,
            }),
            {
              status: response.status || 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        if (result && result.error) {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'Erro retornado pela API do ChatGuru',
            details: { rawResponse: text, endpoint, error: result.error },
          })
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Credenciais inválidas: Verifique seu Account ID e API Key.',
              details: String(result.error),
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        if (!response.ok) {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: `Erro de comunicação HTTP com o ChatGuru (${response.status})`,
            details: { status: response.status, rawResponse: text, endpoint },
          })
          if (response.status === 404 || response.status === 400) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'URL do Endpoint inválida ou não suportada.',
              }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            )
          }
          if (response.status === 401 || response.status === 403) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Credenciais inválidas: Verifique seu Account ID e API Key.',
              }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            )
          }
          return new Response(
            JSON.stringify({
              success: false,
              error: `Erro na API (${response.status}): Verifique suas credenciais e URL.`,
            }),
            {
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        let rawDevices: any[] = []
        if (result && Array.isArray(result)) {
          rawDevices = result
        } else if (result && typeof result === 'object') {
          if (result.data && Array.isArray(result.data)) {
            rawDevices = result.data
          } else if (result.instances && Array.isArray(result.instances)) {
            rawDevices = result.instances
          } else if (result.phones && Array.isArray(result.phones)) {
            rawDevices = result.phones
          } else if (result.devices && Array.isArray(result.devices)) {
            rawDevices = result.devices
          } else {
            const vals = Object.values(result)
            const objectVals = vals.filter(
              (v) =>
                typeof v === 'object' &&
                v !== null &&
                ('id' in (v as any) ||
                  'phone_id' in (v as any) ||
                  'instance_id' in (v as any) ||
                  'key' in (v as any)),
            )
            if (objectVals.length > 0) {
              rawDevices = objectVals
            } else {
              rawDevices = [result]
            }
          }
        } else {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'Formato inválido retornado pela API do ChatGuru',
            details: { rawResponse: text, endpoint },
          })
          return new Response(
            JSON.stringify({
              success: false,
              error: 'URL do Endpoint inválida ou não suportada.',
              details: JSON.stringify(result).substring(0, 100),
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        // Normalize output
        devices = rawDevices
          .map((d: any) => {
            const deviceId = d.id || d.phone_id || d.instance_id || d.key
            const deviceName =
              d.name || d.phone_name || d.number || d.phone_number || 'Aparelho Desconhecido'
            return {
              id: String(deviceId),
              name: String(deviceName),
              status: d.status || 'unknown',
              raw: d,
            }
          })
          .filter((d: any) => d.id && d.id !== 'undefined' && d.id !== 'null')
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Falha ao conectar ao Endpoint informado. Verifique a URL e tente novamente.',
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
      .select(
        'id, web_api_key, web_instance_id, verify_token, chatguru_account_id, chatguru_endpoint_url',
      )
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
    const endpoint = config.chatguru_endpoint_url
      ? config.chatguru_endpoint_url.endsWith('/')
        ? config.chatguru_endpoint_url.slice(0, -1)
        : config.chatguru_endpoint_url
      : 'https://chatguru.app/api/v1'
    const chatGuruUrl = `${endpoint}?action=webhook_config`

    let response
    try {
      const payload: any = {
        key,
        webhook_url: webhookUrl,
      }

      if (phone_id) {
        payload.phone_id = phone_id
      }

      if (config.chatguru_account_id) {
        payload.account_id = config.chatguru_account_id
      }

      response = await fetch(chatGuruUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
