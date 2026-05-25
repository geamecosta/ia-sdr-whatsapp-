-- Adicionar flag de admin no profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Permitir que admins possam ler profiles, e atualizar politica de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Tabela de Cotas Mensais
CREATE TABLE IF NOT EXISTS public.usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  monthly_token_limit INT NOT NULL DEFAULT 50000,
  current_month_usage INT NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  last_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Logs de Uso
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_prompt INT NOT NULL DEFAULT 0,
  tokens_completion INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  cost_estimate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Função RPC para incrementar o uso do usuário
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_tokens INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.usage_quotas
  SET current_month_usage = current_month_usage + p_tokens
  WHERE user_id = p_user_id;
END;
$function$;

-- Atualizar o trigger de novo usuário para criar perfil e cota
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage)
  VALUES (NEW.id, 50000, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir cotas para usuários que já existem e ainda não tem
INSERT INTO public.usage_quotas (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users view own quotas" ON public.usage_quotas;
CREATE POLICY "Users view own quotas" ON public.usage_quotas FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update quotas" ON public.usage_quotas;
CREATE POLICY "Admins can update quotas" ON public.usage_quotas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Users view own logs" ON public.usage_logs;
CREATE POLICY "Users view own logs" ON public.usage_logs FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Seed de Usuário Admin
DO $DO_BLOCK$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'geamefialho@hotmail.com') THEN
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'geamefialho@hotmail.com' LIMIT 1;
  END IF;

  -- Certificar que tem o perfil e que é admin
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (v_user_id, 'geamefialho@hotmail.com', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  -- Certificar que tem a cota correta
  INSERT INTO public.usage_quotas (user_id, monthly_token_limit, current_month_usage)
  VALUES (v_user_id, 500000, 0)
  ON CONFLICT (user_id) DO UPDATE SET monthly_token_limit = 500000;
END $DO_BLOCK$;
