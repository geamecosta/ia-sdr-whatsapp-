import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { db } from '@/services/db'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaStatus } = useAuth()
  const location = useLocation()
  const [hasLoggedMfaFailure, setHasLoggedMfaFailure] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (
        mfaStatus.nextLevel === 'aal2' &&
        mfaStatus.currentLevel === 'aal1' &&
        !hasLoggedMfaFailure
      ) {
        db.addLog('error', 'Acesso Negado: MFA Requerido', {
          event: 'mfa_required_access_denied',
          path: location.pathname,
        }).catch(() => {})
        setHasLoggedMfaFailure(true)
      }
    }
  }, [loading, user, mfaStatus, location.pathname, hasLoggedMfaFailure])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (mfaStatus.nextLevel === 'aal2' && mfaStatus.currentLevel === 'aal1') {
    return <Navigate to="/mfa-verify" replace state={{ from: location }} />
  }

  return <>{children}</>
}
