import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/services/db'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useToast } from '@/hooks/use-toast'
import { Shield } from 'lucide-react'

export default function MfaVerify() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, mfaStatus, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    } else if (mfaStatus.currentLevel === 'aal2' || mfaStatus.nextLevel === 'aal1') {
      navigate(from, { replace: true })
    }
  }, [user, mfaStatus, navigate, from])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) return

    setIsLoading(true)
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (!factors || !factors.totp || factors.totp.length === 0) {
        throw new Error('Nenhum fator MFA encontrado.')
      }

      const totpFactor = factors.totp[0]

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })
      if (challengeError) throw challengeError

      const { error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      })

      if (error) throw error

      await db.addLog('success', 'Verificação MFA Concluída', {
        event: 'mfa_challenge_success',
        factorId: totpFactor.id,
      })

      toast({
        title: 'Verificação concluída',
        description: 'Você foi autenticado com sucesso.',
      })

      navigate(from, { replace: true })
    } catch (error: any) {
      await db.addLog('error', 'Falha na Verificação MFA', {
        event: 'mfa_challenge_failed',
        error: error.message,
      })
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'O código inserido está incorreto ou expirou.',
      })
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Verificação de Segurança</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Autenticação de Dois Fatores</CardTitle>
          <CardDescription>
            Por favor, insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6 flex flex-col items-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
              {isLoading ? 'Verificando...' : 'Verificar Código'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="ghost" onClick={handleSignOut} disabled={isLoading}>
            Sair e usar outra conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
