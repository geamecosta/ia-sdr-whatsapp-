import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { MessageSquare, Settings, Users, LogOut, Menu, Activity, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/services/db'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

export default function Layout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')

  useEffect(() => {
    if (user) {
      db.getWhatsappConfig(user.id)
        .then((config) => {
          if (config) setConnectionStatus(config.status || 'disconnected')
          else setConnectionStatus('disconnected')
        })
        .catch(console.error)

      const channel = supabase
        .channel('whatsapp_configs_status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'whatsapp_configs',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setConnectionStatus(payload.new.status || 'disconnected')
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  if (loading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center">Carregando...</div>
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium',
          location.pathname === '/'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        <Activity className="h-5 w-5" />
        Dashboard
      </Link>
      <Link
        to="/leads"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium',
          location.pathname.startsWith('/leads')
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        <Users className="h-5 w-5" />
        Leads
      </Link>
      <Link
        to="/logs"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium',
          location.pathname === '/logs'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-5 w-5" />
        Logs
      </Link>
      <Link
        to="/settings"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium',
          location.pathname === '/settings'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        <Settings className="h-5 w-5" />
        Configurações
      </Link>
    </>
  )

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-4 border-b flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">IA SDR Pro</span>
        </div>
        <div className="px-4 py-2 mt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border shadow-sm">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full flex-shrink-0',
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500',
              )}
            />
            <span className="text-sm font-medium capitalize truncate">
              {connectionStatus === 'connected'
                ? 'Online'
                : connectionStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Offline'}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-bold">IA SDR Pro</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
              <div className="mt-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border shadow-sm">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full flex-shrink-0',
                      connectionStatus === 'connected'
                        ? 'bg-green-500'
                        : connectionStatus === 'connecting'
                          ? 'bg-yellow-500 animate-pulse'
                          : 'bg-red-500',
                    )}
                  />
                  <span className="text-sm font-medium capitalize truncate">
                    {connectionStatus === 'connected'
                      ? 'Online'
                      : connectionStatus === 'connecting'
                        ? 'Conectando...'
                        : 'Offline'}
                  </span>
                </div>
              </div>
              <nav className="flex-1 space-y-2 mt-4">
                <NavLinks />
              </nav>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 mt-auto"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
