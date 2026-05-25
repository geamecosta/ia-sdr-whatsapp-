import { useState } from 'react'
import { useAppState } from '@/hooks/use-app-state'
import { Lead } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Search, Filter, MessageSquareText, Hand, UserCheck } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Leads() {
  const { leads, agentName } = useAppState()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phone.includes(searchTerm),
  )

  const openChat = (lead: Lead) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleTakeOver = () => {
    toast({
      title: 'Atendimento Assumido',
      description: `A IA foi pausada para ${selectedLead?.name}. Agora é com você!`,
    })
    setIsSheetOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM de Leads</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe todas as interações da IA.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome ou telefone..."
              className="pl-9 bg-white dark:bg-zinc-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 bg-white dark:bg-zinc-900">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[250px]">Lead</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="hidden md:table-cell">Última Interação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum lead encontrado com estes filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => openChat(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?seed=${lead.id}`}
                          />
                          <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{lead.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.phone}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
                          <div
                            className={`h-2 rounded-full ${lead.score >= 80 ? 'bg-success' : lead.score >= 40 ? 'bg-primary' : 'bg-muted-foreground'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {lead.lastInteraction}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <MessageSquareText className="h-4 w-4 mr-2" />
                        Ver Chat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chat Preview Modal */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full border-l">
          <SheetHeader className="p-4 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?seed=${selectedLead?.id}`}
                />
                <AvatarFallback>{selectedLead?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left">
                <SheetTitle className="text-base">{selectedLead?.name}</SheetTitle>
                <SheetDescription className="text-xs mt-0">{selectedLead?.phone}</SheetDescription>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant="outline" className="bg-background text-[10px] uppercase">
                  Score: {selectedLead?.score}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 bg-[url('https://img.usecurling.com/p/800/800?q=pattern&color=white&dpr=1')] bg-cover bg-center overflow-hidden flex flex-col relative before:absolute before:inset-0 before:bg-background/95 before:z-0">
            <ScrollArea className="flex-1 p-4 z-10">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground uppercase font-medium">
                    Hoje
                  </span>
                </div>
                {selectedLead?.messages.map((msg) => {
                  const isAi = msg.sender === 'ai'
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {isAi && (
                          <Avatar className="h-6 w-6 shrink-0 mb-1">
                            <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                              IA
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-sm shadow-sm ${
                            isAi
                              ? 'bg-white dark:bg-zinc-800 border rounded-bl-none text-foreground'
                              : 'bg-primary text-primary-foreground rounded-br-none'
                          }`}
                        >
                          {msg.text}
                          <div className={`text-[10px] text-right mt-1 opacity-70`}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                      {isAi && (
                        <span className="text-[10px] text-muted-foreground ml-9 mt-1">
                          {agentName}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 bg-background border-t">
            <div className="flex gap-3">
              <Button onClick={handleTakeOver} className="w-full font-medium" variant="default">
                <Hand className="w-4 h-4 mr-2" /> Assumir Atendimento (Pausar IA)
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Ao assumir, o SDR-AI parará de responder este lead específico.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
