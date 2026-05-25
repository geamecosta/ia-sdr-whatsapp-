import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

export default function Logs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('execution_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogs(data)
      setLoading(false)
    }
    fetchLogs()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
        <p className="text-muted-foreground">Histórico de eventos e execuções do seu assistente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Eventos</CardTitle>
          <CardDescription>Exibindo os 100 logs mais recentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              Nenhum log registrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm p-3 border rounded-md bg-muted/20">
                  <div className="mt-0.5">{getLogIcon(log.level)}</div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-foreground">{log.message}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto border">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
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
