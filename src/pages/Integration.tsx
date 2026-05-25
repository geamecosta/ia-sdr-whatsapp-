import { useState, useEffect } from 'react'
import { useAppState } from '@/hooks/use-app-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { QrCode, Smartphone, Wifi, RefreshCw, Power } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Integration() {
  const { isAiActive, toggleAiActive } = useAppState()
  const [isConnected, setIsConnected] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: 'Status Atualizado',
        description: 'A conexão com o WhatsApp está estável.',
      })
    }, 1500)
  }

  const handleDisconnect = () => {
    if (isConnected) {
      setIsConnected(false)
      toast({
        title: 'Desconectado',
        description: 'Seu WhatsApp foi desconectado. O SDR-AI parou de responder.',
        variant: 'destructive',
      })
      if (isAiActive) toggleAiActive() // Turn off AI if disconnected
    } else {
      setIsConnected(true)
      toast({
        title: 'Conectado com Sucesso',
        description: 'WhatsApp vinculado. Ative o SDR-AI para começar.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Central de Operações</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie a conexão com o WhatsApp e o status operacional da Inteligência Artificial.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Connection Panel */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden">
          {isConnected && <div className="absolute top-0 left-0 w-full h-1 bg-success"></div>}
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  Conexão WhatsApp
                </CardTitle>
                <CardDescription className="mt-1">Vincule seu número comercial</CardDescription>
              </div>
              <Badge
                variant={isConnected ? 'default' : 'secondary'}
                className={
                  isConnected
                    ? 'bg-success hover:bg-success/80 text-white'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {isConnected ? (
                  <span className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                ) : (
                  'Aguardando Leitura'
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {isConnected ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center pulse-ring">
                  <Smartphone className="w-10 h-10 text-success" />
                </div>
                <div>
                  <p className="font-medium text-lg">+55 11 99999-0000</p>
                  <p className="text-sm text-muted-foreground">Conectado há 14 dias</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-white rounded-xl shadow-sm border">
                  <QrCode className="w-48 h-48 text-zinc-900" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Abra o WhatsApp no seu celular</p>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Vá em Aparelhos Conectados &gt; Conectar um Aparelho e aponte a câmera.
                  </p>
                </div>
                <Button onClick={handleDisconnect} className="w-full max-w-[200px]">
                  Simular Conexão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Master Control Panel */}
        <div className="space-y-6">
          <Card
            className={`border-2 transition-colors duration-300 ${isAiActive ? 'border-primary/50 shadow-md shadow-primary/5' : 'border-border/60'}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power
                  className={`w-5 h-5 ${isAiActive ? 'text-primary' : 'text-muted-foreground'}`}
                />
                Piloto Automático (SDR)
              </CardTitle>
              <CardDescription>
                Ligue ou desligue as respostas automáticas para todos os leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Status Operacional</Label>
                  <p className="text-sm text-muted-foreground">
                    {isAiActive
                      ? 'A IA está lendo e respondendo ativamente.'
                      : 'O sistema está pausado. Apenas humanos respondem.'}
                  </p>
                </div>
                <Switch
                  checked={isAiActive}
                  onCheckedChange={toggleAiActive}
                  disabled={!isConnected}
                  className="scale-125 ml-4"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Configurações de Operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="handoff" className="flex-1 cursor-pointer">
                  <span className="font-medium block mb-1">
                    Pausa automática em mensagem de voz
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    A IA transfere para um humano se o lead enviar áudio.
                  </span>
                </Label>
                <Switch id="handoff" defaultChecked />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="delay" className="flex-1 cursor-pointer">
                  <span className="font-medium block mb-1">Atraso humano (Delay)</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Adiciona 3-8s de digitação antes de responder.
                  </span>
                </Label>
                <Switch id="delay" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
