import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)
const openAiKey = Deno.env.get('OPENAI_API_KEY') || ''

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
      } else if (body.chat_id || (body.message && body.message.chat_id) || body.text) {
        // ChatGuru Payload
        const msg = body.message || body
        const fromPhone = String(msg.chat_id || body.chat_id || '')
          .replace('@c.us', '')
          .replace('@s.whatsapp.net', '')
        const text = msg.text || body.text || ''
        const msgId = msg.id || body.id || `cg_${Date.now()}`
        const phoneId = body.phone_id || msg.phone_id

        // Ignora mensagens enviadas pelo próprio bot ou sem texto
        if (fromPhone && text && !msg.from_me) {
          events.push({
            type: 'chatguru',
            instanceId: phoneId,
            fromPhone,
            senderName: msg.sender_name || body.sender_name || 'Desconhecido',
            msgText: text,
            msgId,
          })
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

      const url = new URL(req.url)
      const userIdQuery = url.searchParams.get('user_id')
      const tokenQuery = url.searchParams.get('token')

      for (const event of events) {
        if (!event.msgText) continue

        let configQuery = supabase
          .from('whatsapp_configs')
          .select(
            'user_id, access_token, web_api_key, web_instance_id, connection_type, verify_token, chatguru_endpoint_url',
          )
        if (event.type === 'official') {
          configQuery = configQuery.eq('phone_number_id', event.phoneNumberId).single()
        } else if (event.type === 'chatguru') {
          if (userIdQuery) {
            configQuery = configQuery
              .eq('user_id', userIdQuery)
              .eq('connection_type', 'chatguru')
              .single()
          } else if (event.instanceId) {
            configQuery = configQuery
              .eq('web_instance_id', event.instanceId)
              .eq('connection_type', 'chatguru')
              .single()
          } else {
            continue // Cannot securely identify ChatGuru account
          }
        } else {
          if (userIdQuery) {
            configQuery = configQuery
              .eq('user_id', userIdQuery)
              .eq('connection_type', 'web')
              .single()
          } else {
            configQuery = configQuery
              .eq('web_instance_id', event.instanceId)
              .eq('connection_type', 'web')
              .single()
          }
        }

        const { data: config } = await configQuery
        if (!config) continue

        try {
          if (event.type === 'chatguru' || event.type === 'web') {
            if (config.verify_token && config.verify_token !== tokenQuery) {
              await supabase.from('execution_logs').insert({
                user_id: config.user_id,
                level: 'error',
                message: 'Webhook bloqueado: Token de verificação inválido',
                details: { type: event.type, providedToken: tokenQuery },
              })
              continue
            }
          }

          // Register heartbeat and online status
          await supabase
            .from('whatsapp_configs')
            .update({ status: 'connected', last_heartbeat: new Date().toISOString() })
            .eq('user_id', config.user_id)

          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'info',
            message: `Request Received: Mensagem de ${event.senderName} (${event.fromPhone}) via ${event.type}`,
            details: { text: event.msgText, msgId: event.msgId },
          })

          let { data: settings } = await supabase
            .from('company_settings')
            .select('*')
            .eq('user_id', config.user_id)
            .eq('whatsapp_config_id', config.id)
            .maybeSingle()
          if (!settings) {
            const { data: defaultSettings } = await supabase
              .from('company_settings')
              .select('*')
              .eq('user_id', config.user_id)
              .is('whatsapp_config_id', null)
              .maybeSingle()
            settings = defaultSettings
          }

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

          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'info',
            message: `Lead Identified: ${isNewLead ? 'Novo' : 'Existente'} lead (${event.fromPhone})`,
            details: { leadId },
          })

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

          // Check token quota
          let quota = null
          try {
            const { data, error } = await supabase
              .from('usage_quotas')
              .select(
                'id, is_blocked, current_month_usage, monthly_token_limit, cost_per_1k_tokens, alert_80_sent_at',
              )
              .eq('user_id', config.user_id)
              .single()
            if (error && error.code !== 'PGRST116') throw error // Ignore not found error as it might not exist
            quota = data
          } catch (dbError: any) {
            await supabase.from('execution_logs').insert({
              user_id: config.user_id,
              level: 'error',
              message: 'Erro ao verificar quotas de uso',
              details: { error: dbError.message || dbError },
            })
          }

          if (
            quota &&
            (quota.is_blocked || quota.current_month_usage >= quota.monthly_token_limit)
          ) {
            const blockedText =
              'No momento, nosso assistente virtual está indisponível. Aguarde que um humano assumirá o atendimento.'
            await supabase.from('execution_logs').insert({
              user_id: config.user_id,
              level: 'warning',
              message: `Quota exceeded for user ${config.user_id}`,
              details: {
                leadId,
                usage: quota.current_month_usage,
                limit: quota.monthly_token_limit,
                isBlocked: quota.is_blocked,
              },
            })
            await sendWhatsAppMessage(event, config, blockedText, event.fromPhone, supabase)
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

          // Generate AI response
          let aiResponseText = ''

          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'info',
            message: `Iniciando geração de resposta com IA`,
            details: { leadId },
          })

          try {
            if (openAiKey) {
              const openai = new OpenAI({ apiKey: openAiKey })

              const { data: recentMessages } = await supabase
                .from('messages')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false })
                .limit(15)

              const messageHistory = (recentMessages || []).reverse().map((m: any) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content,
              }))

              const systemPrompt =
                settings?.system_prompt ||
                'Você é um assistente virtual de vendas útil e prestativo.'
              const tone = settings?.tone_of_voice || 'Profissional e educado'
              const manual = settings?.sales_manual || 'Nenhuma informação adicional fornecida.'
              const companyObjectives = settings?.company_objectives || 'Atender bem os clientes.'

              const fullSystemPrompt = `${systemPrompt}\n\nTom de Voz: ${tone}\nObjetivos: ${companyObjectives}\n\nManual de Vendas / Informações da Empresa:\n${manual}`

              // @ts-ignore
              const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: fullSystemPrompt }, ...messageHistory],
              })

              aiResponseText =
                completion.choices[0]?.message?.content ||
                'Desculpe, não consegui processar sua mensagem.'

              // Log Token Usage
              const usage = completion.usage
              if (usage) {
                const promptTokens = usage.prompt_tokens || 0
                const completionTokens = usage.completion_tokens || 0
                const totalTokens = usage.total_tokens || 0
                const costPer1k =
                  quota?.cost_per_1k_tokens !== undefined ? quota.cost_per_1k_tokens : 0.02
                const costEstimate = (totalTokens / 1000) * costPer1k

                await supabase.from('usage_logs').insert({
                  user_id: config.user_id,
                  tokens_prompt: promptTokens,
                  tokens_completion: completionTokens,
                  total_tokens: totalTokens,
                  cost_estimate: costEstimate,
                })

                await supabase.rpc('increment_usage', {
                  p_user_id: config.user_id,
                  p_tokens: totalTokens,
                })

                if (quota && quota.monthly_token_limit > 0) {
                  const newUsage = quota.current_month_usage + totalTokens
                  const limit = quota.monthly_token_limit
                  const threshold = limit * 0.8

                  if (newUsage >= threshold) {
                    let shouldAlert = false
                    if (!quota.alert_80_sent_at) {
                      shouldAlert = true
                    } else {
                      const lastAlertDate = new Date(quota.alert_80_sent_at)
                      const now = new Date()
                      if (
                        lastAlertDate.getMonth() !== now.getMonth() ||
                        lastAlertDate.getFullYear() !== now.getFullYear()
                      ) {
                        shouldAlert = true
                      }
                    }

                    if (shouldAlert) {
                      const warningMsg =
                        'Aviso: Você atingiu 80% da sua cota de mensagens deste mês.'
                      await sendWhatsAppMessage(
                        event,
                        config,
                        warningMsg,
                        event.fromPhone,
                        supabase,
                      )
                      await supabase
                        .from('usage_quotas')
                        .update({ alert_80_sent_at: new Date().toISOString() })
                        .eq('user_id', config.user_id)

                      await supabase.from('execution_logs').insert({
                        user_id: config.user_id,
                        level: 'warning',
                        message: 'Alerta de 80% de cota enviado via WhatsApp',
                        details: { leadId, newUsage, threshold },
                      })
                    }
                  }
                }
              }
            } else {
              aiResponseText = `Olá, ${event.senderName}! Recebemos: "${event.msgText}".\n\n[Aviso: Chave da OpenAI não configurada. Simulação Ativa]\nTom: "${settings?.tone_of_voice || 'Padrão'}"`
              await supabase.from('execution_logs').insert({
                user_id: config.user_id,
                level: 'warning',
                message: `Chave OpenAI (OPENAI_API_KEY) não configurada no servidor. Usando resposta simulada.`,
                details: { leadId },
              })
            }
          } catch (error: any) {
            aiResponseText = `Olá! Recebi sua mensagem, mas ocorreu um erro temporário no processamento da AI.`
            await supabase.from('execution_logs').insert({
              user_id: config.user_id,
              level: 'error',
              message: `OpenAI API Error`,
              details: { error: error.message || error.toString() },
            })
          }

          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'info',
            message: `AI Response Generated`,
            details: { responseText: aiResponseText },
          })

          await supabase.from('messages').insert({
            lead_id: leadId,
            role: 'assistant',
            content: aiResponseText,
          })

          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'info',
            message: `API Call Sent: Enviando resposta para o provedor ${event.type}`,
            details: { leadId },
          })

          await sendWhatsAppMessage(event, config, aiResponseText, event.fromPhone, supabase)
        } catch (eventError: any) {
          await supabase.from('execution_logs').insert({
            user_id: config.user_id,
            level: 'error',
            message: 'Unhandled Exception Processing Event',
            details: { error: eventError.message || eventError.toString() },
          })
        }
      }

      return new Response('OK', { status: 200 })
    } catch (error: any) {
      console.error(error)
      // Attempt to log generic error to a known user if possible (from url params if ChatGuru)
      const url = new URL(req.url)
      const userIdQuery = url.searchParams.get('user_id')
      if (userIdQuery) {
        await supabase.from('execution_logs').insert({
          user_id: userIdQuery,
          level: 'error',
          message: 'Unhandled Exception in Edge Function',
          details: { error: error.message || error.toString() },
        })
      }
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
        message: `Database Connection Error / WhatsApp API Error`,
        details: { error_data: errData, connection: true, to },
      })
      await supabaseClient
        .from('whatsapp_configs')
        .update({ status: 'error' })
        .eq('user_id', config.user_id)
    }
  } else if (event.type === 'chatguru') {
    if (!config.web_api_key || !config.web_instance_id) {
      await supabaseClient.from('execution_logs').insert({
        user_id: config.user_id,
        level: 'error',
        message: `Credenciais do ChatGuru ausentes (API Key ou Instance ID).`,
        details: { to },
      })
      return
    }
    // Envio via ChatGuru API
    try {
      const endpoint = config.chatguru_endpoint_url
        ? config.chatguru_endpoint_url.endsWith('/')
          ? config.chatguru_endpoint_url.slice(0, -1)
          : config.chatguru_endpoint_url
        : 'https://chatguru.app/api/v1'
      const cgResponse = await fetch(`${endpoint}?action=send_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.web_api_key,
          phone_id: config.web_instance_id,
          chat_id: to,
          text: text,
        }),
      })

      if (cgResponse.ok) {
        await supabaseClient.from('execution_logs').insert({
          user_id: config.user_id,
          level: 'success',
          message: `Resposta enviada para ${to} via ChatGuru`,
          details: { text: text },
        })
      } else {
        let errData = await cgResponse.text()
        // Mask API Key if it leaked in error
        if (config.web_api_key) {
          errData = errData.split(config.web_api_key).join('***MASKED_API_KEY***')
        }
        await supabaseClient.from('execution_logs').insert({
          user_id: config.user_id,
          level: 'error',
          message: `Database Connection Error / ChatGuru API Error`,
          details: { error_data: errData, connection: true, to },
        })
        await supabaseClient
          .from('whatsapp_configs')
          .update({ status: 'error' })
          .eq('user_id', config.user_id)
      }
    } catch (e: any) {
      await supabaseClient.from('execution_logs').insert({
        user_id: config.user_id,
        level: 'error',
        message: `Database Connection Error`,
        details: { error: e.message },
      })
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
