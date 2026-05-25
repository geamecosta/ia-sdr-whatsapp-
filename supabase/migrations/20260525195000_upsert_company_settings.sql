CREATE OR REPLACE FUNCTION public.upsert_company_settings(
  p_user_id uuid,
  p_whatsapp_config_id uuid,
  p_system_prompt text,
  p_tone_of_voice text,
  p_company_objectives text,
  p_sales_manual text,
  p_welcome_message_enabled boolean,
  p_welcome_message_content text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.company_settings (
    user_id,
    whatsapp_config_id,
    system_prompt,
    tone_of_voice,
    company_objectives,
    sales_manual,
    welcome_message_enabled,
    welcome_message_content,
    updated_at
  ) VALUES (
    p_user_id,
    p_whatsapp_config_id,
    p_system_prompt,
    p_tone_of_voice,
    p_company_objectives,
    p_sales_manual,
    p_welcome_message_enabled,
    p_welcome_message_content,
    now()
  )
  ON CONFLICT (user_id, (COALESCE(whatsapp_config_id, '00000000-0000-0000-0000-000000000000'::uuid)))
  DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    tone_of_voice = EXCLUDED.tone_of_voice,
    company_objectives = EXCLUDED.company_objectives,
    sales_manual = EXCLUDED.sales_manual,
    welcome_message_enabled = EXCLUDED.welcome_message_enabled,
    welcome_message_content = EXCLUDED.welcome_message_content,
    updated_at = now();
END;
$;
