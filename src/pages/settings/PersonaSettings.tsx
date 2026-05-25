import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SdrConfigForm } from '@/components/SdrConfigForm'

export function PersonaSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comportamento da IA (Padrão Global)</CardTitle>
        <CardDescription>
          Defina as configurações padrão de persona e respostas. Estas configurações serão aplicadas
          a todos os números de WhatsApp que não possuírem uma configuração específica.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SdrConfigForm />
      </CardContent>
    </Card>
  )
}
