import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAppState } from '@/hooks/use-app-state'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Bot,
  Users,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const MENU_ITEMS = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/' },
  { title: 'Configuração da IA', icon: Bot, url: '/config' },
  { title: 'CRM de Leads', icon: Users, url: '/leads' },
  { title: 'Integração WhatsApp', icon: MessageSquare, url: '/integration' },
  { title: 'Analytics', icon: BarChart3, url: '/analytics' },
]

export default function Layout() {
  const location = useLocation()
  const { companyName, isAiActive } = useAppState()

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-border/50">
        <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>SDR-AI Connect</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.url
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div
              className={`w-2 h-2 rounded-full ${isAiActive ? 'bg-success pulse-ring' : 'bg-destructive'}`}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {isAiActive ? 'IA Ativa e Respondendo' : 'IA Pausada'}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen bg-muted/30">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border hidden md:block"></div>
            <h1 className="font-semibold text-sm hidden md:block text-foreground/80">
              {companyName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage
                      src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1"
                      alt="Avatar"
                    />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin Silva</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@techcorp.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações da Conta</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
