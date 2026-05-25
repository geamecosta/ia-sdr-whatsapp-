import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { db } from '@/services/db'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, mfaStatus } = useAuth()
  const location = useLocation()
  const [hasLoggedMfaFailure, setHasLoggedMfaFailure] = useState(false)

  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null)
  const [checkingSetup, setCheckingSetup] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkSetup() {
      if (!user) {
        if (mounted) setCheckingSetup(false)
        return
      }

      try {
        const { data: configData } = await supabase
          .from('whatsapp_configs')
          .select('id, connection_type, access_token, web_instance_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (mounted) {
          const isValid =
            !!configData &&
            ((configData.connection_type === 'official' && !!configData.access_token) ||
              (configData.connection_type === 'web' && !!configData.web_instance_id))
          setIsSetupComplete(isValid)
          setCheckingSetup(false)
        }
      } catch (err) {
        if (mounted) {
          setIsSetupComplete(false)
          setCheckingSetup(false)
        }
      }
    }

    if (!authLoading) {
      checkSetup()
    }

    return () => {
      mounted = false
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!authLoading && user) {
      if (
        mfaStatus?.nextLevel === 'aal2' &&
        mfaStatus?.currentLevel === 'aal1' &&
        !hasLoggedMfaFailure
      ) {
        if (db && typeof db.addLog === 'function') {
          db.addLog('error', 'Acesso Negado: MFA Requerido', {
            event: 'mfa_required_access_denied',
            path: location.pathname,
          }).catch(() => {})
        }
        setHasLoggedMfaFailure(true)
      }
    }
  }, [authLoading, user, mfaStatus, location.pathname, hasLoggedMfaFailure])

  if (authLoading || checkingSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (mfaStatus?.nextLevel === 'aal2' && mfaStatus?.currentLevel === 'aal1') {
    return <Navigate to="/mfa-verify" replace state={{ from: location }} />
  }

  if (isSetupComplete === false && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace state={{ from: location }} />
  }

  return <>{children}</>
}
