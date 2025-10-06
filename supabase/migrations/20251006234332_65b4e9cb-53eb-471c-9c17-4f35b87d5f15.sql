DO $$
BEGIN
  -- Ensure REPLICA IDENTITY FULL for realtime payloads
  BEGIN
    ALTER TABLE public.services REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    -- ignore if already set or table missing
    NULL;
  END;

  -- Ensure table is in the supabase_realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  EXCEPTION WHEN others THEN
    -- ignore if already added
    NULL;
  END;
END
$$;