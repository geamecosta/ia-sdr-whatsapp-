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

    if (body.action === 'fetch_devices') {
      const { web_api_key, chatguru_account_id, chatguru_endpoint_url } = body
      if (!web_api_key || !chatguru_account_id || !chatguru_endpoint_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credenciais ou Endpoint URL ausentes' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      let devices = []
      const normalizedEndpoint = normalizeUrl(chatguru_endpoint_url)

      let parsedUrl
      try {
        parsedUrl = new URL(normalizedEndpoint)
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, error: 'URL do Endpoint mal formatada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      let baseListUrl = parsedUrl.toString()
      if (
        !baseListUrl.includes('/devices') &&
        !baseListUrl.includes('/chats') &&
        !baseListUrl.includes('/phones') &&
        !baseListUrl.includes('action=')
      ) {
        const separator = baseListUrl.includes('?') ? '&' : '?'
        baseListUrl = `${baseListUrl}${separator}action=phones`
      }

      try {
        let chatGuruUrl = baseListUrl

        // AC: Redundant Authentication Payload (Headers + Body)
        let requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          key: web_api_key,
          account_id: chatguru_account_id,
          account: chatguru_account_id,
          // Keep backwards compatibility headers
          Authorization: web_api_key,
          'X-API-KEY': web_api_key,
          'X-ACCOUNT-ID': chatguru_account_id,
        }

        let requestBody = {
          key: web_api_key,
          account_id: chatguru_account_id,
          account: chatguru_account_id,
        }

        // AC: Forced POST Communication Protocol
        let methodUsed = 'POST'

        let response = await fetch(chatGuruUrl, {
          method: methodUsed,
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        })

        let text = await response.text()
        let statusCode = response.status

        if (statusCode >= 400 || !response.ok) {
          const maskedUrl = chatGuruUrl.replace(web_api_key, '***MASKED_API_KEY***')
          // AC: Enhanced Debugging and Logging
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'ChatGuru Connection Failure',
            details: {
              request_url: maskedUrl,
              method: methodUsed,
              sent_params: { account_id: chatguru_account_id, has_api_key: !!web_api_key },
              raw_response_body: text,
              statusCode,
              requestHeaders: {
                ...requestHeaders,
                Authorization: '***MASKED***',
                'X-API-KEY': '***MASKED***',
                key: '***MASKED***',
              },
            },
          })

          let errorMsg = `Erro na API (${statusCode}): Falha na comunicação com o ChatGuru.`

          let serverDescription = ''
          try {
            const parsed = JSON.parse(text)
            serverDescription = parsed.description || parsed.error || parsed.message || ''
          } catch (e) {}

          if (serverDescription) {
            errorMsg = `Erro ${statusCode}: ${serverDescription}`
          } else if (statusCode === 404) {
            errorMsg = `Endpoint não encontrado (404). Verifique a URL: ${chatGuruUrl}`
          } else if (
            statusCode === 401 ||
            statusCode === 403 ||
            text.toLowerCase().includes('unauthorized') ||
            text.toLowerCase().includes('invalid')
          ) {
            errorMsg = 'Credenciais inválidas: Verifique seu Account ID e API Key.'
          } else if (statusCode === 400) {
            errorMsg = `Requisição inválida (400). Detalhes: ${serverDescription || text.substring(0, 100)}`
          }

          return new Response(JSON.stringify({ success: false, error: errorMsg, details: text }), {
            status: statusCode === 200 ? 400 : statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        let result
        try {
          result = JSON.parse(text)
        } catch (e) {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'ChatGuru Connection Failed',
            details: {
              endpoint: normalizedEndpoint,
              statusCode,
              responseBody: text,
              error: 'Parse error',
            },
          })
          return new Response(
            JSON.stringify({ success: false, error: 'Resposta inválida da API do ChatGuru.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        if (result && result.error) {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'ChatGuru Connection Failed',
            details: {
              endpoint: normalizedEndpoint,
              statusCode,
              responseBody: text,
              error: result.error,
            },
          })
          return new Response(
            JSON.stringify({ success: false, error: 'Erro retornado pela API: ' + result.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        let rawDevices: any[] = []

        // Deep Response Mapping
        const extractDevices = (obj: any): any[] => {
          if (!obj) return []
          if (Array.isArray(obj)) return obj
          if (typeof obj === 'object') {
            if (obj.data && Array.isArray(obj.data)) return obj.data
            if (obj.instances && Array.isArray(obj.instances)) return obj.instances
            if (obj.phones && Array.isArray(obj.phones)) return obj.phones
            if (obj.devices && Array.isArray(obj.devices)) return obj.devices

            for (const key of Object.keys(obj)) {
              if (
                Array.isArray(obj[key]) &&
                obj[key].length > 0 &&
                typeof obj[key][0] === 'object'
              ) {
                return obj[key]
              }
            }

            const vals = Object.values(obj)
            const objectVals = vals.filter(
              (v) =>
                typeof v === 'object' &&
                v !== null &&
                ('id' in (v as any) ||
                  'phone_id' in (v as any) ||
                  'instance_id' in (v as any) ||
                  'key' in (v as any)),
            )
            if (objectVals.length > 0) return objectVals
          }
          return [obj]
        }

        rawDevices = extractDevices(result)

        if (!rawDevices || rawDevices.length === 0 || typeof rawDevices[0] !== 'object') {
          await supabase.from('execution_logs').insert({
            user_id: user.id,
            level: 'error',
            message: 'ChatGuru Connection Failed',
            details: {
              endpoint: normalizedEndpoint,
              statusCode,
              responseBody: text,
              error: 'Formato inválido retornado pela API',
            },
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
        await supabase.from('execution_logs').insert({
          user_id: user.id,
          level: 'error',
          message: 'ChatGuru Connection Failed',
          details: { endpoint: normalizedEndpoint, error: e.message },
        })
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

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-bot?user_id=${user.id}&token=${verifyToken}`

    const normalizedEndpoint = normalizeUrl(
      config.chatguru_endpoint_url || 'https://chatguru.app/api/v1',
    )
    let parsedUrl
    try {
      parsedUrl = new URL(normalizedEndpoint)
    } catch (e) {
      parsedUrl = new URL('https://chatguru.app/api/v1')
    }

    let chatGuruUrl = parsedUrl.toString()
    if (!chatGuruUrl.includes('action=')) {
      const separator = chatGuruUrl.includes('?') ? '&' : '?'
      chatGuruUrl = `${chatGuruUrl}${separator}action=webhook_config`
    }

    let response
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: key,
      'X-API-KEY': key,
      key: key,
    }
    if (config.chatguru_account_id) {
      requestHeaders['X-ACCOUNT-ID'] = config.chatguru_account_id
      requestHeaders['account'] = config.chatguru_account_id
      requestHeaders['account_id'] = config.chatguru_account_id
    }

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
        payload.account = config.chatguru_account_id
      }

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
        message: 'ChatGuru Connection Failed',
        details: {
          endpoint: normalizedEndpoint,
          statusCode: response?.status,
          responseBody: text,
          requestHeaders,
        },
      })
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
