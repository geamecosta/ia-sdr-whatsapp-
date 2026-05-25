import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Lead, MOCK_LEADS } from '@/lib/mock-data'
import { toast } from '@/hooks/use-toast'

interface AppStateContextType {
  isAiActive: boolean
  toggleAiActive: () => void
  leads: Lead[]
  companyName: string
  agentName: string
  setAgentName: (name: string) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isAiActive, setIsAiActive] = useState(true)
  const [leads] = useState<Lead[]>(MOCK_LEADS)
  const [agentName, setAgentName] = useState('Ana - SDR')

  const companyName = 'TechCorp Inc.'

  const toggleAiActive = () => {
    setIsAiActive((prev) => {
      const newState = !prev
      toast({
        title: newState ? 'SDR-AI Ativado' : 'SDR-AI Pausado',
        description: newState
          ? 'A inteligência artificial voltou a responder os leads automaticamente.'
          : 'O atendimento automático foi interrompido.',
        variant: newState ? 'default' : 'destructive',
      })
      return newState
    })
  }

  return (
    <AppStateContext.Provider
      value={{ isAiActive, toggleAiActive, leads, companyName, agentName, setAgentName }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
