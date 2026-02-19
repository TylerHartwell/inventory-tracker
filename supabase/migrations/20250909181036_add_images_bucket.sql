INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type)
VALUES (
  'images',
  'images',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif'],
  'STANDARD'
)
ON conflict (id) do UPDATE
SET file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_access_item_image_strict(
  p_item_id uuid,
  p_require_edit boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.items i
    WHERE i.id = p_item_id
      AND (
        i.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.list_users lu
          WHERE lu.list_id = i.list_id
            AND lu.user_id = auth.uid()
            AND (
              NOT p_require_edit
              OR lu.role IN ('owner','editor')
            )
        )
      )
  );
$$;

CREATE POLICY "View item images"
ON "storage"."objects"
AS permissive
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.can_access_item_image_strict(
    (storage.foldername(name))[1]::uuid,
    false
  )
);

CREATE POLICY "Upload item images"
ON storage.objects
AS permissive
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.can_access_item_image_strict(
    (storage.foldername(name))[1]::uuid,
    true
  )
);

CREATE POLICY "Update item images"
ON storage.objects
AS permissive
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.can_access_item_image_strict(
    (storage.foldername(name))[1]::uuid,
    true
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.can_access_item_image_strict(
    (storage.foldername(name))[1]::uuid,
    true
  )
);

CREATE POLICY "Users can delete images in own or editable list folders"
ON storage.objects
AS permissive
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.can_access_item_image_strict(
    (storage.foldername(name))[1]::uuid,
    true
  )
);