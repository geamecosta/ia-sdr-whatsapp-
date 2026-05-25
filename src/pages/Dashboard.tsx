import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Users,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle2,
  DollarSign,
  Ban,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // User Stats
  const [stats, setStats] = useState({ leads: 0, messagesReceived: 0, aiActivity: 0 })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [userQuota, setUserQuota] = useState<any>(null)
  const [botStatus, setBotStatus] = useState<any>({ status: 'disconnected' })

  // Admin Stats
  const [adminStats, setAdminStats] = useState({
    totalTokens: 0,
    totalCost: 0,
    activeClients: 0,
    blockedClients: 0,
  })
  const [clientQuotas, setClientQuotas] = useState<any[]>([])

  const fetchDashboardData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      const userIsAdmin = profile?.is_admin || false
      setIsAdmin(userIsAdmin)

      if (userIsAdmin) {
        const [{ data: quotas }, { data: logs }] = await Promise.all([
          supabase.from('usage_quotas').select('*, profiles(email)'),
          supabase.from('usage_logs').select('total_tokens, cost_estimate'),
        ])

        const tTokens = logs?.reduce((acc, log) => acc + log.total_tokens, 0) || 0
        const tCost = logs?.reduce((acc, log) => acc + Number(log.cost_estimate), 0) || 0
        const active = quotas?.filter((q) => !q.is_blocked).length || 0
        const blocked = quotas?.filter((q) => q.is_blocked).length || 0

        setAdminStats({
          totalTokens: tTokens,
          totalCost: tCost,
          activeClients: active,
          blockedClients: blocked,
        })
        setClientQuotas(quotas || [])
      } else {
        const [{ count: leads }, { data: logs }, { data: quota }, { data: config }] =
          await Promise.all([
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id),
            supabase
              .from('execution_logs')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase.from('usage_quotas').select('*').eq('user_id', user.id).single(),
            supabase
              .from('whatsapp_configs')
              .select('status, connection_type')
              .eq('user_id', user.id)
              .maybeSingle(),
          ])
        if (config) {
          setBotStatus(config)
        }

        let receivedMsgs = 0
        let aiMsgs = 0

        const { data: userLeads } = await supabase.from('leads').select('id').eq('user_id', user.id)
        if (userLeads && userLeads.length > 0) {
          const leadIds = userLeads.map((l) => l.id)
          const [{ count: received }, { count: ai }] = await Promise.all([
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'user')
              .in('lead_id', leadIds),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'assistant')
              .in('lead_id', leadIds),
          ])
          receivedMsgs = received || 0
          aiMsgs = ai || 0
        }

        setStats({ leads: leads || 0, messagesReceived: receivedMsgs, aiActivity: aiMsgs })
        if (logs) setRecentLogs(logs)
        if (quota) setUserQuota(quota)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  // Admin Actions
  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('usage_quotas')
        .update({ is_blocked: !currentStatus })
        .eq('user_id', userId)
      if (error) throw error
      toast.success(`Cliente ${!currentStatus ? 'bloqueado' : 'desbloqueado'} com sucesso.`)
      fetchDashboardData()
    } catch (e: any) {
      toast.error('Erro ao atualizar status: ' + e.message)
    }
  }

  const handleUpdateLimit = async (userId: string, newLimit: number, newCost: number) => {
    try {
      const { error } = await supabase
        .from('usage_quotas')
        .update({ monthly_token_limit: newLimit, cost_per_1k_tokens: newCost })
        .eq('user_id', userId)
      if (error) throw error
      toast.success('Valores atualizados com sucesso.')
      fetchDashboardData()
    } catch (e: any) {
      toast.error('Erro ao atualizar valores: ' + e.message)
    }
  }

  const handleResetUsage = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('usage_quotas')
        .update({ current_month_usage: 0 })
        .eq('user_id', userId)
      if (error) throw error
      toast.success('Uso resetado com sucesso.')
      fetchDashboardData()
    } catch (e: any) {
      toast.error('Erro ao resetar uso: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ==== ADMIN DASHBOARD ====
  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral do consumo de IA e controle de cotas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Tokens Consumidos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.totalTokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Em todos os clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${adminStats.totalCost.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">Baseado na API da OpenAI</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.activeClients}</div>
              <p className="text-xs text-muted-foreground">Contas operando normalmente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Clientes Bloqueados</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.blockedClients}</div>
              <p className="text-xs text-muted-foreground">Contas sem acesso à IA</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Uso por Cliente</CardTitle>
              <CardDescription>Gerencie limites e bloqueios de acesso por usuário.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente (Email)</TableHead>
                    <TableHead>Uso (Mês Atual)</TableHead>
                    <TableHead>Progresso da Cota</TableHead>
                    <TableHead>Limite (Tokens)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientQuotas.map((client) => {
                    const progress =
                      client.monthly_token_limit > 0
                        ? Math.min(
                            (client.current_month_usage / client.monthly_token_limit) * 100,
                            100,
                          )
                        : 100
                    return (
                      <TableRow key={client.user_id}>
                        <TableCell className="font-medium">
                          {client.profiles?.email || 'Desconhecido'}
                        </TableCell>
                        <TableCell>{client.current_month_usage.toLocaleString()}</TableCell>
                        <TableCell className="w-[200px]">
                          <div className="flex flex-col gap-1.5">
                            <Progress
                              value={progress}
                              className={cn('h-2', progress > 90 ? '[&>div]:bg-red-500' : '')}
                            />
                            <span className="text-xs text-muted-foreground text-right">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{client.monthly_token_limit.toLocaleString()}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-1 rounded-full',
                              client.is_blocked
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-green-500/10 text-green-600',
                            )}
                          >
                            {client.is_blocked ? 'Bloqueado' : 'Ativo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div
                              className="flex items-center space-x-2"
                              title={client.is_blocked ? 'Desbloquear Conta' : 'Bloquear Conta'}
                            >
                              <Switch
                                checked={!client.is_blocked}
                                onCheckedChange={() =>
                                  handleToggleBlock(client.user_id, client.is_blocked)
                                }
                              />
                            </div>
                            <UpdateLimitDialog client={client} onUpdate={handleUpdateLimit} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetUsage(client.user_id)}
                              title="Resetar Uso Atual"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==== USER DASHBOARD ====
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

  const quotaProgress =
    userQuota && userQuota.monthly_token_limit > 0
      ? Math.min((userQuota.current_month_usage / userQuota.monthly_token_limit) * 100, 100)
      : 0

  let derivedBotStatus = 'Disconnected'
  let derivedBotStatusColor = 'bg-muted text-muted-foreground'
  let derivedBotStatusIcon = <Info className="h-4 w-4" />

  if (userQuota?.is_blocked) {
    derivedBotStatus = 'Blocked (Administrativo)'
    derivedBotStatusColor = 'bg-destructive/10 text-destructive'
    derivedBotStatusIcon = <Ban className="h-4 w-4" />
  } else if (userQuota && userQuota.current_month_usage >= userQuota.monthly_token_limit) {
    derivedBotStatus = 'Blocked (Out of Credits)'
    derivedBotStatusColor = 'bg-destructive/10 text-destructive'
    derivedBotStatusIcon = <AlertCircle className="h-4 w-4" />
  } else if (botStatus.status === 'error') {
    derivedBotStatus = 'Error (Technical Issue)'
    derivedBotStatusColor = 'bg-yellow-500/10 text-yellow-600'
    derivedBotStatusIcon = <AlertCircle className="h-4 w-4" />
  } else if (botStatus.status === 'connected') {
    derivedBotStatus = 'Active'
    derivedBotStatusColor = 'bg-green-500/10 text-green-600'
    derivedBotStatusIcon = <CheckCircle2 className="h-4 w-4" />
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu assistente virtual SDR.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div>
          <h2 className="text-lg font-semibold">Bot Status & Diagnostic</h2>
          <p className="text-sm text-muted-foreground">
            Estado atual da sua conexão com o WhatsApp e IA.
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm',
            derivedBotStatusColor,
          )}
        >
          {derivedBotStatusIcon}
          {derivedBotStatus}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">Interações dos clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Respostas da IA</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiActivity}</div>
            <p className="text-xs text-muted-foreground">Respostas geradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Uso da Cota (Tokens)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userQuota?.current_month_usage?.toLocaleString() || 0}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress
                value={quotaProgress}
                className={cn('h-1.5 flex-1', quotaProgress > 90 ? '[&>div]:bg-red-500' : '')}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {quotaProgress.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {userQuota?.is_blocked && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-3">
          <Ban className="h-5 w-5" />
          <div>
            <p className="font-semibold text-sm">Conta Bloqueada</p>
            <p className="text-xs">
              O assistente de IA está temporariamente desativado devido ao limite de cota atingido
              ou bloqueio administrativo.
            </p>
          </div>
        </div>
      )}

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

function UpdateLimitDialog({
  client,
  onUpdate,
}: {
  client: any
  onUpdate: (id: string, limit: number, cost: number) => void
}) {
  const [limit, setLimit] = useState(client.monthly_token_limit?.toString() || '0')
  const [cost, setCost] = useState(client.cost_per_1k_tokens?.toString() || '0.02')
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onUpdate(client.user_id, parseInt(limit, 10), parseFloat(cost))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar Limite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cota e Custos</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">
              Limite
            </Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Custo / 1k ($)
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.001"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
