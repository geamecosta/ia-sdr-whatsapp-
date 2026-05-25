CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS execution_logs_created_at_idx ON public.execution_logs (created_at DESC);

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
      '{"name": "Admin SDR"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- Profile will be auto-created by the trigger on_auth_user_created if it exists,
    -- but just in case we insert directly with ON CONFLICT DO NOTHING
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (new_user_id, 'geamefialho@hotmail.com', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Settings
    INSERT INTO public.company_settings (id, user_id, sales_manual, tone_of_voice, company_objectives, system_prompt)
    VALUES (gen_random_uuid(), new_user_id, 'Venda nossos serviços SaaS', 'Profissional e amigável', 'Agendar reuniões', 'Você é um SDR focado na qualificação de leads.')
    ON CONFLICT (user_id) DO NOTHING;

    -- WhatsApp Config (Empty state to trigger the Dashboard prompt onboarding)
    INSERT INTO public.whatsapp_configs (id, user_id, phone_number_id, access_token, verify_token)
    VALUES (gen_random_uuid(), new_user_id, '', '', '')
    ON CONFLICT (user_id) DO NOTHING;

    -- Seeds Leads
    INSERT INTO public.leads (id, user_id, phone_number, name, status, created_at, updated_at) VALUES 
      (gen_random_uuid(), new_user_id, '5511999999991', 'João Silva', 'Novo', NOW() - INTERVAL '2 days', NOW()),
      (gen_random_uuid(), new_user_id, '5511999999992', 'Maria Souza', 'Em Atendimento', NOW() - INTERVAL '1 day', NOW()),
      (gen_random_uuid(), new_user_id, '5511999999993', 'Carlos Lima', 'Convertido', NOW(), NOW())
    ON CONFLICT (user_id, phone_number) DO NOTHING;

    -- Seed Logs
    INSERT INTO public.execution_logs (id, user_id, level, message, details, created_at) VALUES
      (gen_random_uuid(), new_user_id, 'info', 'Sistema inicializado', '{"event": "start"}', NOW() - INTERVAL '3 days'),
      (gen_random_uuid(), new_user_id, 'success', 'Mensagem enviada para João', '{"lead": "João Silva"}', NOW() - INTERVAL '2 days'),
      (gen_random_uuid(), new_user_id, 'info', 'SDR começou atendimento com Maria', '{}', NOW() - INTERVAL '1 day'),
      (gen_random_uuid(), new_user_id, 'success', 'Lead Carlos foi convertido!', '{}', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
