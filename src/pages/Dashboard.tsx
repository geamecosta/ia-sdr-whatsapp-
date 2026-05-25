import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Users, MessageSquare, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    leads: 0,
    messagesReceived: 0,
    aiActivity: 0,
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const [{ count: leads }, { count: received }, { count: ai }, { data: logs }] =
        await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'assistant'),
          supabase
            .from('execution_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      setStats({
        leads: leads || 0,
        messagesReceived: received || 0,
        aiActivity: ai || 0,
      })

      if (logs) setRecentLogs(logs)
    }

    fetchData()

    const leadsSub = supabase
      .channel('leads-changes-dash')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` },
        () => {
          fetchData()
        },
      )
      .subscribe()

    const messagesSub = supabase
      .channel('messages-changes-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchData()
      })
      .subscribe()

    const logsSub = supabase
      .channel('logs-changes-dash')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setRecentLogs((current) => [payload.new, ...current].slice(0, 5))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(leadsSub)
      supabase.removeChannel(messagesSub)
      supabase.removeChannel(logsSub)
    }
  }, [user])

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu assistente virtual SDR.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">Registrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Mensagens Recebidas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesReceived}</div>
            <p className="text-xs text-muted-foreground">Interações até o momento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Atividade da IA</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiActivity}</div>
            <p className="text-xs text-muted-foreground">Respostas geradas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimos eventos do sistema.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/logs">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              Nenhuma atividade recente.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm p-3 border rounded-md bg-muted/20">
                  <div className="mt-0.5">{getLogIcon(log.level)}</div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-foreground">{log.message}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
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
