import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
  mfaStatus: { currentLevel: string; nextLevel: string }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaStatus, setMfaStatus] = useState({ currentLevel: 'aal1', nextLevel: 'aal1' })

  useEffect(() => {
    let mounted = true

    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
      }

      if (session?.user) {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (mounted && data) {
          setMfaStatus({
            currentLevel: data.currentLevel,
            nextLevel: data.nextLevel,
          })
        }
      }
      if (mounted) {
        setLoading(false)
      }
    }

    checkInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
          if (data) {
            setMfaStatus({
              currentLevel: data.currentLevel,
              nextLevel: data.nextLevel,
            })
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading, mfaStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
