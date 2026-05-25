import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, User, Bot } from 'lucide-react'

export default function LeadDetails() {
  const { id } = useParams()
  const [lead, setLead] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      const [leadRes, messagesRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).single(),
        supabase
          .from('messages')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: true }),
      ])

      if (leadRes.data) setLead(leadRes.data)
      if (messagesRes.data) setMessages(messagesRes.data)

      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${id}` },
        (payload) => {
          setMessages((current) => {
            if (current.some((m) => m.id === payload.new.id)) return current
            return [...current, payload.new]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Lead não encontrado</h2>
        <Button asChild>
          <Link to="/leads">Voltar para Leads</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link to="/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lead.name || lead.phone_number}</h1>
          <p className="text-muted-foreground">
            {lead.phone_number} • Status: {lead.status}
          </p>
        </div>
      </div>

      <Card className="flex flex-col h-[600px]">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-lg">Histórico da Conversa</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhuma mensagem registrada ainda.
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1 ${isAssistant ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
