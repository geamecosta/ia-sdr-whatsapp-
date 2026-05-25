import { useEffect, useState } from 'react'
import { db } from '@/services/db'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ShieldCheck, Info, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'connection'>('all')
  const [isRetrying, setIsRetrying] = useState(false)
  const { toast } = useToast()

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

  const handleRetryConnection = async () => {
    setIsRetrying(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await db.updateWhatsappConfig(user.id, { status: 'connecting' })
        toast({ title: 'Reconectando...', description: 'Uma tentativa de conexão foi iniciada.' })
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao tentar reconectar.' })
    }
    setIsRetrying(false)
  }

  const filteredLogs = logs.filter((log) => {
    if (filter === 'connection') {
      const msg = log.message.toLowerCase()
      const isConnectionMsg =
        msg.includes('conexão') ||
        msg.includes('webhook') ||
        msg.includes('instância') ||
        msg.includes('erro ao enviar')
      const hasConnectionDetails =
        log.details && (log.details.connection || log.details.error || log.details.error_data)
      return isConnectionMsg || hasConnectionDetails
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Execução</h1>
          <p className="text-muted-foreground">Histórico completo de atividades do sistema.</p>
        </div>
        <Button
          onClick={handleRetryConnection}
          disabled={isRetrying}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Tentando reconectar...' : 'Testar Conexão'}
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos os Logs</TabsTrigger>
          <TabsTrigger value="connection">Eventos de Conexão</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {loading ? (
          <p>Carregando...</p>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum log encontrado para o filtro selecionado.
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
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
