DO $$
BEGIN
  -- 1. Modify whatsapp_configs table
  ALTER TABLE public.whatsapp_configs DROP CONSTRAINT IF EXISTS whatsapp_configs_user_id_key;
  
  ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS chatguru_account_id TEXT;
  
  DROP INDEX IF EXISTS whatsapp_configs_user_device_idx;
  CREATE UNIQUE INDEX whatsapp_configs_user_device_idx ON public.whatsapp_configs (
    user_id, 
    connection_type, 
    COALESCE(web_instance_id, ''), 
    COALESCE(phone_number_id, '')
  );

  -- 2. Modify company_settings table
  ALTER TABLE public.company_settings DROP CONSTRAINT IF EXISTS company_settings_user_id_key;
  
  ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'company_settings_whatsapp_config_id_fkey'
  ) THEN
      ALTER TABLE public.company_settings 
      ADD CONSTRAINT company_settings_whatsapp_config_id_fkey 
      FOREIGN KEY (whatsapp_config_id) REFERENCES public.whatsapp_configs(id) ON DELETE CASCADE;
  END IF;

  DROP INDEX IF EXISTS company_settings_user_config_idx;
  CREATE UNIQUE INDEX company_settings_user_config_idx ON public.company_settings (
    user_id, 
    COALESCE(whatsapp_config_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
END $$;

-- Drop and recreate RLS policies to ensure safety with the new columns/indexes
DROP POLICY IF EXISTS "Users can manage own company_settings" ON public.company_settings;
CREATE POLICY "Users can manage own company_settings" ON public.company_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can manage own whatsapp_configs" ON public.whatsapp_configs;
CREATE POLICY "Users can manage own whatsapp_configs" ON public.whatsapp_configs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
