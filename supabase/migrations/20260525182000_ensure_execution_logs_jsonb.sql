-- Ensure execution_logs exists and details is JSONB
CREATE TABLE IF NOT EXISTS public.execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure details is JSONB in case it was created as JSON or TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'execution_logs' 
          AND column_name = 'details' 
          AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE public.execution_logs 
        ALTER COLUMN details TYPE JSONB USING details::JSONB;
    END IF;
END $$;

-- Ensure RLS is enabled and policies exist
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own execution_logs" ON public.execution_logs;
CREATE POLICY "Users can manage own execution_logs" ON public.execution_logs
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS execution_logs_created_at_idx ON public.execution_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS execution_logs_user_id_idx ON public.execution_logs USING btree (user_id);
