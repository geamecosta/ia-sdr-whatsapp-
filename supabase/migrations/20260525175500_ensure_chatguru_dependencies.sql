-- This migration ensures that the database structure for ChatGuru device instances exist.
-- It uses IF NOT EXISTS clauses for idempotency as required by the specifications.

DO $$
BEGIN
  -- Validate that whatsapp_configs table has the required ChatGuru columns
  ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS chatguru_account_id text;
  ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS web_api_key text;
  ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS web_instance_id text;

  -- Validate that company_settings table references the configured instances individually
  ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS whatsapp_config_id uuid REFERENCES public.whatsapp_configs(id) ON DELETE CASCADE;

  -- Ensure unique constraints to prevent duplicating the same ChatGuru devices
  CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_configs_user_device_idx 
  ON public.whatsapp_configs USING btree (user_id, connection_type, COALESCE(web_instance_id, ''::text), COALESCE(phone_number_id, ''::text));
END $$;
