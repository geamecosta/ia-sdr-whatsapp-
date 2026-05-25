import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PersonaSettings } from './settings/PersonaSettings'
import { WhatsappSettings } from './settings/WhatsappSettings'
import { SecuritySettings } from './settings/SecuritySettings'

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
        <TabsList className="grid w-full grid-cols-3 max-w-2xl h-11">
          <TabsTrigger value="persona" className="h-9">
            PERSONA DA IA
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="h-9">
            WHATSAPP
          </TabsTrigger>
          <TabsTrigger value="security" className="h-9">
            SEGURANÇA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="outline-none focus:ring-0">
          <PersonaSettings />
        </TabsContent>

        <TabsContent value="whatsapp" className="outline-none focus:ring-0">
          <WhatsappSettings />
        </TabsContent>

        <TabsContent value="security" className="outline-none focus:ring-0">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
