import { useState } from 'react'
import { useAppState } from '@/hooks/use-app-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Sparkles, Save, BookOpen, Target, Workflow, Plus, Trash2 } from 'lucide-react'

export default function AgentConfig() {
  const { agentName, setAgentName } = useAppState()
  const [tone, setTone] = useState('amigavel')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'Configurações Salvas',
        description: 'O "cérebro" da sua IA foi atualizado com sucesso.',
      })
    }, 800)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">O "Cérebro" da IA</h2>
        <p className="text-muted-foreground mt-2">
          Personalize o comportamento, o conhecimento e os objetivos do seu SDR automatizado.
        </p>
      </div>

      <Tabs defaultValue="personality" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto p-1 bg-muted/50 mb-6">
          <TabsTrigger
            value="personality"
            className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Personalidade
          </TabsTrigger>
          <TabsTrigger
            value="knowledge"
            className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" /> Conhecimento
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Workflow className="w-4 h-4 mr-2" /> Regras (Qualificação)
          </TabsTrigger>
          <TabsTrigger
            value="cta"
            className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Target className="w-4 h-4 mr-2" /> Objetivo (CTA)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personality" className="space-y-4 outline-none">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Identidade do Agente</CardTitle>
              <CardDescription>Como a IA deve se apresentar para os seus leads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3">
                <Label htmlFor="agent-name">Nome do Agente</Label>
                <Input
                  id="agent-name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Ana, João - Assistente"
                  className="max-w-md"
                />
                <p className="text-[13px] text-muted-foreground">
                  Este nome aparecerá nas mensagens iniciais.
                </p>
              </div>

              <div className="grid gap-3">
                <Label>Tom de Voz</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Selecione o tom de voz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amigavel">Amigável e Empático</SelectItem>
                    <SelectItem value="formal">Corporativo e Formal</SelectItem>
                    <SelectItem value="direto">Direto e Objetivo (Focado em Vendas)</SelectItem>
                    <SelectItem value="tecnico">Técnico e Especialista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Salvar Identidade
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4 outline-none">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Base de Conhecimento</CardTitle>
              <CardDescription>
                Cole aqui os textos, FAQs ou links sobre o seu produto para a IA aprender.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Textarea
                  placeholder="A TechCorp vende software de gestão de leads. Nosso plano básico custa R$99/mês..."
                  className="min-h-[300px] resize-none font-mono text-sm bg-muted/30"
                  defaultValue="Nossa empresa, TechCorp, oferece soluções SaaS B2B.&#10;Temos dois planos:&#10;- Basic (R$ 199/mês): Até 5.000 contatos.&#10;- Enterprise (Sob consulta): Contatos ilimitados, integrações personalizadas e gerente de conta.&#10;&#10;Nosso grande diferencial é a automação com IA nativa no fluxo de atendimento.&#10;Não temos suporte por telefone no plano Basic, apenas ticket.&#10;Podemos oferecer 14 dias de teste grátis se o cliente solicitar."
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-4 justify-between">
              <span className="text-xs text-muted-foreground flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-primary" /> A IA absorverá este texto
                instantaneamente.
              </span>
              <Button onClick={handleSave} disabled={isSaving}>
                Salvar Conhecimento
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 outline-none">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Critérios de Qualificação</CardTitle>
              <CardDescription>
                Defina quais informações a IA deve extrair do lead antes de considerá-lo
                "Qualificado".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Tamanho da Equipe', required: true },
                { name: 'Cargo do Lead', required: true },
                { name: 'Orçamento (Budget)', required: false },
                { name: 'Ferramenta Atual', required: false },
              ].map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-sm">{rule.name}</div>
                    {rule.required && (
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id={`rule-${idx}`} defaultChecked={true} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-2 border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Critério
              </Button>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                Salvar Regras
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4 outline-none">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Objetivo Final (CTA)</CardTitle>
              <CardDescription>
                O que a IA deve fazer quando um lead for marcado como Qualificado?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3">
                <Label>Ação Principal</Label>
                <Select defaultValue="calendly">
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendly">
                      Enviar Link de Agendamento (Calendly/Google)
                    </SelectItem>
                    <SelectItem value="human">Avisar Humano / Transferir Atendimento</SelectItem>
                    <SelectItem value="form">Enviar Formulário de Cadastro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 pt-2 border-t">
                <Label>Link do Calendly</Label>
                <Input
                  placeholder="https://calendly.com/techcorp/demo"
                  defaultValue="https://calendly.com/techcorp/demo"
                  className="max-w-md"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                Salvar Objetivo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
