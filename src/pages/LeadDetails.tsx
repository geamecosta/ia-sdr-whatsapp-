import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function LeadDetails() {
  const { id } = useParams()
  const [lead, setLead] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchLead() {
      if (!id) return
      try {
        const { data: leadData } = await supabase.from('leads').select('*').eq('id', id).single()
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: true })

        if (mounted) {
          setLead(leadData)
          setMessages(messagesData || [])
          setLoading(false)
        }
      } catch (e) {
        console.error(e)
        if (mounted) setLoading(false)
      }
    }
    fetchLead()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Lead não encontrado</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/leads">Voltar para Leads</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/leads">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Detalhes do Lead</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{lead.name || 'Desconhecido'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <strong>Telefone:</strong> {lead.phone_number}
          </p>
          <p>
            <strong>Status:</strong> {lead.status || 'Novo'}
          </p>
          <p>
            <strong>Data de Entrada:</strong> {new Date(lead.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Histórico de Conversa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma mensagem registrada.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col p-3 rounded-lg max-w-[85%] ${
                  msg.role === 'user' ? 'bg-muted ml-0' : 'bg-primary/10 ml-auto'
                }`}
              >
                <span className="text-xs text-muted-foreground mb-1">
                  {msg.role === 'user' ? lead.name : 'SDR AI'} -{' '}
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
