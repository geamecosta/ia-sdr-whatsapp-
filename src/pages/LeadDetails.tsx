import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/services/db'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Bot, User, Clock } from 'lucide-react'

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      loadData()
      const channel = supabase
        .channel(`messages_${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new])
          },
        )
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    if (!id) return
    try {
      const [leadData, messagesData] = await Promise.all([db.getLead(id), db.getMessages(id)])
      setLead(leadData)
      setMessages(messagesData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !id) return
    setSending(true)
    try {
      await db.sendMessage(id, replyText)
      setReplyText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>
  if (!lead) return <div className="p-8">Lead não encontrado.</div>

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.name || 'Sem nome'}</h1>
            <p className="text-sm text-muted-foreground">{lead.phone_number}</p>
          </div>
          <Badge variant="outline" className="text-sm py-1">
            Status: {lead.status}
          </Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Histórico da Conversa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhuma mensagem registrada.
            </div>
          ) : (
            messages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div
                  key={msg.id || i}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`flex max-w-[85%] sm:max-w-[70%] gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div
                      className={`p-3 rounded-lg text-sm ${isAssistant ? 'bg-muted text-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[10px] opacity-70 block mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-3 border-t bg-background">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <Input
              placeholder="Digite uma mensagem (Apenas logado na tela)..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || !replyText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
