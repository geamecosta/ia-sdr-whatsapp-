import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PersonaSettings } from './settings/PersonaSettings'
import { WhatsappSettings } from './settings/WhatsappSettings'
import { SecuritySettings } from './settings/SecuritySettings'
import { UsageSettings } from './settings/UsageSettings'
import { LogsSettings } from './settings/LogsSettings'

export default function Settings() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie o comportamento, configurações de WhatsApp e a segurança da sua conta.
        </p>
      </div>

      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList className="flex flex-wrap w-full max-w-3xl h-auto gap-1 bg-muted p-1 rounded-md">
          <TabsTrigger value="persona" className="flex-1 h-9 min-w-[120px]">
            PERSONA DA IA
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 h-9 min-w-[120px]">
            WHATSAPP
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex-1 h-9 min-w-[150px]">
            USO E FATURAMENTO
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 h-9 min-w-[120px]">
            SEGURANÇA
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 h-9 min-w-[120px]">
            LOGS DO SISTEMA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="outline-none focus:ring-0">
          <PersonaSettings />
        </TabsContent>

        <TabsContent value="whatsapp" className="outline-none focus:ring-0">
          <WhatsappSettings />
        </TabsContent>

        <TabsContent value="usage" className="outline-none focus:ring-0">
          <UsageSettings />
        </TabsContent>

        <TabsContent value="security" className="outline-none focus:ring-0">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="logs" className="outline-none focus:ring-0">
          <LogsSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
