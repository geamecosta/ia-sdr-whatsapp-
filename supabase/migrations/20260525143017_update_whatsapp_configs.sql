ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'official';
ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS web_instance_id TEXT;
ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS web_api_key TEXT;

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
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (id, email)
    VALUES (new_user_id, 'geamefialho@hotmail.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
