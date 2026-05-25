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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setSettings(data)
      } else if (!error) {
        const defaultSettings = {
          user_id: user.id,
          welcome_message_enabled: false,
          welcome_message_content: 'Olá! Como posso ajudar você hoje?',
        }
        await supabase.from('company_settings').insert(defaultSettings)
        setSettings(defaultSettings)
      }
      setLoading(false)
    }

    fetchSettings()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const { error } = await supabase
      .from('company_settings')
      .update({
        company_objectives: settings.company_objectives,
        sales_manual: settings.sales_manual,
        system_prompt: settings.system_prompt,
        tone_of_voice: settings.tone_of_voice,
        welcome_message_enabled: settings.welcome_message_enabled,
        welcome_message_content: settings.welcome_message_content,
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
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' })
    }
  }

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie o comportamento e os parâmetros da sua Inteligência Artificial.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento da IA (SDR)</CardTitle>
          <CardDescription>
            Defina a personalidade, tom de voz e os objetivos para que a IA represente sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tone">Tom de Voz</Label>
            <Input
              id="tone"
              value={settings.tone_of_voice || ''}
              onChange={(e) => setSettings({ ...settings, tone_of_voice: e.target.value })}
              placeholder="Ex: Profissional, amigável, persuasivo, formal..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objetivos Principais da Empresa</Label>
            <Textarea
              id="objectives"
              value={settings.company_objectives || ''}
              onChange={(e) => setSettings({ ...settings, company_objectives: e.target.value })}
              placeholder="Qual o objetivo principal do atendimento? Ex: Agendar uma reunião, qualificar o lead, vender um produto..."
              className="min-h-[100px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual">Manual de Vendas (Contexto e Objeções)</Label>
            <Textarea
              id="manual"
              value={settings.sales_manual || ''}
              onChange={(e) => setSettings({ ...settings, sales_manual: e.target.value })}
              placeholder="Forneça detalhes sobre seus produtos, preços, FAQs e como a IA deve contornar objeções comuns..."
              className="min-h-[180px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automação Inicial</CardTitle>
          <CardDescription>
            Configure a primeira mensagem que a IA enviará quando um novo lead entrar em contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-lg border">
            <Switch
              id="welcome"
              checked={settings.welcome_message_enabled || false}
              onCheckedChange={(c) => setSettings({ ...settings, welcome_message_enabled: c })}
            />
            <Label htmlFor="welcome" className="font-medium cursor-pointer">
              Ativar Mensagem de Boas-vindas Automática
            </Label>
          </div>

          {settings.welcome_message_enabled && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="welcomeContent">Conteúdo da Mensagem</Label>
              <Textarea
                id="welcomeContent"
                value={settings.welcome_message_content || ''}
                onChange={(e) =>
                  setSettings({ ...settings, welcome_message_content: e.target.value })
                }
                placeholder="Olá! Muito obrigado pelo seu contato. Como posso ajudar você hoje?"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será disparada instantaneamente antes da IA assumir o contexto da
                conversa.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t px-6 py-4 mt-2">
          <Button onClick={handleSave} disabled={saving} className="ml-auto w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando Alterações...' : 'Salvar Configurações'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
