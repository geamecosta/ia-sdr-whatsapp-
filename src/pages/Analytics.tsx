import { FUNNEL_DATA, VOLUME_DATA } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

const funnelConfig = {
  value: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

const volumeConfig = {
  messages: {
    label: 'Mensagens',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Performance</h2>
        <p className="text-muted-foreground mt-1">
          Visão geral do impacto do seu SDR automatizado.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Funil de Qualificação</CardTitle>
            <CardDescription>
              Conversão desde a primeira mensagem até o objetivo (reunião).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={funnelConfig} className="h-full w-full">
                <BarChart
                  data={FUNNEL_DATA}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    width={100}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Volume de Interações (Hoje)</CardTitle>
            <CardDescription>
              Pico de mensagens enviadas e recebidas pela IA por hora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={volumeConfig} className="h-full w-full">
                <AreaChart data={VOLUME_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-messages)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-messages)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dx={-10}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-messages)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm bg-gradient-to-br from-background to-muted/30">
        <CardHeader>
          <CardTitle>Nuvem de Tópicos (Mapeado por IA)</CardTitle>
          <CardDescription>O que os seus leads mais perguntam durante a conversa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center py-6 px-4">
            <span className="text-3xl font-bold text-primary opacity-90 px-2">Preço</span>
            <span className="text-xl font-medium text-foreground opacity-80 px-2 mt-2">
              Integração ERP
            </span>
            <span className="text-sm font-normal text-muted-foreground px-2 mt-4">
              Tempo de Setup
            </span>
            <span className="text-2xl font-semibold text-primary px-2 mt-1">Suporte Técnico</span>
            <span className="text-lg font-medium text-foreground opacity-70 px-2 mt-3">
              Desconto Anual
            </span>
            <span className="text-4xl font-bold text-primary opacity-100 px-2">HubSpot</span>
            <span className="text-base font-normal text-muted-foreground px-2 mt-2">
              Relatórios
            </span>
            <span className="text-xl font-semibold text-foreground opacity-90 px-2 mt-4">
              Testar Grátis
            </span>
            <span className="text-sm font-normal text-muted-foreground px-2 mt-1">
              Segurança de Dados
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
