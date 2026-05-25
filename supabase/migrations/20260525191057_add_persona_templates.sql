CREATE TABLE IF NOT EXISTS public.persona_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT,
    tone_of_voice TEXT,
    company_objectives TEXT,
    sales_manual TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.persona_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own persona_templates" ON public.persona_templates;
CREATE POLICY "Users can manage own persona_templates" ON public.persona_templates
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DO $$
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
      '{"name": "Geame"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (new_user_id, 'geamefialho@hotmail.com', true)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage, is_blocked)
    VALUES (new_user_id, 50000, 0, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
