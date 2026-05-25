import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Phone, ShieldCheck } from 'lucide-react'
import { db } from '@/services/db'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    welcome_message_enabled: false,
    welcome_message_content: '',
    system_prompt: '',
    tone_of_voice: '',
  })

  useEffect(() => {
    if (user) {
      db.getCompanySettings(user.id)
        .then((data) => {
          if (data) {
            setSettings({
              welcome_message_enabled: data.welcome_message_enabled || false,
              welcome_message_content: data.welcome_message_content || '',
              system_prompt: data.system_prompt || '',
              tone_of_voice: data.tone_of_voice || '',
            })
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await db.updateCompanySettings(user.id, settings)
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar configurações.',
      })
    }
    setSaving(false)
  }

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie o comportamento do seu SDR e a integração com WhatsApp.
        </p>
      </div>

      <Tabs defaultValue="persona" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
          <TabsTrigger value="persona" className="gap-2">
            <Bot className="h-4 w-4" />
            Persona da IA
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <Phone className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automação Inicial</CardTitle>
                  <CardDescription>Configure como a IA recebe novos leads.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-base font-semibold">Mensagem de Boas-vindas</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar automaticamente quando um novo lead entrar em contato.
                      </p>
                    </div>
                    <Switch
                      checked={settings.welcome_message_enabled}
                      onCheckedChange={(c) =>
                        setSettings({ ...settings, welcome_message_enabled: c })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo da Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={settings.welcome_message_content}
                      onChange={(e) =>
                        setSettings({ ...settings, welcome_message_content: e.target.value })
                      }
                      className="min-h-[120px] resize-y"
                      placeholder="Oi {PRIMEIRO_NOME_LEAD} 😊&#10;Seja muito bem-vindo(a) por aqui!&#10;É um prazer falar com você 💛"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comportamento e Tom</CardTitle>
                  <CardDescription>Defina a personalidade do seu SDR.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt do Sistema (System Prompt)</Label>
                    <Textarea
                      value={settings.system_prompt}
                      onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                      className="min-h-[150px] resize-y"
                      placeholder="Você é um SDR especialista em atendimento de loja de roupas..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tom de Voz</Label>
                    <Textarea
                      value={settings.tone_of_voice}
                      onChange={(e) => setSettings({ ...settings, tone_of_voice: e.target.value })}
                      className="min-h-[100px] resize-y"
                      placeholder="Tom de voz: A IA deve se comunicar de forma humana, amigável..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-start">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Testar Prompt</CardTitle>
                  <CardDescription>Simule como a IA responderia a um lead.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem do Lead</Label>
                    <Textarea
                      placeholder="Escreva uma mensagem de teste..."
                      className="min-h-[120px] resize-y"
                    />
                  </div>
                  <Button variant="secondary" className="w-full">
                    Gerar Resposta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do WhatsApp</CardTitle>
              <CardDescription>Em breve</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurações avançadas do WhatsApp ficarão disponíveis aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Em breve</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configurações de segurança da conta.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
