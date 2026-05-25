import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/services/db'
import { useAuth } from '@/hooks/use-auth'

export function OnboardingModal({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    company_objectives: '',
    sales_manual: '',
    tone_of_voice: '',
    system_prompt: '',
  })

  const handleNext = () => setStep((s) => Math.min(s + 1, 3))
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSave = async () => {
    if (!user) return
    try {
      await db.updateCompanySettings(user.id, formData)
      toast({
        title: 'Configurações salvas',
        description: 'Seu assistente está pronto e configurado!',
      })
      onComplete()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao IA SDR Whatsapp</DialogTitle>
          <DialogDescription>
            Configure seu assistente para começar a qualificar seus leads.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="company_objectives">Objetivos da Empresa</Label>
                <Input
                  id="company_objectives"
                  placeholder="Ex: Vender mais planos premium, qualificar leads B2B..."
                  value={formData.company_objectives}
                  onChange={(e) => setFormData({ ...formData, company_objectives: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="sales_manual">Manual de Vendas</Label>
                <Textarea
                  id="sales_manual"
                  className="min-h-[150px]"
                  placeholder="Descreva como seu produto deve ser vendido..."
                  value={formData.sales_manual}
                  onChange={(e) => setFormData({ ...formData, sales_manual: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="tone_of_voice">Tom de Voz</Label>
                <Input
                  id="tone_of_voice"
                  placeholder="Ex: Profissional, Amigável, Persuasivo..."
                  value={formData.tone_of_voice}
                  onChange={(e) => setFormData({ ...formData, tone_of_voice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_prompt">Instruções de Sistema (Opcional)</Label>
                <Textarea
                  id="system_prompt"
                  placeholder="Instruções adicionais para a IA..."
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${step === i ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrev}>
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext}>Próximo</Button>
            ) : (
              <Button onClick={handleSave}>Salvar e Concluir</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
