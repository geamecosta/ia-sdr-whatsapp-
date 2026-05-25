DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists)
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
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '',    -- confirmation_token: MUST be '' not NULL
      '',    -- recovery_token: MUST be '' not NULL
      '',    -- email_change_token_new: MUST be '' not NULL
      '',    -- email_change: MUST be '' not NULL
      '',    -- email_change_token_current: MUST be '' not NULL
      NULL,  -- phone: MUST be NULL (not '') due to UNIQUE constraint
      '',    -- phone_change: MUST be '' not NULL
      '',    -- phone_change_token: MUST be '' not NULL
      ''     -- reauthentication_token: MUST be '' not NULL
    );

    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (new_user_id, 'geamefialho@hotmail.com', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- RLS Policies for whatsapp_configs
DROP POLICY IF EXISTS "whatsapp_configs_select" ON public.whatsapp_configs;
CREATE POLICY "whatsapp_configs_select" ON public.whatsapp_configs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_configs_insert" ON public.whatsapp_configs;
CREATE POLICY "whatsapp_configs_insert" ON public.whatsapp_configs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_configs_update" ON public.whatsapp_configs;
CREATE POLICY "whatsapp_configs_update" ON public.whatsapp_configs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_configs_delete" ON public.whatsapp_configs;
CREATE POLICY "whatsapp_configs_delete" ON public.whatsapp_configs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- RLS Policies for company_settings
DROP POLICY IF EXISTS "company_settings_select" ON public.company_settings;
CREATE POLICY "company_settings_select" ON public.company_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "company_settings_insert" ON public.company_settings;
CREATE POLICY "company_settings_insert" ON public.company_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "company_settings_update" ON public.company_settings;
CREATE POLICY "company_settings_update" ON public.company_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "company_settings_delete" ON public.company_settings;
CREATE POLICY "company_settings_delete" ON public.company_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- RLS Policies for persona_templates
DROP POLICY IF EXISTS "persona_templates_select" ON public.persona_templates;
CREATE POLICY "persona_templates_select" ON public.persona_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "persona_templates_insert" ON public.persona_templates;
CREATE POLICY "persona_templates_insert" ON public.persona_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "persona_templates_update" ON public.persona_templates;
CREATE POLICY "persona_templates_update" ON public.persona_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "persona_templates_delete" ON public.persona_templates;
CREATE POLICY "persona_templates_delete" ON public.persona_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- RLS Policies for execution_logs
DROP POLICY IF EXISTS "execution_logs_select" ON public.execution_logs;
CREATE POLICY "execution_logs_select" ON public.execution_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "execution_logs_insert" ON public.execution_logs;
CREATE POLICY "execution_logs_insert" ON public.execution_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "execution_logs_update" ON public.execution_logs;
CREATE POLICY "execution_logs_update" ON public.execution_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "execution_logs_delete" ON public.execution_logs;
CREATE POLICY "execution_logs_delete" ON public.execution_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
