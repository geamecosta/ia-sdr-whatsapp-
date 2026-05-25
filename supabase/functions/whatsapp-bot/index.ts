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

                await supabase.from('execution_logs').insert({
                  user_id: config.user_id,
                  level: 'info',
                  message: `Mensagem recebida de ${senderName} (${fromPhone})`,
                  details: { text: msgText },
                })

                // Securely upsert the lead handling concurrent webhook triggers
                let leadId: string | null = null

                const { data: existingLead } = await supabase
                  .from('leads')
                  .select('*')
                  .eq('user_id', config.user_id)
                  .eq('phone_number', fromPhone)
                  .single()

                if (!existingLead) {
                  const { data: newLead, error: insertError } = await supabase
                    .from('leads')
                    .insert({
                      user_id: config.user_id,
                      phone_number: fromPhone,
                      name: senderName,
                      status: 'Novo',
                    })
                    .select()
                    .single()

                  if (insertError && insertError.code === '23505') {
                    // Unique constraint violation means another request created it just now
                    const { data: recoveredLead } = await supabase
                      .from('leads')
                      .select('*')
                      .eq('user_id', config.user_id)
                      .eq('phone_number', fromPhone)
                      .single()
                    leadId = recoveredLead?.id
                  } else {
                    leadId = newLead?.id
                  }
                } else {
                  leadId = existingLead.id
                  await supabase
                    .from('leads')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', leadId)
                }

                if (!leadId) continue

                await supabase.from('messages').insert({
                  lead_id: leadId,
                  role: 'user',
                  content: msgText,
                })

                const { data: history } = await supabase
                  .from('messages')
                  .select('role, content')
                  .eq('lead_id', leadId)
                  .order('created_at', { ascending: false })
                  .limit(10)

                const aiResponseText = `Olá, ${senderName}! Recebemos: "${msgText}". [Simulação SDR - Tom: "${settings?.tone_of_voice || 'Padrão'}"]`

                await supabase.from('messages').insert({
                  lead_id: leadId,
                  role: 'assistant',
                  content: aiResponseText,
                })

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
      } else if (body.event === 'messages.upsert' || body.instance) {
        const instanceId = body.instance
        const msgData = body.data?.message
        const fromMe = body.data?.key?.fromMe
        const remoteJid = body.data?.key?.remoteJid

        if (!fromMe && msgData && instanceId && remoteJid) {
          const { data: config } = await supabase
            .from('whatsapp_configs')
            .select('user_id, web_api_key, connection_type')
            .eq('web_instance_id', instanceId)
            .eq('connection_type', 'web')
            .single()

          if (config) {
            const senderName = body.data?.pushName || 'Desconhecido'
            const msgText = msgData.conversation || msgData.extendedTextMessage?.text || ''
            const fromPhone = remoteJid.replace('@s.whatsapp.net', '')

            if (msgText) {
              await supabase.from('execution_logs').insert({
                user_id: config.user_id,
                level: 'info',
                message: `Mensagem recebida via Instância Web de ${senderName} (${fromPhone})`,
                details: { text: msgText },
              })
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
