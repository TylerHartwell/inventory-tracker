ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.items
SET
  last_updated_by = COALESCE(last_updated_by, user_id),
  last_updated_at = COALESCE(last_updated_at, created_at)
WHERE last_updated_by IS NULL OR last_updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_items_last_updated_by
  ON public.items(last_updated_by);

CREATE OR REPLACE FUNCTION public.tf_items_set_last_updated_meta()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.last_updated_by := auth.uid();
  NEW.last_updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_items_set_last_updated_meta ON public.items;

CREATE TRIGGER tr_items_set_last_updated_meta
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.tf_items_set_last_updated_meta();
