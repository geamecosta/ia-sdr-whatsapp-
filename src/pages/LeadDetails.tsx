import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [lead, setLead] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !id) return

    const fetchLeadAndMessages = async () => {
      const { data: leadData } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (leadData) setLead(leadData)

      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true })

      if (msgData) {
        setMessages(msgData)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }

    fetchLeadAndMessages()

    const channel = supabase
      .channel(`public:messages:lead_id=${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${id}` },
        (payload) => {
          setMessages((current) => [...current, payload.new])
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, id])

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Carregando lead...</div>

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link to="/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {lead.name || 'Lead Desconhecido'}
          </h1>
          <div className="flex items-center text-muted-foreground text-sm gap-4 mt-1">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {lead.phone_number}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Criado em{' '}
              {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-[400px] border shadow-sm">
        <CardHeader className="py-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            Histórico da Conversa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] rounded-lg p-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-card ml-auto rounded-tr-sm border'
                  : 'bg-primary text-primary-foreground mr-auto rounded-tl-sm'
              }`}
            >
              <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
              <span
                className={`text-[10px] mt-2 font-medium ${msg.role === 'user' ? 'text-muted-foreground text-right' : 'text-primary-foreground/70 text-left'}`}
              >
                {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Nenhuma mensagem registrada nesta conversa ainda.
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>
    </div>
  )
}
