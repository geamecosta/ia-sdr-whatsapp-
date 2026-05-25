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
        .select('id, user_id')
        .eq('verify_token', token)
        .limit(1)
      if (data && data.length > 0) {
        // Mark as connected on successful webhook verification
        await supabase
          .from('whatsapp_configs')
          .update({ status: 'connected', last_heartbeat: new Date().toISOString() })
          .eq('id', data[0].id)
        return new Response(challenge, { status: 200 })
      }
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const events: any[] = []

      // Normalize Official vs Web Hook payload
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              const phoneNumberId = change.value.metadata.phone_number_id
              for (const message of change.value.messages) {
                const contact = change.value.contacts?.[0]
                events.push({
                  type: 'official',
                  phoneNumberId,
                  fromPhone: message.from,
                  senderName: contact?.profile?.name || 'Desconhecido',
                  msgText: message.text?.body || '',
                  msgId: message.id,
                })
              }
            }
          }
        }
      } else if (body.event === 'messages.upsert' || body.instance) {
        const instanceId = body.instance
        const msgData = body.data?.message
        const fromMe = body.data?.key?.fromMe
        const remoteJid = body.data?.key?.remoteJid
        const msgId = body.data?.key?.id

        if (!fromMe && msgData && instanceId && remoteJid) {
          events.push({
            type: 'web',
            instanceId,
            fromPhone: remoteJid.replace('@s.whatsapp.net', ''),
            senderName: body.data?.pushName || 'Desconhecido',
            msgText: msgData.conversation || msgData.extendedTextMessage?.text || '',
            msgId: msgId,
          })
        }
      }

      for (const event of events) {
        if (!event.msgText) continue

        let configQuery = supabase
          .from('whatsapp_configs')
          .select('user_id, access_token, web_api_key, connection_type')
        if (event.type === 'official') {
          configQuery = configQuery.eq('phone_number_id', event.phoneNumberId).single()
        } else {
          configQuery = configQuery
            .eq('web_instance_id', event.instanceId)
            .eq('connection_type', 'web')
            .single()
        }

        const { data: config } = await configQuery
        if (!config) continue

        // Register heartbeat and online status
        await supabase
          .from('whatsapp_configs')
          .update({ status: 'connected', last_heartbeat: new Date().toISOString() })
          .eq('user_id', config.user_id)

        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', config.user_id)
          .single()

        await supabase.from('execution_logs').insert({
          user_id: config.user_id,
          level: 'info',
          message: `Mensagem recebida de ${event.senderName} (${event.fromPhone}) via ${event.type}`,
          details: { text: event.msgText, msgId: event.msgId },
        })

        let leadId: string | null = null
        let isNewLead = false

        const { data: existingLead } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', config.user_id)
          .eq('phone_number', event.fromPhone)
          .maybeSingle()

        if (!existingLead) {
          const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert({
              user_id: config.user_id,
              phone_number: event.fromPhone,
              name: event.senderName,
              status: 'Novo',
            })
            .select()
            .single()

          if (insertError && insertError.code === '23505') {
            const { data: recoveredLead } = await supabase
              .from('leads')
              .select('*')
              .eq('user_id', config.user_id)
              .eq('phone_number', event.fromPhone)
              .single()
            leadId = recoveredLead?.id
          } else {
            leadId = newLead?.id
            isNewLead = true
          }
        } else {
          leadId = existingLead.id
          await supabase
            .from('leads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', leadId)
        }

        if (!leadId) continue

        // Save incoming user message with idempotency using provider_message_id
        const { error: msgInsertError } = await supabase.from('messages').insert({
          lead_id: leadId,
          role: 'user',
          content: event.msgText,
          provider_message_id: event.msgId,
        })

        // Unique constraint violation means webhook retry - we shouldn't process it again to prevent double AI responses
        if (msgInsertError && msgInsertError.code === '23505') {
          continue
        }

        // Welcome Message Logic
        if (isNewLead && settings?.welcome_message_enabled && settings?.welcome_message_content) {
          const welcomeText = settings.welcome_message_content

          await supabase.from('messages').insert({
            lead_id: leadId,
            role: 'assistant',
            content: welcomeText,
          })

          await sendWhatsAppMessage(event, config, welcomeText, event.fromPhone, supabase)
        }

        // Send AI response
        const aiResponseText = `Olá, ${event.senderName}! Recebemos: "${event.msgText}". [Simulação SDR - Tom: "${settings?.tone_of_voice || 'Padrão'}"]`

        await supabase.from('messages').insert({
          lead_id: leadId,
          role: 'assistant',
          content: aiResponseText,
        })

        await sendWhatsAppMessage(event, config, aiResponseText, event.fromPhone, supabase)
      }

      return new Response('OK', { status: 200 })
    } catch (error: any) {
      console.error(error)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})

async function sendWhatsAppMessage(
  event: any,
  config: any,
  text: string,
  to: string,
  supabaseClient: any,
) {
  if (event.type === 'official') {
    const waResponse = await fetch(
      `https://graph.facebook.com/v17.0/${event.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: text },
        }),
      },
    )

    if (waResponse.ok) {
      await supabaseClient.from('execution_logs').insert({
        user_id: config.user_id,
        level: 'success',
        message: `Resposta enviada para ${to}`,
        details: { text: text },
      })
    } else {
      const errData = await waResponse.json().catch(() => ({}))
      await supabaseClient.from('execution_logs').insert({
        user_id: config.user_id,
        level: 'error',
        message: `Erro de conexão ao enviar mensagem para ${to}`,
        details: { error_data: errData, connection: true },
      })
      await supabaseClient
        .from('whatsapp_configs')
        .update({ status: 'error' })
        .eq('user_id', config.user_id)
    }
  } else {
    // Simulated web gateway response
    await supabaseClient.from('execution_logs').insert({
      user_id: config.user_id,
      level: 'success',
      message: `Resposta via instância Web enviada para ${to} (Simulado)`,
      details: { text: text },
    })
  }
}
