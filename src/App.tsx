import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStateProvider } from '@/hooks/use-app-state'

import Layout from './components/Layout'
import Index from './pages/Index'
import AgentConfig from './pages/AgentConfig'
import Integration from './pages/Integration'
import Leads from './pages/Leads'
import Analytics from './pages/Analytics'
import NotFound from './pages/NotFound'

const App = () => (
  <AppStateProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/config" element={<AgentConfig />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppStateProvider>
)

export default App
