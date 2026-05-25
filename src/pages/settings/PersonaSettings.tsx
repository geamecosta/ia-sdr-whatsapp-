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
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Pencil, Trash2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function PersonaSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    system_prompt: '',
    tone_of_voice: '',
    company_objectives: '',
    sales_manual: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchTemplates = async () => {
    if (!user) return
    const { data } = await supabase
      .from('persona_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setTemplates(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTemplates()
  }, [user])

  const openNew = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      system_prompt: '',
      tone_of_voice: '',
      company_objectives: '',
      sales_manual: '',
    })
    setIsDialogOpen(true)
  }

  const openEdit = (t: any) => {
    setEditingTemplate(t)
    setFormData({
      name: t.name || '',
      system_prompt: t.system_prompt || '',
      tone_of_voice: t.tone_of_voice || '',
      company_objectives: t.company_objectives || '',
      sales_manual: t.sales_manual || '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user) return
    if (!formData.name) {
      toast({
        title: 'Erro',
        description: 'O nome da persona é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    let error = null

    if (editingTemplate) {
      const { error: err } = await supabase
        .from('persona_templates')
        .update({
          name: formData.name,
          system_prompt: formData.system_prompt,
          tone_of_voice: formData.tone_of_voice,
          company_objectives: formData.company_objectives,
          sales_manual: formData.sales_manual,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id)
      error = err
    } else {
      const { error: err } = await supabase.from('persona_templates').insert({
        user_id: user.id,
        name: formData.name,
        system_prompt: formData.system_prompt,
        tone_of_voice: formData.tone_of_voice,
        company_objectives: formData.company_objectives,
        sales_manual: formData.sales_manual,
      })
      error = err
    }

    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar persona.', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Persona salva com sucesso.' })
      fetchTemplates()
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta persona?')) return
    await supabase.from('persona_templates').delete().eq('id', id)
    fetchTemplates()
    toast({ title: 'Sucesso', description: 'Persona excluída.' })
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Templates de Persona da IA</h3>
          <p className="text-sm text-muted-foreground">
            Crie perfis de comportamento para vincular aos seus aparelhos conectados.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: SDR Vendas Premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Prompt de Sistema</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="Instruções de base para a IA..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Input
                  value={formData.tone_of_voice}
                  onChange={(e) => setFormData({ ...formData, tone_of_voice: e.target.value })}
                  placeholder="Ex: Profissional, amigável..."
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivos da Empresa</Label>
                <Textarea
                  value={formData.company_objectives}
                  onChange={(e) => setFormData({ ...formData, company_objectives: e.target.value })}
                  placeholder="Qual o objetivo desta persona?"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Manual de Vendas / FAQ</Label>
                <Textarea
                  value={formData.sales_manual}
                  onChange={(e) => setFormData({ ...formData, sales_manual: e.target.value })}
                  placeholder="Detalhes sobre produtos, FAQs..."
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Persona
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <p>Nenhuma persona configurada.</p>
            <p className="text-sm mt-1">
              Clique em "Nova Persona" para criar templates reutilizáveis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {t.system_prompt || 'Sem prompt configurado.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 space-y-2 text-sm flex-1">
                <div>
                  <span className="font-semibold text-muted-foreground">Tom:</span>{' '}
                  {t.tone_of_voice || '-'}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t flex justify-end gap-2 bg-muted/20">
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(t.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
