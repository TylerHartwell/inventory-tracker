CREATE TABLE IF NOT EXISTS public.item_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON public.item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_item_id_display_order_created_at ON public.item_images(item_id, display_order, created_at);

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.item_images;

CREATE POLICY "Users can view item images rows"
  ON public.item_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = item_images.item_id
        AND (
          i.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can create item images rows"
  ON public.item_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = item_images.item_id
        AND (
          i.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = auth.uid()
              AND lu.role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "Users can update item images rows"
  ON public.item_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = item_images.item_id
        AND (
          i.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = auth.uid()
              AND lu.role IN ('owner', 'editor')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = item_images.item_id
        AND (
          i.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = auth.uid()
              AND lu.role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "Users can delete item images rows"
  ON public.item_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = item_images.item_id
        AND (
          i.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = auth.uid()
              AND lu.role IN ('owner', 'editor')
          )
        )
    )
  );

INSERT INTO public.item_images (item_id, image_url, display_order)
SELECT i.id, i.image_url, 0
FROM public.items i
WHERE i.image_url IS NOT NULL
ON CONFLICT (item_id, image_url) DO NOTHING;
