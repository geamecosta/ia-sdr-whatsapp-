import { supabase } from '@/lib/supabase/client'

export const db = {
  // Settings
  async getCompanySettings(userId: string) {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async updateCompanySettings(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
  // WhatsApp Config
  async getWhatsappConfig(userId: string) {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async updateWhatsappConfig(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
  // Leads
  async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async getLead(leadId: string) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (error) throw error
    return data
  },
  async updateLeadStatus(leadId: string, status: string) {
    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single()
    if (error) throw error
    return data
  },
  // Messages
  async getMessages(leadId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },
  async sendMessage(leadId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ lead_id: leadId, role: 'user', content })
      .select()
      .single()
    if (error) throw error
    return data
  },
  // Logs
  async getLogs() {
    const { data, error } = await supabase
      .from('execution_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data || []
  },
  async addLog(level: string, message: string, details?: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('execution_logs' as any)
      .insert({ user_id: user.id, level, message, details })
    if (error) throw error
  },
}
