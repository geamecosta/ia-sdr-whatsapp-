import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type ExecutionLog = Database['public']['Tables']['execution_logs']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type WhatsappConfig = Database['public']['Tables']['whatsapp_configs']['Row']
type CompanySettings = Database['public']['Tables']['company_settings']['Row']

export const db = {
  getWhatsappConfig: async (userId: string) => {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data as WhatsappConfig | null
  },

  updateWhatsappConfig: async (userId: string, payload: Partial<WhatsappConfig>) => {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .update(payload)
      .eq('user_id', userId)
      .select()
    if (error) throw error
    return data
  },

  getLeads: async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Lead[]
  },

  getLogs: async () => {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as ExecutionLog[]
  },

  getCompanySettings: async (userId: string) => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as CompanySettings | null
  },

  updateCompanySettings: async (userId: string, payload: Partial<CompanySettings>) => {
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('company_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('company_settings')
        .insert({ ...payload, user_id: userId })
        .select()
      if (error) throw error
      return data
    }
  },
}
