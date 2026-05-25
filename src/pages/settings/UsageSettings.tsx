import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'

export function UsageSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [limit, setLimit] = useState<number>(50000)
  const [cost, setCost] = useState<number>(0.02)
  const [currentUsage, setCurrentUsage] = useState<number>(0)
  const [isBlocked, setIsBlocked] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      fetchQuota()
    }
  }, [user])

  const fetchQuota = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (data) {
      const quotaData = data as any
      setLimit(quotaData.monthly_token_limit || 50000)
      setCost(
        quotaData.cost_per_1k_tokens !== undefined ? Number(quotaData.cost_per_1k_tokens) : 0.02,
      )
      setCurrentUsage(quotaData.current_month_usage || 0)
      setIsBlocked(quotaData.is_blocked || false)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('usage_quotas')
      .update({
        monthly_token_limit: limit,
        // @ts-expect-error - Supabase type does not include this column yet
        cost_per_1k_tokens: cost,
      })
      .eq('user_id', user!.id)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações de uso e cota.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Configurações de uso salvas com sucesso.',
      })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const usagePercent = Math.min((currentUsage / Math.max(limit, 1)) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso e Faturamento</CardTitle>
        <CardDescription>
          Ajuste seus limites de cota para testes e visualize seu consumo atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Conta Bloqueada</AlertTitle>
            <AlertDescription>
              A sua conta foi bloqueada devido ao excesso de cota de tokens. A IA não responderá às
              mensagens até que a cota seja aumentada.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Uso Atual (Mês)</p>
            <p className="text-2xl font-bold">
              {currentUsage.toLocaleString()} / {limit.toLocaleString()} tokens
            </p>
          </div>
          <div className="w-full sm:w-1/3">
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-muted-foreground">
              {usagePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid gap-4 max-w-sm">
          <div className="grid gap-2">
            <Label htmlFor="limit">Limite Mensal de Tokens</Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              placeholder="Ex: 50000"
            />
            <p className="text-sm text-muted-foreground">
              Define o limite de tokens que o bot pode consumir por mês antes de ser bloqueado.
            </p>
          </div>

          <div className="grid gap-2 mt-2">
            <Label htmlFor="cost">Custo por 1k Tokens ($)</Label>
            <Input
              id="cost"
              type="number"
              step="0.001"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              placeholder="Ex: 0.02"
            />
            <p className="text-sm text-muted-foreground">
              Usado para calcular a estimativa de custo nos logs de uso.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              if (!confirm('Tem certeza que deseja zerar seu uso atual?')) return
              const { error } = await supabase
                .from('usage_quotas')
                .update({ current_month_usage: 0 })
                .eq('user_id', user!.id)
              if (!error) {
                toast({ title: 'Sucesso', description: 'Uso resetado com sucesso.' })
                setCurrentUsage(0)
              } else {
                toast({
                  title: 'Erro',
                  description: 'Falha ao resetar o uso.',
                  variant: 'destructive',
                })
              }
            }}
          >
            Resetar Uso Atual
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
