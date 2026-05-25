import { useEffect, useState, useMemo } from 'react'
import { db } from '@/services/db'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  Users,
  MessageSquare,
  Settings,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [waConfig, setWaConfig] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      if (!user) return
      try {
        setError(null)

        const safeFetch = async (promise: Promise<any>, fallback: any) => {
          try {
            const result = await promise
            return result !== undefined && result !== null ? result : fallback
          } catch (e) {
            console.error('Data fetch error:', e)
            return fallback
          }
        }

        const [leadsData, logsData, configData, settingsData, metricsData] = await Promise.all([
          safeFetch(db.getLeads(), []),
          safeFetch(db.getLogs(), []),
          safeFetch(db.getWhatsappConfig(user.id), null),
          safeFetch(db.getCompanySettings(user.id), null),
          safeFetch(db.getMetrics(), { leads: [], messages: [] }),
        ])

        if (mounted) {
          setLeads(Array.isArray(leadsData) ? leadsData : [])
          setLogs(Array.isArray(logsData) ? logsData.slice(0, 5) : [])
          setWaConfig(configData)
          setMetrics(metricsData)

          const isSettingsComplete =
            settingsData?.company_objectives &&
            settingsData?.sales_manual &&
            settingsData?.tone_of_voice
          if (!isSettingsComplete) {
            setShowOnboarding(true)
          }
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err)
        if (mounted) {
          setError(err.message || 'Erro ao carregar dados. Verifique sua conexão ou permissões.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [user])

  const stats = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : []
    const counts = { total: safeLeads.length, novo: 0, emAtendimento: 0, convertido: 0, outros: 0 }
    safeLeads.forEach((l) => {
      const s = l?.status?.toLowerCase() || ''
      if (s.includes('novo')) counts.novo++
      else if (s.includes('atendimento')) counts.emAtendimento++
      else if (s.includes('convertido')) counts.convertido++
      else counts.outros++
    })
    return counts
  }, [leads])

  const isConfigured = Boolean(waConfig?.access_token && waConfig?.phone_number_id)

  const messageChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    return last7Days.map((date) => {
      const dayMessages = metrics.messages.filter((m: any) => m.created_at?.startsWith(date))
      const sent = dayMessages.filter((m: any) => m.role === 'assistant').length
      const received = dayMessages.filter((m: any) => m.role === 'user').length
      return { date, sent, received }
    })
  }, [])

  const leadsByStatusData = useMemo(
    () => [
      { status: 'Novo', count: stats.novo, fill: 'var(--color-novo)' },
      { status: 'Em Atendimento', count: stats.emAtendimento, fill: 'var(--color-emAtendimento)' },
      { status: 'Convertido', count: stats.convertido, fill: 'var(--color-convertido)' },
      { status: 'Outros', count: stats.outros, fill: 'var(--color-outros)' },
    ],
    [stats],
  )

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up duration-500">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl mt-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fade-in-up duration-500">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold">Algo deu errado</h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in-up duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do desempenho do seu SDR Automático.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </Link>
          </Button>
        </div>
      </div>

      {!isConfigured && (
        <Card className="border-primary/50 bg-primary/5 shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold">WhatsApp não configurado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Para que a IA comece a responder seus leads, você precisa configurar as credenciais
                da API Oficial do WhatsApp.
              </p>
            </div>
            <Button asChild>
              <Link to="/settings">
                Configurar agora <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads registrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.novo}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando interação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.emAtendimento}
            </div>
            <p className="text-xs text-muted-foreground mt-1">SDR interagindo agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.convertido}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Leads qualificados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Leads' },
                novo: { color: 'hsl(var(--chart-1))' },
                emAtendimento: { color: 'hsl(var(--chart-2))' },
                convertido: { color: 'hsl(var(--chart-3))' },
                outros: { color: 'hsl(var(--chart-4))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByStatusData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {leadsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume de Mensagens (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sent: { label: 'Enviadas', color: 'hsl(var(--chart-1))' },
                received: { label: 'Recebidas', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={messageChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="sent" stroke="var(--color-sent)" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="var(--color-received)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Logs de Execução Recentes</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/logs">Ver todos</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {Array.isArray(logs) && logs.length > 0 ? (
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
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma atividade recente</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Assim que a IA começar a responder seus leads, os logs aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Status do Sistema</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      isConfigured ? 'bg-green-500' : 'bg-yellow-500',
                    )}
                  />
                  <span className="text-sm font-medium">Conexão WhatsApp</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isConfigured ? 'Ativa' : 'Pendente'}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Banco de Dados</span>
                </div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Motor de IA (SDR)</span>
                </div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <OnboardingModal open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
    </div>
  )
}
