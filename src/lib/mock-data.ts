export type LeadStatus = 'Qualificado' | 'Em Andamento' | 'Frio'

export interface ChatMessage {
  id: string
  sender: 'ai' | 'lead'
  text: string
  timestamp: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  status: LeadStatus
  lastInteraction: string
  score: number
  messages: ChatMessage[]
}

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Carlos Almeida',
    phone: '+55 11 99999-1111',
    status: 'Qualificado',
    lastInteraction: 'Há 10 min',
    score: 95,
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Olá! Sou a Ana, assistente virtual da TechCorp. Como posso ajudar com nossas soluções hoje?',
        timestamp: '10:00',
      },
      {
        id: 'm2',
        sender: 'lead',
        text: 'Gostaria de saber mais sobre o plano Enterprise.',
        timestamp: '10:05',
      },
      {
        id: 'm3',
        sender: 'ai',
        text: 'Perfeito! O plano Enterprise inclui suporte 24/7 e integrações personalizadas. Qual o tamanho da sua equipe atual?',
        timestamp: '10:06',
      },
      { id: 'm4', sender: 'lead', text: 'Somos em 50 pessoas.', timestamp: '10:15' },
      {
        id: 'm5',
        sender: 'ai',
        text: 'Ótimo. Faz muito sentido para o seu caso. Posso agendar uma reunião rápida com um de nossos especialistas para amanhã?',
        timestamp: '10:16',
      },
      { id: 'm6', sender: 'lead', text: 'Sim, amanhã às 14h.', timestamp: '10:20' },
    ],
  },
  {
    id: '2',
    name: 'Mariana Costa',
    phone: '+55 21 98888-2222',
    status: 'Em Andamento',
    lastInteraction: 'Há 1 hora',
    score: 60,
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Olá Mariana, tudo bem? Vi que baixou nosso e-book. Conseguiu aplicar as dicas?',
        timestamp: '09:00',
      },
      {
        id: 'm2',
        sender: 'lead',
        text: 'Ainda não tive tempo, mas achei interessante.',
        timestamp: '09:30',
      },
      {
        id: 'm3',
        sender: 'ai',
        text: 'Entendo perfeitamente! Se quiser, posso te enviar um resumo de 2 minutos sobre como nossa ferramenta automatiza isso.',
        timestamp: '09:31',
      },
    ],
  },
  {
    id: '3',
    name: 'Roberto Nunes',
    phone: '+55 31 97777-3333',
    status: 'Frio',
    lastInteraction: 'Ontem',
    score: 20,
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Olá Roberto, vi que visitou nossa página de preços. Ficou alguma dúvida?',
        timestamp: 'Ontem 15:00',
      },
      {
        id: 'm2',
        sender: 'lead',
        text: 'Achei caro, estou apenas pesquisando.',
        timestamp: 'Ontem 16:00',
      },
      {
        id: 'm3',
        sender: 'ai',
        text: 'Compreendo. Oferecemos um teste gratuito de 14 dias se quiser conhecer o valor na prática. Gostaria de ativar?',
        timestamp: 'Ontem 16:05',
      },
    ],
  },
  {
    id: '4',
    name: 'Fernanda Lima',
    phone: '+55 41 96666-4444',
    status: 'Qualificado',
    lastInteraction: 'Há 2 horas',
    score: 88,
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Oi Fernanda, bem-vinda! Procurando por automação de marketing?',
        timestamp: '08:00',
      },
      {
        id: 'm2',
        sender: 'lead',
        text: 'Sim, precisamos melhorar a captação de leads.',
        timestamp: '08:10',
      },
      {
        id: 'm3',
        sender: 'ai',
        text: 'Certo. Vocês usam algum CRM atualmente?',
        timestamp: '08:11',
      },
      { id: 'm4', sender: 'lead', text: 'Usamos o HubSpot.', timestamp: '08:15' },
      {
        id: 'm5',
        sender: 'ai',
        text: 'Perfeito, temos integração nativa com o HubSpot! Vou pedir para um consultor te chamar, qual melhor horário?',
        timestamp: '08:16',
      },
    ],
  },
  {
    id: '5',
    name: 'Lucas Silva',
    phone: '+55 51 95555-5555',
    status: 'Em Andamento',
    lastInteraction: 'Há 5 horas',
    score: 45,
    messages: [
      {
        id: 'm1',
        sender: 'ai',
        text: 'Olá Lucas! Dúvidas sobre o evento da próxima semana?',
        timestamp: '07:00',
      },
    ],
  },
]

export const FUNNEL_DATA = [
  { name: 'Primeiro Contato', value: 1240 },
  { name: 'Engajados', value: 850 },
  { name: 'Qualificados', value: 320 },
  { name: 'Reuniões', value: 85 },
]

export const VOLUME_DATA = [
  { time: '08:00', messages: 12 },
  { time: '10:00', messages: 45 },
  { time: '12:00', messages: 68 },
  { time: '14:00', messages: 55 },
  { time: '16:00', messages: 80 },
  { time: '18:00', messages: 34 },
]
