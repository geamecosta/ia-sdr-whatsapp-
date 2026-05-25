DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed test user (idempotent: skip if email already exists)
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
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin Test"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- Insert into dependent tables
    INSERT INTO public.profiles (id, email)
    VALUES (new_user_id, 'geamefialho@hotmail.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.company_settings (user_id)
    VALUES (new_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- If user already exists but might be missing company_settings
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'geamefialho@hotmail.com' LIMIT 1;
    
    INSERT INTO public.company_settings (user_id)
    VALUES (new_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
