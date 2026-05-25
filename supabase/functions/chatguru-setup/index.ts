import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { key, phone_id, webhook_url } = await req.json()

    if (!key || !webhook_url) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Tenta registrar o webhook usando a API do ChatGuru
    const chatGuruUrl = `https://api.chatguru.com.br/api/v1?action=webhook_config`

    const response = await fetch(chatGuruUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        webhook_url,
        phone_id: phone_id || undefined,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: 'Erro de comunicação com o ChatGuru', details: text }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook registrado no ChatGuru' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
