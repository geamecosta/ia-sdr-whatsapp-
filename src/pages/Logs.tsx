import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

    const channel = supabase
      .channel('public:execution_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setLogs((current) => [payload.new, ...current].slice(0, 100))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Execução</h1>
        <p className="text-muted-foreground">
          Acompanhe as atividades e erros do sistema em tempo real.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead className="w-[120px]">Nível</TableHead>
              <TableHead>Mensagem e Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Carregando logs...
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.level === 'error'
                          ? 'destructive'
                          : log.level === 'success'
                            ? 'default'
                            : 'secondary'
                      }
                      className="capitalize font-medium"
                    >
                      {log.level === 'error'
                        ? 'Erro'
                        : log.level === 'success'
                          ? 'Sucesso'
                          : log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{log.message}</span>
                    {log.details && (
                      <div className="mt-1 text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded max-h-24 overflow-y-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhum log registrado no sistema.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
