import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Zap, Plus, Smartphone, Trash2, Bot } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SdrConfigForm } from '@/components/SdrConfigForm'
import { Badge } from '@/components/ui/badge'

export function WhatsappSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [newType, setNewType] = useState('chatguru')
  const [cgAccountId, setCgAccountId] = useState('')
  const [cgApiKey, setCgApiKey] = useState('')
  const [cgEndpointUrl, setCgEndpointUrl] = useState('')
  const [cgPhoneId, setCgPhoneId] = useState('')

  const [officialPhoneId, setOfficialPhoneId] = useState('')
  const [officialToken, setOfficialToken] = useState('')
  const [officialVerifyToken, setOfficialVerifyToken] = useState('')
  const [webInstanceId, setWebInstanceId] = useState('')
  const [webApiKey, setWebApiKey] = useState('')

  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const fetchConfigs = async () => {
    if (!user) return
    const { data } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setConfigs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchConfigs()
  }, [user])

  const handleSaveChatGuru = async () => {
    if (!user) return
    if (!cgAccountId || !cgApiKey || !cgEndpointUrl || !cgPhoneId) {
      toast({
        title: 'Erro',
        description: 'Preencha Account ID, API Key, URL da API e Phone ID',
        variant: 'destructive',
      })
      return
    }

    const { data: existing } = await supabase
      .from('whatsapp_configs')
      .select('id')
      .eq('user_id', user.id)
      .eq('connection_type', 'chatguru')
      .eq('web_instance_id', cgPhoneId)
      .maybeSingle()

    const now = new Date().toISOString()
    let saveError = null

    if (existing) {
      const { error } = await supabase
        .from('whatsapp_configs')
        .update({
          chatguru_account_id: cgAccountId,
          web_api_key: cgApiKey,
          chatguru_endpoint_url: cgEndpointUrl.trim(),
          phone_number_id: cgPhoneId,
          last_heartbeat: now,
        })
        .eq('id', existing.id)
      saveError = error
    } else {
      const { error } = await supabase.from('whatsapp_configs').insert({
        user_id: user.id,
        connection_type: 'chatguru',
        chatguru_account_id: cgAccountId,
        web_api_key: cgApiKey,
        web_instance_id: cgPhoneId,
        phone_number_id: cgPhoneId,
        chatguru_endpoint_url: cgEndpointUrl.trim(),
        status: 'disconnected',
        last_heartbeat: now,
        verify_token: crypto.randomUUID(),
      } as any)
      saveError = error
    }

    if (saveError) {
      await supabase.from('execution_logs').insert({
        user_id: user.id,
        level: 'error',
        message: 'Erro ao salvar configuração manual do ChatGuru',
        details: { error: saveError },
      })
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração do aparelho.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: existing
          ? 'Aparelho atualizado com sucesso.'
          : 'Aparelho adicionado com sucesso.',
      })
      fetchConfigs()
      setIsAddOpen(false)
      setCgPhoneId('')
      setCgApiKey('')
      setCgAccountId('')
      setCgEndpointUrl('')
    }
  }

  const handleAddManual = async () => {
    if (!user) return
    const { error } = await supabase.from('whatsapp_configs').insert({
      user_id: user.id,
      connection_type: newType,
      phone_number_id: newType === 'official' ? officialPhoneId : null,
      access_token: newType === 'official' ? officialToken : null,
      verify_token: newType === 'official' ? officialVerifyToken : null,
      web_instance_id: newType === 'web' ? webInstanceId : null,
      web_api_key: newType === 'web' ? webApiKey : null,
      status: 'disconnected',
    })

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar. Verifique se a conexão já existe.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sucesso', description: 'Conexão adicionada.' })
      fetchConfigs()
      setIsAddOpen(false)
      setNewType('chatguru')
    }
  }

  const handleConnect = async (config: any) => {
    if (!user) return
    setConnectingId(config.id)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatguru-setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect_device',
          config_id: config.id,
          account_id: config.chatguru_account_id,
          api_key: config.web_api_key,
          endpoint_url: config.chatguru_endpoint_url,
          phone_id: config.web_instance_id || config.phone_number_id,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await supabase.from('whatsapp_configs').update({ status: 'connected' }).eq('id', config.id)
        toast({ title: 'Sucesso', description: 'Conectado com sucesso!' })
        fetchConfigs()
      } else {
        toast({
          title: 'Erro',
          description: json.error || 'Falha ao conectar.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setConnectingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('whatsapp_configs').delete().eq('id', id)
    fetchConfigs()
    toast({ title: 'Removido', description: 'Conexão removida com sucesso.' })
  }

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Conexões do WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie seus números e aparelhos conectados.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Conexão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Conexão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Conexão</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatguru">ChatGuru (Múltiplos Aparelhos)</SelectItem>
                    <SelectItem value="official">WhatsApp Oficial (Cloud API)</SelectItem>
                    <SelectItem value="web">Instância Web Genérica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newType === 'chatguru' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>URL da API (Endpoint)</Label>
                    <Input
                      value={cgEndpointUrl}
                      onChange={(e) => setCgEndpointUrl(e.target.value)}
                      placeholder="https://s17.chatguru.app"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <Input
                      value={cgAccountId}
                      onChange={(e) => setCgAccountId(e.target.value)}
                      placeholder="Seu Account ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={cgApiKey}
                      onChange={(e) => setCgApiKey(e.target.value)}
                      placeholder="Sua API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone ID (ID do Aparelho)</Label>
                    <Input
                      value={cgPhoneId}
                      onChange={(e) => setCgPhoneId(e.target.value)}
                      placeholder="ID do Aparelho no ChatGuru"
                    />
                  </div>
                  <Button onClick={handleSaveChatGuru} className="w-full">
                    Salvar Conexão
                  </Button>
                </div>
              )}

              {newType === 'official' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input
                      value={officialPhoneId}
                      onChange={(e) => setOfficialPhoneId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token de Acesso</Label>
                    <Input
                      type="password"
                      value={officialToken}
                      onChange={(e) => setOfficialToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token de Verificação</Label>
                    <Input
                      value={officialVerifyToken}
                      onChange={(e) => setOfficialVerifyToken(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddManual} className="w-full">
                    Salvar Conexão
                  </Button>
                </div>
              )}

              {newType === 'web' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={webApiKey}
                      onChange={(e) => setWebApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instance ID</Label>
                    <Input
                      value={webInstanceId}
                      onChange={(e) => setWebInstanceId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddManual} className="w-full">
                    Salvar Conexão
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Smartphone className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhuma conexão configurada.</p>
            <p className="text-sm">Clique em "Nova Conexão" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {config.connection_type === 'chatguru'
                        ? 'ChatGuru'
                        : config.connection_type === 'official'
                          ? 'Oficial API'
                          : 'Web API'}
                      <Badge
                        variant={config.status === 'connected' ? 'default' : 'secondary'}
                        className={
                          config.status === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'
                            : ''
                        }
                      >
                        {config.status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1 break-all flex flex-col gap-1">
                      <span>ID: {config.web_instance_id || config.phone_number_id || 'N/A'}</span>
                      {config.connection_type === 'chatguru' && config.chatguru_endpoint_url && (
                        <span className="text-xs opacity-80">
                          API: {config.chatguru_endpoint_url}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(config.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 -mt-2 -mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto pt-4 bg-muted/20 border-t flex flex-wrap gap-2">
                {config.connection_type === 'chatguru' && config.status !== 'connected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnect(config)}
                    disabled={connectingId === config.id}
                  >
                    {connectingId === config.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2 text-emerald-500" />
                    )}
                    Conectar Webhook
                  </Button>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="ml-auto w-full sm:w-auto">
                      <Bot className="w-4 h-4 mr-2" />
                      Configurar SDR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Comportamento da IA para este Aparelho</DialogTitle>
                    </DialogHeader>
                    <SdrConfigForm whatsappConfigId={config.id} />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
