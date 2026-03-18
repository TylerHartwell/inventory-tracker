-- Fix RLS performance issue on item_images table
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

DROP POLICY IF EXISTS "Users can view item images rows" ON public.item_images;
DROP POLICY IF EXISTS "Users can create item images rows" ON public.item_images;
DROP POLICY IF EXISTS "Users can update item images rows" ON public.item_images;
DROP POLICY IF EXISTS "Users can delete item images rows" ON public.item_images;

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
          i.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = (select auth.uid())
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
          i.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = (select auth.uid())
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
          i.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = (select auth.uid())
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
          i.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = (select auth.uid())
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
          i.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.list_users lu
            WHERE lu.list_id = i.list_id
              AND lu.user_id = (select auth.uid())
              AND lu.role IN ('owner', 'editor')
          )
        )
    )
  );
