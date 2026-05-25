import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

function normalizeUrl(url: string) {
  let normalized = url.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }
  return normalized
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

    const key = body.api_key || config.web_api_key
    const phone_id = body.phone_id || config.web_instance_id
    const chatguru_account_id = body.account_id || config.chatguru_account_id
    const chatguru_endpoint_url = body.endpoint_url || config.chatguru_endpoint_url

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

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-bot?user_id=${user.id}&token=${verifyToken}`

    const normalizedEndpoint = normalizeUrl(chatguru_endpoint_url || 'https://chatguru.app/api/v1')
    let parsedUrl
    try {
      parsedUrl = new URL(normalizedEndpoint)
    } catch (e) {
      parsedUrl = new URL('https://chatguru.app/api/v1')
    }

    // Protocol Enforcement
    parsedUrl.protocol = 'https:'

    // Endpoint Normalization
    let baseUrl = parsedUrl.origin
    let path = parsedUrl.pathname

    if (!path || path === '/') {
      path = '/api/v1'
    }
    if (path.endsWith('/')) {
      path = path.slice(0, -1)
    }

    let chatGuruUrl = `${baseUrl}${path}`
    if (!chatGuruUrl.includes('action=webhook_config')) {
      chatGuruUrl += `${chatGuruUrl.includes('?') ? '&' : '?'}action=webhook_config`
    }

    let response
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: key,
      'X-API-KEY': key,
      key: key,
    }
    if (chatguru_account_id) {
      requestHeaders['X-ACCOUNT-ID'] = chatguru_account_id
      requestHeaders['account'] = chatguru_account_id
      requestHeaders['account_id'] = chatguru_account_id
    }

    const payload: any = {
      key,
      account_id: chatguru_account_id,
      phone_id: phone_id,
      webhook_url: webhookUrl,
    }

    try {
      response = await fetch(chatGuruUrl, {
        method: 'POST',
        headers: requestHeaders,
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
      await supabase.from('execution_logs').insert({
        user_id: user.id,
        level: 'error',
        message: 'Erro de comunicação com o ChatGuru',
        details: {
          endpoint: chatGuruUrl,
          statusCode: response?.status,
          responseBody: text,
          requestHeaders: {
            ...requestHeaders,
            Authorization: '***MASKED***',
            'X-API-KEY': '***MASKED***',
            key: '***MASKED***',
          },
          payload: { ...payload, key: '***MASKED***' },
        },
      })

      let errorMessage = 'A API Key ou Phone ID podem ser inválidos.'
      if (jsonResponse) {
        errorMessage = jsonResponse.error || jsonResponse.message || errorMessage
      } else if (text) {
        errorMessage = text.length > 150 ? text.substring(0, 150) + '...' : text
        if (errorMessage.toLowerCase().includes('<html')) {
          errorMessage =
            'O servidor retornou uma página HTML indicando erro na rota (ex: 404). Verifique a URL do ChatGuru.'
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro de comunicação com o ChatGuru',
          details: errorMessage,
          statusCode: response?.status,
        }),
        {
          status: response.status >= 400 ? response.status : 400,
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
