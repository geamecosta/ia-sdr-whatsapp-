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
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (new_user_id, 'geamefialho@hotmail.com', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage, cost_per_1k_tokens)
    VALUES (new_user_id, 100000, 0, 0.02)
    ON CONFLICT (user_id) DO UPDATE SET monthly_token_limit = 100000;
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'geamefialho@hotmail.com';
    
    UPDATE public.profiles SET is_admin = true WHERE id = new_user_id;
    
    INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage, cost_per_1k_tokens)
    VALUES (new_user_id, 100000, 0, 0.02)
    ON CONFLICT (user_id) DO UPDATE SET monthly_token_limit = 100000;
  END IF;
END $$;
