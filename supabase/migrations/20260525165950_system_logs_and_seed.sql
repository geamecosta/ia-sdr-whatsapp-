-- 1. Ensure RLS policies for execution_logs
DROP POLICY IF EXISTS "Users can manage own execution_logs" ON public.execution_logs;
CREATE POLICY "Users can manage own execution_logs" ON public.execution_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Seed data for geamefialho@hotmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'geamefialho@hotmail.com' LIMIT 1;
  
  -- Create user if missing
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'geamefialho@hotmail.com',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- Insert test error log for the UI
  INSERT INTO public.execution_logs (user_id, level, message, details)
  VALUES (
    v_user_id,
    'error',
    'Test Error: Conexão com API do WhatsApp falhou',
    '{"status": 500, "error": "Timeout", "context": "Diagnostic UI test"}'::jsonb
  );
END $$;
