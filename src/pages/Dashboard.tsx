import { useEffect, useState } from 'react'
import { db } from '@/services/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, messages: 0 })
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const leadsData = await db.getLeads()
        setStats((prev) => ({ ...prev, leads: leadsData.length }))

        const logsData = await db.getLogs()
        setRecentLogs(logsData.slice(0, 5))
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">Leads registrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Assistente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">Pronto para responder</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Atividade Recente</h2>
      <div className="space-y-4">
        {recentLogs.length > 0 ? (
          recentLogs.map((log) => (
            <Card key={log.id} className="bg-muted/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 text-xs rounded-full ${
                    log.level === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : log.level === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {log.level}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        )}
      </div>
    </div>
  )
}
