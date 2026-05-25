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

    INSERT INTO public.profiles (id, email)
    VALUES (new_user_id, 'geamefialho@hotmail.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.company_settings (user_id, system_prompt, tone_of_voice, company_objectives, sales_manual)
    VALUES (new_user_id, 'Você é um assistente SDR focado em qualificar leads e agendar reuniões.', 'Profissional e prestativo', 'Agendar reuniões de demonstração', 'Pergunte sobre as necessidades do cliente antes de agendar.')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.whatsapp_configs (user_id, phone_number_id, access_token, verify_token)
    VALUES (new_user_id, '', '', 'meu_token_secreto_123')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
