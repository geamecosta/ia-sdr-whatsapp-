import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/services/db'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageCircle, Phone, Clock } from 'lucide-react'

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLeads()

    if (user) {
      const channel = supabase
        .channel('leads_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` },
          () => {
            fetchLeads()
          },
        )
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchLeads = async () => {
    try {
      const data = await db.getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      await db.updateLeadStatus(leadId, status)
      setLeads(leads.map((l) => (l.id === leadId ? { ...l, status } : l)))
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'qualificando':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'interessado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'reunião agendada':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'não interessado':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-8">Carregando leads...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Recentes</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie os leads capturados pelo WhatsApp.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Todos os Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <Phone className="h-12 w-12 mb-4 opacity-20" />
              <p>Nenhum lead recebido ainda.</p>
              <p className="text-sm mt-2">Certifique-se de configurar a integração do WhatsApp.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Interação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name || 'Desconhecido'}</TableCell>
                      <TableCell>{lead.phone_number}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => handleStatusChange(lead.id, val)}
                        >
                          <SelectTrigger
                            className={`w-[160px] h-8 text-xs font-semibold ${getStatusColor(lead.status)}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Novo">Novo</SelectItem>
                            <SelectItem value="Qualificando">Qualificando</SelectItem>
                            <SelectItem value="Interessado">Interessado</SelectItem>
                            <SelectItem value="Reunião Agendada">Reunião Agendada</SelectItem>
                            <SelectItem value="Não Interessado">Não Interessado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(lead.updated_at).toLocaleDateString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Ver Conversa
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
