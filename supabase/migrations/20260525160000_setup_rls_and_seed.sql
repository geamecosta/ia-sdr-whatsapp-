-- Secure RLS policies for all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.user_id = auth.uid()));

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own company_settings" ON public.company_settings;
CREATE POLICY "Users can manage own company_settings" ON public.company_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own whatsapp_configs" ON public.whatsapp_configs;
CREATE POLICY "Users can manage own whatsapp_configs" ON public.whatsapp_configs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own execution_logs" ON public.execution_logs;
CREATE POLICY "Users can manage own execution_logs" ON public.execution_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed User according to AC
DO $DO$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'geamefialho@hotmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'geamefialho@hotmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Geame Fialho"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email)
    VALUES (new_user_id, 'geamefialho@hotmail.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $DO$;
