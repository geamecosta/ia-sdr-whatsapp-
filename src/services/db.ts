import { supabase } from '@/lib/supabase/client'

export const db = {
  async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getLogs() {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data || []
  },

  async getWhatsappConfig(userId: string) {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getCompanySettings(userId: string) {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getMetrics() {
    const [{ data: leads }, { data: messages }] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('messages').select('*'),
    ])
    return { leads: leads || [], messages: messages || [] }
  },

  async updateCompanySettings(userId: string, settings: any) {
    const { error } = await supabase
      .from('company_settings')
      .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
    if (error) throw error
  },

  async updateWhatsappConfig(userId: string, config: any) {
    const { error } = await supabase
      .from('whatsapp_configs')
      .upsert({ user_id: userId, ...config }, { onConflict: 'user_id' })
    if (error) throw error
  },

  async addLog(level: string, message: string, details?: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('execution_logs')
      .insert({ user_id: user.id, level, message, details })
    if (error) throw error
  },
}
