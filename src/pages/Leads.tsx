import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, User } from 'lucide-react'

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setLeads(data)
      setLoading(false)
    }
    fetchLeads()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe as conversas com seus potenciais clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Leads</CardTitle>
          <CardDescription>Lista de contatos que interagiram com a sua IA.</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              Nenhum lead encontrado ainda. Quando a IA conversar com alguém, o contato aparecerá
              aqui.
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="font-medium text-base">{lead.name || lead.phone_number}</div>
                    <div className="text-sm text-muted-foreground">{lead.phone_number}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {lead.status}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/leads/${lead.id}`}>Ver Conversa</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
