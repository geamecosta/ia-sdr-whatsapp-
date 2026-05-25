import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react'

export function LogsSettings() {
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
        .limit(20)

      if (data) setLogs(data)
      setLoading(false)
    }
    fetchLogs()

    const channel = supabase
      .channel('settings-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setLogs((current) => [payload.new, ...current].slice(0, 20))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>
          Últimos 20 eventos e execuções para diagnóstico de falhas.
        </CardDescription>
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <span className="font-medium text-foreground">{log.message}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {log.details && (
                    <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto border text-muted-foreground">
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
  )
}
