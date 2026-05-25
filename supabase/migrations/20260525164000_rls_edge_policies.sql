DO $$
BEGIN
  -- Enforce idempotency and ensure RLS is enabled for necessary tables to meet security criteria
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;
END $$;

-- Leads
DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages
DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.user_id = auth.uid())
  );

-- Execution Logs
DROP POLICY IF EXISTS "Users can manage own execution_logs" ON public.execution_logs;
CREATE POLICY "Users can manage own execution_logs" ON public.execution_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Whatsapp Configs
DROP POLICY IF EXISTS "Users can manage own whatsapp_configs" ON public.whatsapp_configs;
CREATE POLICY "Users can manage own whatsapp_configs" ON public.whatsapp_configs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
