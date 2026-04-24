-- Tighten shared-list item access so former members lose access immediately.
-- Personal items (list_id IS NULL) remain accessible only to their owner.

-- ============================================
-- Items
-- ============================================

DROP POLICY IF EXISTS "Users can view items" ON public.items;
DROP POLICY IF EXISTS "Users can update items" ON public.items;
DROP POLICY IF EXISTS "Users can delete items" ON public.items;

CREATE POLICY "Users can view items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (
    (
      items.list_id IS NULL
      AND items.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.list_users lu
      WHERE lu.list_id = items.list_id
        AND lu.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (
    (
      items.list_id IS NULL
      AND items.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.list_users lu
      WHERE lu.list_id = items.list_id
        AND lu.user_id = (select auth.uid())
        AND lu.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    (
      items.list_id IS NULL
      AND items.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.list_users lu
      WHERE lu.list_id = items.list_id
        AND lu.user_id = (select auth.uid())
        AND lu.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    (
      items.list_id IS NULL
      AND items.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.list_users lu
      WHERE lu.list_id = items.list_id
        AND lu.user_id = (select auth.uid())
        AND lu.role IN ('owner', 'editor')
    )
  );

-- ============================================
-- Item Images
-- ============================================

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
          (
            i.list_id IS NULL
            AND i.user_id = (select auth.uid())
          )
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
          (
            i.list_id IS NULL
            AND i.user_id = (select auth.uid())
          )
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
          (
            i.list_id IS NULL
            AND i.user_id = (select auth.uid())
          )
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
          (
            i.list_id IS NULL
            AND i.user_id = (select auth.uid())
          )
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
          (
            i.list_id IS NULL
            AND i.user_id = (select auth.uid())
          )
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