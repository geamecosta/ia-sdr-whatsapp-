import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type WhatsappConfig = Database['public']['Tables']['whatsapp_configs']['Row']

export const db = {
  getWhatsappConfig: async (userId: string): Promise<WhatsappConfig | null> => {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching whatsapp config:', error)
      return null
    }

    return data
  },
}
