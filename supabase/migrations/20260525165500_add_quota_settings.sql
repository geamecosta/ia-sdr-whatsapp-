-- Add cost_per_1k_tokens to usage_quotas
ALTER TABLE public.usage_quotas 
ADD COLUMN IF NOT EXISTS cost_per_1k_tokens NUMERIC NOT NULL DEFAULT 0.02;

-- Add alert_80_sent_at to track when the last threshold notification was sent
ALTER TABLE public.usage_quotas 
ADD COLUMN IF NOT EXISTS alert_80_sent_at TIMESTAMPTZ;

-- Allow authenticated users to update their own usage_quotas (for testing limits)
DROP POLICY IF EXISTS "Users can update own quotas" ON public.usage_quotas;
CREATE POLICY "Users can update own quotas" ON public.usage_quotas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
