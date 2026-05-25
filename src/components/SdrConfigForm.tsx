import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, Copy } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SdrConfigFormProps {
  whatsappConfigId?: string | null
  onSaved?: () => void
}

export function SdrConfigForm({ whatsappConfigId = null, onSaved }: SdrConfigFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none')

  const [settings, setSettings] = useState<any>({
    company_objectives: '',
    sales_manual: '',
    system_prompt: '',
    tone_of_voice: '',
    welcome_message_enabled: false,
    welcome_message_content: '',
  })

  useEffect(() => {
    if (!user) return
    const fetchSettings = async () => {
      let query = supabase.from('company_settings').select('*').eq('user_id', user.id)

      if (whatsappConfigId) {
        query = query.eq('whatsapp_config_id', whatsappConfigId)
      } else {
        query = query.is('whatsapp_config_id', null)
      }

      const { data, error } = await query.maybeSingle()

      const { data: allSettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
      if (allSettings) {
        setTemplates(allSettings)
      }

      if (data) {
        setSettings(data)
        setHasExisting(true)
      } else if (!whatsappConfigId && !error) {
        // Auto-create global default if missing to prevent UI glitches, but don't spam for specific configs
        const defaultSettings = {
          user_id: user.id,
          welcome_message_enabled: false,
          welcome_message_content: 'Olá! Como posso ajudar você hoje?',
        }
        await supabase.from('company_settings').insert(defaultSettings)
        setSettings(defaultSettings)
        setHasExisting(true)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [user, whatsappConfigId])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const payload = {
      company_objectives: settings.company_objectives,
      sales_manual: settings.sales_manual,
      system_prompt: settings.system_prompt,
      tone_of_voice: settings.tone_of_voice,
      welcome_message_enabled: settings.welcome_message_enabled,
      welcome_message_content: settings.welcome_message_content,
      updated_at: new Date().toISOString(),
    }

    if (hasExisting) {
      let updateQuery = supabase.from('company_settings').update(payload).eq('user_id', user.id)

      if (whatsappConfigId) {
        updateQuery = updateQuery.eq('whatsapp_config_id', whatsappConfigId)
      } else {
        updateQuery = updateQuery.is('whatsapp_config_id', null)
      }

      const { error } = await updateQuery
      if (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao salvar configurações.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' })
        if (onSaved) onSaved()
      }
    } else {
      const { error } = await supabase.from('company_settings').insert({
        ...payload,
        user_id: user.id,
        whatsapp_config_id: whatsappConfigId,
      })
      if (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao salvar configurações.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso', description: 'Configurações criadas com sucesso.' })
        setHasExisting(true)
        if (onSaved) onSaved()
      }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleApplyTemplate = () => {
    const t = templates.find((x) => x.id === selectedTemplate)
    if (t) {
      setSettings({
        ...settings,
        company_objectives: t.company_objectives || '',
        sales_manual: t.sales_manual || '',
        system_prompt: t.system_prompt || '',
        tone_of_voice: t.tone_of_voice || '',
        welcome_message_enabled: t.welcome_message_enabled || false,
        welcome_message_content: t.welcome_message_content || '',
      })
      toast({
        title: 'Persona Aplicada',
        description:
          'Os dados foram preenchidos. Clique em "Salvar SDR" para confirmar a associação.',
      })
    }
  }

  return (
    <div className="space-y-5">
      {templates.length > 0 && (
        <div className="space-y-3 pb-5 border-b mb-5">
          <Label>Associar Persona Existente a este Aparelho</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma persona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Preencher manualmente)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.whatsapp_config_id
                      ? `Persona Específica (Ref: ${t.whatsapp_config_id.substring(0, 8)})`
                      : 'Persona Global (Padrão)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={handleApplyTemplate}
              disabled={selectedTemplate === 'none'}
              className="w-full sm:w-auto shrink-0"
            >
              <Copy className="w-4 h-4 mr-2" />
              Aplicar Persona
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Prompt de Sistema</Label>
        <Textarea
          value={settings.system_prompt || ''}
          onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
          placeholder="Instruções de base para a IA..."
          className="min-h-[80px]"
        />
      </div>
      <div className="space-y-2">
        <Label>Tom de Voz</Label>
        <Input
          value={settings.tone_of_voice || ''}
          onChange={(e) => setSettings({ ...settings, tone_of_voice: e.target.value })}
          placeholder="Ex: Profissional, amigável..."
        />
      </div>
      <div className="space-y-2">
        <Label>Objetivos e Manual de Vendas</Label>
        <Textarea
          value={settings.sales_manual || ''}
          onChange={(e) => setSettings({ ...settings, sales_manual: e.target.value })}
          placeholder="Detalhes sobre produtos, FAQs..."
          className="min-h-[120px]"
        />
      </div>

      <div className="flex items-center space-x-3 bg-muted/40 p-3 rounded-lg border">
        <Switch
          checked={settings.welcome_message_enabled || false}
          onCheckedChange={(c) => setSettings({ ...settings, welcome_message_enabled: c })}
        />
        <Label className="font-medium cursor-pointer">Mensagem de Boas-vindas</Label>
      </div>

      {settings.welcome_message_enabled && (
        <div className="space-y-2 animate-in fade-in">
          <Label>Conteúdo da Mensagem</Label>
          <Textarea
            value={settings.welcome_message_content || ''}
            onChange={(e) => setSettings({ ...settings, welcome_message_content: e.target.value })}
            placeholder="Olá! Como posso ajudar?"
          />
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar SDR'}
        </Button>
      </div>
    </div>
  )
}
