import { useAppState } from '@/hooks/use-app-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, CheckCircle2, Calendar, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Index() {
  const { leads, agentName } = useAppState()

  const recentLeads = leads.slice(0, 4)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Olá, Admin 👋</h2>
          <p className="text-muted-foreground">
            Sua assistente <span className="font-medium text-foreground">{agentName}</span>{' '}
            processou <span className="text-primary font-medium">45 conversas</span> hoje.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/config">Editar Personalidade</Link>
          </Button>
          <Button asChild>
            <Link to="/leads">Ver Conversas</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Conversas
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-success mt-1">+12% desde ontem</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Qualificados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-success mt-1">+5 novos hoje</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reuniões Agendadas
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Para esta semana</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Resposta IA
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.4%</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio: 4s</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4 border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Atividade Recente em Tempo Real</CardTitle>
              <CardDescription>As últimas interações do SDR-AI no WhatsApp</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/leads">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 mt-1 border border-border">
                    <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${lead.id}`} />
                    <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{lead.name}</span>
                      <Badge
                        variant={
                          lead.status === 'Qualificado'
                            ? 'default'
                            : lead.status === 'Em Andamento'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={
                          lead.status === 'Qualificado'
                            ? 'bg-success hover:bg-success/80 text-success-foreground border-transparent'
                            : ''
                        }
                      >
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-[250px] sm:max-w-md">
                      "{lead.messages[lead.messages.length - 1]?.text}"
                    </p>
                    <span className="text-xs text-muted-foreground/70">{lead.lastInteraction}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0 ml-4 hidden sm:flex"
                >
                  <Link to="/leads">Abrir Chat</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
