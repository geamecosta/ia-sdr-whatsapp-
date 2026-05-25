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
import { useToast } from '@/hooks/use-toast'
import { Loader2, KeyRound } from 'lucide-react'

export function SecuritySettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const [password, setPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  const handleUpdatePassword = async () => {
    if (!password) {
      toast({ title: 'Aviso', description: 'Digite uma nova senha.', variant: 'destructive' })
      return
    }
    setUpdating(true)
    const { error } = await supabase.auth.updateUser({ password })
    setUpdating(false)

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar a senha.', variant: 'destructive' })
    } else {
      setPassword('')
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso.' })
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Conta</CardTitle>
          <CardDescription>Informações básicas do seu perfil de usuário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">
              O email de acesso não pode ser alterado por aqui.
            </p>
          </div>
          <div className="space-y-2">
            <Label>ID de Usuário</Label>
            <Input
              value={user?.id || ''}
              disabled
              className="font-mono text-xs text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Atualize sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input
              type="password"
              placeholder="Digite a nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t px-6 py-4 mt-2">
          <Button
            onClick={handleUpdatePassword}
            disabled={updating || !password}
            className="ml-auto w-full sm:w-auto"
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            {updating ? 'Atualizando...' : 'Atualizar Senha'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
