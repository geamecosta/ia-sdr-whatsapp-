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
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function WhatsappSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>({
    connection_type: 'official',
    status: 'disconnected',
    phone_number_id: '',
    access_token: '',
    verify_token: '',
    web_api_key: '',
    web_instance_id: '',
  })

  useEffect(() => {
    if (!user) return
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setConfig(data)
      } else if (!error) {
        const defaultConfig = {
          user_id: user.id,
          connection_type: 'official',
          status: 'disconnected',
        }
        await supabase.from('whatsapp_configs').insert(defaultConfig)
        setConfig(defaultConfig)
      }
      setLoading(false)
    }
    fetchConfig()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('whatsapp_configs')
      .update({
        connection_type: config.connection_type,
        phone_number_id: config.phone_number_id,
        access_token: config.access_token,
        verify_token: config.verify_token,
        web_api_key: config.web_api_key,
        web_instance_id: config.web_instance_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    setSaving(false)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sucesso', description: 'Configurações do WhatsApp salvas com sucesso.' })
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexão do WhatsApp</CardTitle>
        <CardDescription>
          Configure a integração com o WhatsApp. Status atual:{' '}
          <span className="inline-flex items-center ml-1">
            {config.status === 'connected' ? (
              <span className="text-emerald-500 flex items-center font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Conectado
              </span>
            ) : config.status === 'error' ? (
              <span className="text-red-500 flex items-center font-medium text-sm">
                <AlertCircle className="w-4 h-4 mr-1" /> Erro
              </span>
            ) : (
              <span className="text-yellow-500 flex items-center font-medium text-sm">
                <AlertCircle className="w-4 h-4 mr-1" /> Desconectado
              </span>
            )}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Tipo de Conexão</Label>
          <Select
            value={config.connection_type}
            onValueChange={(val) => setConfig({ ...config, connection_type: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="official">WhatsApp Oficial (Cloud API)</SelectItem>
              <SelectItem value="chatguru">ChatGuru</SelectItem>
              <SelectItem value="web">Instância Web (Baileys/WWebJS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.connection_type === 'official' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                value={config.phone_number_id || ''}
                onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                placeholder="Ex: 123456789012345"
              />
            </div>
            <div className="space-y-2">
              <Label>Token de Acesso (Permanente)</Label>
              <Input
                type="password"
                value={config.access_token || ''}
                onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                placeholder="EAA..."
              />
            </div>
            <div className="space-y-2">
              <Label>Token de Verificação do Webhook</Label>
              <Input
                value={config.verify_token || ''}
                onChange={(e) => setConfig({ ...config, verify_token: e.target.value })}
                placeholder="MeuTokenSecreto"
              />
            </div>
          </div>
        )}

        {(config.connection_type === 'chatguru' || config.connection_type === 'web') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={config.web_api_key || ''}
                onChange={(e) => setConfig({ ...config, web_api_key: e.target.value })}
                placeholder="Insira a API Key"
              />
            </div>
            <div className="space-y-2">
              <Label>Instance ID / Phone ID</Label>
              <Input
                value={config.web_instance_id || ''}
                onChange={(e) => setConfig({ ...config, web_instance_id: e.target.value })}
                placeholder="Identificador da instância"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 border-t px-6 py-4 mt-2">
        <Button onClick={handleSave} disabled={saving} className="ml-auto w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar WhatsApp'}
        </Button>
      </CardFooter>
    </Card>
  )
}
