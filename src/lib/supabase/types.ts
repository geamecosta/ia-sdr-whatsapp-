// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          company_objectives: string | null
          created_at: string
          id: string
          sales_manual: string | null
          system_prompt: string | null
          tone_of_voice: string | null
          updated_at: string
          user_id: string
          welcome_message_content: string | null
          welcome_message_enabled: boolean | null
          whatsapp_config_id: string | null
        }
        Insert: {
          company_objectives?: string | null
          created_at?: string
          id?: string
          sales_manual?: string | null
          system_prompt?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
          welcome_message_content?: string | null
          welcome_message_enabled?: boolean | null
          whatsapp_config_id?: string | null
        }
        Update: {
          company_objectives?: string | null
          created_at?: string
          id?: string
          sales_manual?: string | null
          system_prompt?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
          welcome_message_content?: string | null
          welcome_message_enabled?: boolean | null
          whatsapp_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'company_settings_whatsapp_config_id_fkey'
            columns: ['whatsapp_config_id']
            isOneToOne: false
            referencedRelation: 'whatsapp_configs'
            referencedColumns: ['id']
          },
        ]
      }
      execution_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          level: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone_number: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          phone_number: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone_number?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          provider_message_id: string | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          provider_message_id?: string | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          provider_message_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      persona_templates: {
        Row: {
          company_objectives: string | null
          created_at: string
          id: string
          name: string
          sales_manual: string | null
          system_prompt: string | null
          tone_of_voice: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_objectives?: string | null
          created_at?: string
          id?: string
          name: string
          sales_manual?: string | null
          system_prompt?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_objectives?: string | null
          created_at?: string
          id?: string
          name?: string
          sales_manual?: string | null
          system_prompt?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          cost_estimate: number
          created_at: string
          id: string
          tokens_completion: number
          tokens_prompt: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          cost_estimate?: number
          created_at?: string
          id?: string
          tokens_completion?: number
          tokens_prompt?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          cost_estimate?: number
          created_at?: string
          id?: string
          tokens_completion?: number
          tokens_prompt?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      usage_quotas: {
        Row: {
          alert_80_sent_at: string | null
          cost_per_1k_tokens: number
          current_month_usage: number
          id: string
          is_blocked: boolean
          last_reset_date: string
          monthly_token_limit: number
          user_id: string
        }
        Insert: {
          alert_80_sent_at?: string | null
          cost_per_1k_tokens?: number
          current_month_usage?: number
          id?: string
          is_blocked?: boolean
          last_reset_date?: string
          monthly_token_limit?: number
          user_id: string
        }
        Update: {
          alert_80_sent_at?: string | null
          cost_per_1k_tokens?: number
          current_month_usage?: number
          id?: string
          is_blocked?: boolean
          last_reset_date?: string
          monthly_token_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_configs: {
        Row: {
          access_token: string | null
          chatguru_account_id: string | null
          chatguru_endpoint_url: string | null
          connection_type: string
          created_at: string
          id: string
          last_heartbeat: string | null
          phone_number_id: string | null
          status: string | null
          updated_at: string
          user_id: string
          verify_token: string | null
          web_api_key: string | null
          web_instance_id: string | null
        }
        Insert: {
          access_token?: string | null
          chatguru_account_id?: string | null
          chatguru_endpoint_url?: string | null
          connection_type?: string
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          phone_number_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          verify_token?: string | null
          web_api_key?: string | null
          web_instance_id?: string | null
        }
        Update: {
          access_token?: string | null
          chatguru_account_id?: string | null
          chatguru_endpoint_url?: string | null
          connection_type?: string
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          phone_number_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          verify_token?: string | null
          web_api_key?: string | null
          web_instance_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: { p_tokens: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: company_settings
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   sales_manual: text (nullable, default: ''::text)
//   tone_of_voice: text (nullable, default: ''::text)
//   company_objectives: text (nullable, default: ''::text)
//   system_prompt: text (nullable, default: ''::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   welcome_message_enabled: boolean (nullable, default: false)
//   welcome_message_content: text (nullable)
//   whatsapp_config_id: uuid (nullable)
// Table: execution_logs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   level: text (not null)
//   message: text (not null)
//   details: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: leads
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   phone_number: text (not null)
//   name: text (nullable)
//   status: text (nullable, default: 'Novo'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: messages
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (not null)
//   role: text (not null)
//   content: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   provider_message_id: text (nullable)
// Table: persona_templates
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   name: text (not null)
//   system_prompt: text (nullable)
//   tone_of_voice: text (nullable)
//   company_objectives: text (nullable)
//   sales_manual: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   is_admin: boolean (not null, default: false)
// Table: usage_logs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   tokens_prompt: integer (not null, default: 0)
//   tokens_completion: integer (not null, default: 0)
//   total_tokens: integer (not null, default: 0)
//   cost_estimate: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
// Table: usage_quotas
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   monthly_token_limit: integer (not null, default: 50000)
//   current_month_usage: integer (not null, default: 0)
//   is_blocked: boolean (not null, default: false)
//   last_reset_date: timestamp with time zone (not null, default: now())
//   cost_per_1k_tokens: numeric (not null, default: 0.02)
//   alert_80_sent_at: timestamp with time zone (nullable)
// Table: whatsapp_configs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   phone_number_id: text (nullable, default: ''::text)
//   access_token: text (nullable, default: ''::text)
//   verify_token: text (nullable, default: ''::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   connection_type: text (not null, default: 'official'::text)
//   web_instance_id: text (nullable)
//   web_api_key: text (nullable)
//   status: text (nullable, default: 'disconnected'::text)
//   last_heartbeat: timestamp with time zone (nullable)
//   chatguru_account_id: text (nullable)
//   chatguru_endpoint_url: text (nullable)

// --- CONSTRAINTS ---
// Table: company_settings
//   PRIMARY KEY company_settings_pkey: PRIMARY KEY (id)
//   FOREIGN KEY company_settings_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   FOREIGN KEY company_settings_whatsapp_config_id_fkey: FOREIGN KEY (whatsapp_config_id) REFERENCES whatsapp_configs(id) ON DELETE CASCADE
// Table: execution_logs
//   PRIMARY KEY execution_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY execution_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: leads
//   PRIMARY KEY leads_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE leads_user_id_phone_number_key: UNIQUE (user_id, phone_number)
// Table: messages
//   FOREIGN KEY messages_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
//   PRIMARY KEY messages_pkey: PRIMARY KEY (id)
// Table: persona_templates
//   PRIMARY KEY persona_templates_pkey: PRIMARY KEY (id)
//   FOREIGN KEY persona_templates_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: usage_logs
//   PRIMARY KEY usage_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY usage_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: usage_quotas
//   PRIMARY KEY usage_quotas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY usage_quotas_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE usage_quotas_user_id_key: UNIQUE (user_id)
// Table: whatsapp_configs
//   PRIMARY KEY whatsapp_configs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY whatsapp_configs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: company_settings
//   Policy "Users can manage own company_settings" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "company_settings_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "company_settings_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "company_settings_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "company_settings_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: execution_logs
//   Policy "Users can manage own execution_logs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "execution_logs_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "execution_logs_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "execution_logs_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "execution_logs_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: leads
//   Policy "Users can manage own leads" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: messages
//   Policy "Users can manage own messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM leads l   WHERE ((l.id = messages.lead_id) AND (l.user_id = auth.uid()))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM leads l   WHERE ((l.id = messages.lead_id) AND (l.user_id = auth.uid()))))
// Table: persona_templates
//   Policy "Users can manage own persona_templates" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "persona_templates_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "persona_templates_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "persona_templates_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "persona_templates_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: profiles
//   Policy "Authenticated users can view all profiles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//     WITH CHECK: (auth.uid() = id)
// Table: usage_logs
//   Policy "Users view own logs" (SELECT, PERMISSIVE) roles={public}
//     USING: ((auth.uid() = user_id) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))))
// Table: usage_quotas
//   Policy "Admins can update quotas" (UPDATE, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))
//   Policy "Users can select own quotas" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "Users can update own quotas" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Users view own quotas" (SELECT, PERMISSIVE) roles={public}
//     USING: ((auth.uid() = user_id) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))))
// Table: whatsapp_configs
//   Policy "Users can manage own whatsapp_configs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "whatsapp_configs_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "whatsapp_configs_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "whatsapp_configs_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "whatsapp_configs_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, is_admin)
//     VALUES (NEW.id, NEW.email, false)
//     ON CONFLICT (id) DO NOTHING;
//
//     INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage, is_blocked)
//     VALUES (NEW.id, 50000, 0, false)
//     ON CONFLICT (user_id) DO NOTHING;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION increment_usage(uuid, integer)
//   CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_tokens integer)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     UPDATE public.usage_quotas
//     SET current_month_usage = current_month_usage + p_tokens
//     WHERE user_id = p_user_id;
//   END;
//   $function$
//

// --- INDEXES ---
// Table: company_settings
//   CREATE UNIQUE INDEX company_settings_user_config_idx ON public.company_settings USING btree (user_id, COALESCE(whatsapp_config_id, '00000000-0000-0000-0000-000000000000'::uuid))
// Table: execution_logs
//   CREATE INDEX execution_logs_created_at_idx ON public.execution_logs USING btree (created_at DESC)
//   CREATE INDEX execution_logs_user_id_idx ON public.execution_logs USING btree (user_id)
// Table: leads
//   CREATE INDEX leads_status_idx ON public.leads USING btree (status)
//   CREATE UNIQUE INDEX leads_user_id_phone_number_key ON public.leads USING btree (user_id, phone_number)
// Table: messages
//   CREATE UNIQUE INDEX messages_provider_message_id_idx ON public.messages USING btree (provider_message_id) WHERE (provider_message_id IS NOT NULL)
// Table: usage_quotas
//   CREATE UNIQUE INDEX usage_quotas_user_id_key ON public.usage_quotas USING btree (user_id)
// Table: whatsapp_configs
//   CREATE UNIQUE INDEX whatsapp_configs_user_device_idx ON public.whatsapp_configs USING btree (user_id, connection_type, COALESCE(web_instance_id, ''::text), COALESCE(phone_number_id, ''::text))
