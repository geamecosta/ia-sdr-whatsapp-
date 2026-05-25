import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (token && challenge) {
      const { data } = await supabase
        .from('whatsapp_configs')
        .select('id')
        .eq('verify_token', token)
        .limit(1)
      if (data && data.length > 0) {
        return new Response(challenge, { status: 200 })
      }
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              const phoneNumberId = change.value.metadata.phone_number_id

              const { data: config } = await supabase
                .from('whatsapp_configs')
                .select('user_id, access_token')
                .eq('phone_number_id', phoneNumberId)
                .single()

              if (!config) continue

              const { data: settings } = await supabase
                .from('company_settings')
                .select('*')
                .eq('user_id', config.user_id)
                .single()

              for (const message of change.value.messages) {
                const contact = change.value.contacts?.[0]
                const senderName = contact?.profile?.name || 'Desconhecido'
                const fromPhone = message.from
                const msgText = message.text?.body || ''

                if (!msgText) continue

                // Log incoming message
                await supabase.from('execution_logs').insert({
                  user_id: config.user_id,
                  level: 'info',
                  message: `Mensagem recebida de ${senderName} (${fromPhone})`,
                  details: { text: msgText },
                })

                let { data: lead } = await supabase
                  .from('leads')
                  .select('*')
                  .eq('user_id', config.user_id)
                  .eq('phone_number', fromPhone)
                  .single()

                if (!lead) {
                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      user_id: config.user_id,
                      phone_number: fromPhone,
                      name: senderName,
                      status: 'Novo',
                    })
                    .select()
                    .single()
                  lead = newLead
                } else {
                  await supabase
                    .from('leads')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', lead.id)
                }

                await supabase.from('messages').insert({
                  lead_id: lead.id,
                  role: 'user',
                  content: msgText,
                })

                // Context retrieval for AI (Placeholder)
                const { data: history } = await supabase
                  .from('messages')
                  .select('role, content')
                  .eq('lead_id', lead.id)
                  .order('created_at', { ascending: false })
                  .limit(10)

                // MOCK AI RESPONSE logic based on settings
                const aiResponseText = `Olá, ${senderName}! Recebemos: "${msgText}". [Isto é uma simulação do SDR Automático utilizando o tom "${settings?.tone_of_voice || 'Padrão'}"].`

                await supabase.from('messages').insert({
                  lead_id: lead.id,
                  role: 'assistant',
                  content: aiResponseText,
                })

                // Send reply via WhatsApp API
                const waResponse = await fetch(
                  `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${config.access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messaging_product: 'whatsapp',
                      to: fromPhone,
                      type: 'text',
                      text: { body: aiResponseText },
                    }),
                  },
                )

                if (waResponse.ok) {
                  await supabase.from('execution_logs').insert({
                    user_id: config.user_id,
                    level: 'success',
                    message: `Resposta enviada para ${senderName}`,
                    details: { text: aiResponseText },
                  })
                } else {
                  const errData = await waResponse.json().catch(() => ({}))
                  await supabase.from('execution_logs').insert({
                    user_id: config.user_id,
                    level: 'error',
                    message: `Erro ao enviar mensagem para ${senderName}`,
                    details: errData,
                  })
                }
              }
            }
          }
        }
      }
      return new Response('OK', { status: 200 })
    } catch (error: any) {
      console.error(error)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})
