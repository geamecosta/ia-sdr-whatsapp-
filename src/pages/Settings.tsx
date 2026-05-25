import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/services/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Bot, Phone, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [aiSettings, setAiSettings] = useState({
    system_prompt: '',
    sales_manual: '',
    tone_of_voice: '',
    company_objectives: '',
  })
  const [isSavingAi, setIsSavingAi] = useState(false)
  const [testPrompt, setTestPrompt] = useState('')
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const navigate = useNavigate()

  const [waSettings, setWaSettings] = useState({
    connection_type: 'official',
    phone_number_id: '',
    access_token: '',
    verify_token: '',
    web_instance_id: '',
    web_api_key: '',
  })
  const [isSavingWa, setIsSavingWa] = useState(false)

  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false)
  const [isMfaLoading, setIsMfaLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    if (user) {
      db.getCompanySettings(user.id)
        .then((data) => {
          if (mounted && data) setAiSettings(data)
        })
        .catch(console.error)

      db.getWhatsappConfig(user.id)
        .then((data) => {
          if (mounted && data) {
            setWaSettings({
              connection_type: data.connection_type || 'official',
              phone_number_id: data.phone_number_id || '',
              access_token: data.access_token || '',
              verify_token: data.verify_token || '',
              web_instance_id: data.web_instance_id || '',
              web_api_key: data.web_api_key || '',
            })
          }
        })
        .catch(console.error)

      loadMfaFactors()
    }
    return () => {
      mounted = false
    }
  }, [user])

  const loadMfaFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    if (data) setMfaFactors(data.totp || [])
  }

  const handleStartMfaEnroll = async () => {
    setIsEnrollingMfa(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setMfaQrCode(data.totp.qr_code)
      setMfaFactorId(data.id)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
      setIsEnrollingMfa(false)
    }
  }

  const handleVerifyMfaEnroll = async () => {
    if (!mfaCode || !mfaFactorId) return
    setIsMfaLoading(true)
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      })
      if (challengeError) throw challengeError

      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      })
      if (error) throw error

      await db.addLog('info', 'MFA Ativado', { event: 'mfa_enrolled', factorId: mfaFactorId })

      toast({ title: 'MFA ativado com sucesso!' })
      setMfaQrCode('')
      setMfaFactorId('')
      setMfaCode('')
      setIsEnrollingMfa(false)
      loadMfaFactors()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
    setIsMfaLoading(false)
  }

  const handleUnenrollMfa = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      await db.addLog('info', 'MFA Desativado', { event: 'mfa_unenrolled', factorId })
      toast({ title: 'MFA desativado' })
      loadMfaFactors()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
  }

  const handleSaveAi = async () => {
    if (!user) return
    setIsSavingAi(true)
    try {
      await db.updateCompanySettings(user.id, aiSettings)
      toast({
        title: 'Configurações salvas',
        description: 'O perfil da IA foi atualizado com sucesso.',
      })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
    setIsSavingAi(false)
  }

  const handleSaveWa = async () => {
    if (!user) return
    setIsSavingWa(true)
    try {
      const payload = { ...waSettings }
      if (payload.connection_type === 'official') {
        payload.web_instance_id = ''
        payload.web_api_key = ''
      } else {
        payload.phone_number_id = ''
        payload.access_token = ''
        payload.verify_token = ''
      }

      await db.updateWhatsappConfig(user.id, payload)
      toast({
        title: 'Configurações salvas',
        description: 'As credenciais do WhatsApp foram atualizadas.',
      })
      navigate('/')
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
    setIsSavingWa(false)
  }

  const handleTestAi = () => {
    if (!testPrompt.trim()) return
    setIsTesting(true)
    setTimeout(() => {
      setTestResult(
        `[Simulação] Resposta gerada considerando o tom "${aiSettings.tone_of_voice || 'Padrão'}" e objetivo "${aiSettings.company_objectives || 'Vender'}": \n\n"Olá! Como posso ajudar com base na sua mensagem: '${testPrompt}'?"`,
      )
      setIsTesting(false)
    }, 1500)
  }

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'}/functions/v1/whatsapp-bot`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie o comportamento do seu SDR e a integração com WhatsApp.
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" /> Persona da IA
          </TabsTrigger>
          <TabsTrigger value="wa" className="gap-2">
            <Phone className="h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comportamento e Tom</CardTitle>
                  <CardDescription>Defina a personalidade do seu SDR.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt do Sistema (System Prompt)</Label>
                    <Textarea
                      rows={4}
                      placeholder="Você é um SDR especializado em..."
                      value={aiSettings.system_prompt}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, system_prompt: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tom de Voz</Label>
                    <Input
                      placeholder="Ex: Profissional, amigável, persuasivo..."
                      value={aiSettings.tone_of_voice}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, tone_of_voice: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo Principal</Label>
                    <Input
                      placeholder="Ex: Agendar uma reunião, qualificar o lead..."
                      value={aiSettings.company_objectives}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, company_objectives: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base de Conhecimento</CardTitle>
                  <CardDescription>Informações sobre seus produtos ou serviços.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Manual de Vendas / FAQ</Label>
                    <Textarea
                      rows={8}
                      placeholder="Cole aqui as informações essenciais sobre o seu negócio..."
                      value={aiSettings.sales_manual}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, sales_manual: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveAi} disabled={isSavingAi} className="w-full">
                    {isSavingAi ? 'Salvando...' : 'Salvar Configurações da IA'}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
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
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestAi}
                    disabled={isTesting || !testPrompt}
                  >
                    {isTesting ? 'Gerando...' : 'Gerar Resposta'}
                  </Button>

                  {testResult && (
                    <div className="mt-4 p-4 rounded-md bg-muted border whitespace-pre-wrap text-sm">
                      {testResult}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wa" className="space-y-6 mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Credenciais do WhatsApp API</CardTitle>
              <CardDescription>Configure a integração com o Meta Developer Portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Tipo de Conexão</Label>
                  <RadioGroup
                    value={waSettings.connection_type}
                    onValueChange={(v) => setWaSettings({ ...waSettings, connection_type: v })}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official" id="official" />
                      <Label htmlFor="official" className="font-normal cursor-pointer">
                        API Oficial
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="web" id="web" />
                      <Label htmlFor="web" className="font-normal cursor-pointer">
                        Instância Web
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {waSettings.connection_type === 'official' ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <Label>Phone Number ID</Label>
                      <Input
                        placeholder="Ex: 104561234567890"
                        value={waSettings.phone_number_id}
                        onChange={(e) =>
                          setWaSettings({ ...waSettings, phone_number_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        placeholder="EAAI..."
                        value={waSettings.access_token}
                        onChange={(e) =>
                          setWaSettings({ ...waSettings, access_token: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Verify Token</Label>
                      <Input
                        placeholder="Ex: meu_token_secreto_123"
                        value={waSettings.verify_token}
                        onChange={(e) =>
                          setWaSettings({ ...waSettings, verify_token: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Você precisará deste token ao configurar o Webhook no portal da Meta.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <Label>Instance ID</Label>
                      <Input
                        placeholder="Ex: instance12345"
                        value={waSettings.web_instance_id}
                        onChange={(e) =>
                          setWaSettings({ ...waSettings, web_instance_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="Ex: chave_secreta..."
                        value={waSettings.web_api_key}
                        onChange={(e) =>
                          setWaSettings({ ...waSettings, web_api_key: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-medium">Configuração do Webhook</h3>
                <div className="p-4 rounded-md bg-muted border flex items-center justify-between gap-4">
                  <code className="text-xs break-all flex-1">{webhookUrl}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl)
                      toast({ description: 'URL copiada para a área de transferência.' })
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveWa} disabled={isSavingWa}>
                {isSavingWa ? 'Salvando...' : 'Salvar Credenciais'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores (MFA)</CardTitle>
              <CardDescription>
                Proteja sua conta exigindo um código adicional ao fazer login em novos dispositivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mfaFactors.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <div>
                      <p className="font-medium">MFA está ativado</p>
                      <p className="text-sm opacity-90">
                        Sua conta está protegida com autenticação de dois fatores.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {mfaFactors.map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            Aplicativo Autenticador (TOTP)
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Adicionado em {new Date(factor.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnenrollMfa(factor.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {!isEnrollingMfa ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        A autenticação de dois fatores adiciona uma camada extra de segurança à sua
                        conta. Uma vez ativada, você precisará inserir um código do seu aplicativo
                        autenticador ao fazer login.
                      </p>
                      <Button onClick={handleStartMfaEnroll}>
                        Configurar Aplicativo Autenticador
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">1. Escaneie o QR Code</h3>
                        <p className="text-sm text-muted-foreground">
                          Abra o seu aplicativo autenticador (como Google Authenticator, Authy, etc)
                          e escaneie a imagem abaixo.
                        </p>
                        <div
                          className="bg-white p-4 rounded-lg inline-block my-2"
                          dangerouslySetInnerHTML={{ __html: mfaQrCode }}
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">2. Verifique o Código</h3>
                        <p className="text-sm text-muted-foreground">
                          Insira o código de 6 dígitos gerado pelo seu aplicativo para confirmar a
                          configuração.
                        </p>
                        <div className="flex flex-col gap-4 max-w-[320px]">
                          <InputOTP
                            maxLength={6}
                            value={mfaCode}
                            onChange={setMfaCode}
                            disabled={isMfaLoading}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleVerifyMfaEnroll}
                              disabled={isMfaLoading || mfaCode.length < 6}
                              className="flex-1"
                            >
                              {isMfaLoading ? 'Verificando...' : 'Ativar MFA'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEnrollingMfa(false)}
                              disabled={isMfaLoading}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
