-- 1. Ensure RLS policies for usage_quotas allow authenticated users to view and update their own quota
DROP POLICY IF EXISTS "Users can select own quotas" ON public.usage_quotas;
CREATE POLICY "Users can select own quotas" ON public.usage_quotas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quotas" ON public.usage_quotas;
CREATE POLICY "Users can update own quotas" ON public.usage_quotas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Fail-safe quota initialization for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage, is_blocked)
  VALUES (NEW.id, 50000, 0, false)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed Data
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
      crypt('Skip@Pass123', gen_salt('bf')),
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
