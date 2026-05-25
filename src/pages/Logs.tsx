import { useEffect, useState } from 'react'
import { db } from '@/services/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    db.getLogs()
      .then((data) => {
        if (mounted) {
          setLogs(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Execução</h1>
        <p className="text-muted-foreground">Histórico completo de atividades do sistema.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Carregando...</p>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum log encontrado.
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <div className="flex items-start p-4 gap-4">
                <div className="mt-1">
                  {log.level === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : log.level === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.details && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
                <div
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full',
                    log.level === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : log.level === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  )}
                >
                  {log.level}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
