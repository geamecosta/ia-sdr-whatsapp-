import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Activity,
  Users,
  MessageSquare,
  Settings,
  AlertCircle,
  ArrowRight,
  Clock,
  Info,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [leads, setLeads] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [waConfig, setWaConfig] = useState<any>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      setError(null)
      setLoading(true)

      const [leadsRes, logsRes, configRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('execution_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('whatsapp_configs').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      if (leadsRes.error) throw leadsRes.error
      if (logsRes.error) throw logsRes.error

      setLeads(leadsRes.data || [])
      setLogs(logsRes.data || [])
      setWaConfig(configRes.data || null)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Erro ao carregar dados. Verifique sua conexão ou permissões.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    if (mounted) {
      loadData()
    }
    return () => {
      mounted = false
    }
  }, [loadData])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres',
        { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` },
        () => {
          loadData()
        },
      )
      .on(
        'postgres',
        { event: '*', schema: 'public', table: 'execution_logs', filter: `user_id=eq.${user.id}` },
        () => {
          loadData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadData])

  const stats = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : []
    const counts = { total: safeLeads.length, novo: 0, emAtendimento: 0, qualificado: 0, outros: 0 }
    safeLeads.forEach((l) => {
      const s = l?.status?.toLowerCase() || ''
      if (s === 'novo' || s === 'new') counts.novo++
      else if (s.includes('atendimento') || s.includes('progress') || s.includes('andamento'))
        counts.emAtendimento++
      else if (s.includes('convertido') || s.includes('qualificado') || s.includes('qualified'))
        counts.qualificado++
      else counts.outros++
    })
    return counts
  }, [leads])

  const conversionRate =
    stats.total > 0 ? ((stats.qualificado / stats.total) * 100).toFixed(1) : '0.0'

  const isConfigured = Boolean(waConfig?.access_token && waConfig?.phone_number_id)

  const leadsVolumeData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      return d.toISOString().split('T')[0]
    })

    return last14Days.map((date) => {
      const dayLeads = leads.filter((l: any) => l.created_at?.startsWith(date))
      const count = dayLeads.length
      const qualified = dayLeads.filter((l: any) => {
        const s = l.status?.toLowerCase() || ''
        return s.includes('convertido') || s.includes('qualificado') || s.includes('qualified')
      }).length
      return { date, count, qualified }
    })
  }, [leads])

  const leadsByStatusData = useMemo(() => {
    const data = [
      { status: 'Novo', count: stats.novo, fill: 'hsl(var(--chart-1))' },
      { status: 'Em Atendimento', count: stats.emAtendimento, fill: 'hsl(var(--chart-2))' },
      { status: 'Qualificado', count: stats.qualificado, fill: 'hsl(var(--chart-3))' },
      { status: 'Outros', count: stats.outros, fill: 'hsl(var(--chart-4))' },
    ].filter((item) => item.count > 0)

    return data.length > 0 ? data : [{ status: 'Sem Dados', count: 1, fill: 'hsl(var(--muted))' }]
  }, [stats])

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
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Leads qualificados com sucesso</p>
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
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.novo}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando interação</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Volume de Leads (14 dias)</CardTitle>
            <CardDescription>Total e Qualificados por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Total de Leads', color: 'hsl(var(--chart-1))' },
                qualified: { label: 'Qualificados', color: 'hsl(var(--chart-3))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={leadsVolumeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-qualified)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-qualified)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="Total de Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="qualified"
                    stroke="var(--color-qualified)"
                    fillOpacity={1}
                    fill="url(#colorQualified)"
                    name="Qualificados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Distribuição de status dos leads</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={{
                count: { label: 'Leads' },
                Novo: { label: 'Novo', color: 'hsl(var(--chart-1))' },
                'Em Atendimento': { label: 'Em Atendimento', color: 'hsl(var(--chart-2))' },
                Qualificado: { label: 'Qualificado', color: 'hsl(var(--chart-3))' },
                Outros: { label: 'Outros', color: 'hsl(var(--chart-4))' },
                'Sem Dados': { label: 'Sem Dados', color: 'hsl(var(--muted))' },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={leadsByStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label
                  >
                    {leadsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
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
    </div>
  )
}
