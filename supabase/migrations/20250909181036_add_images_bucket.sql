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

CREATE POLICY "Users can view images in own or shared list folders"
ON "storage"."objects"
AS permissive
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'::text 
  AND (
    (
      (storage.foldername(name))[1] = 'users'
      AND
      (storage.foldername(name))[2]::uuid = auth.uid()
    )
    OR
    (
      (storage.foldername(name))[1] = 'lists'
      AND 
      EXISTS (
        SELECT 1
        FROM public.list_users
        WHERE list_users.list_id = (storage.foldername(name))[2]::uuid
          AND list_users.user_id = auth.uid()
      )
    )
  )
);


CREATE POLICY "Users can insert images into own or editable list folders"
ON storage.objects
AS permissive
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (
    (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2]::uuid = auth.uid()
    )
    OR
    (
      (storage.foldername(name))[1] = 'lists'
      AND EXISTS (
        SELECT 1
        FROM public.list_users
        WHERE list_users.list_id = (storage.foldername(name))[2]::uuid
          AND list_users.user_id = auth.uid()
          AND list_users.role IN ('owner','editor')
      )
    )
  )
);


CREATE POLICY "Users can update images in own or editable list folders"
ON storage.objects
AS permissive
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2]::uuid = auth.uid()
    )
    OR
    (
      (storage.foldername(name))[1] = 'lists'
      AND EXISTS (
        SELECT 1
        FROM public.list_users
        WHERE list_users.list_id = (storage.foldername(name))[2]::uuid
          AND list_users.user_id = auth.uid()
          AND list_users.role IN ('owner','editor')
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (
    (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2]::uuid = auth.uid()
    )
    OR
    (
      (storage.foldername(name))[1] = 'lists'
      AND EXISTS (
        SELECT 1
        FROM public.list_users
        WHERE list_users.list_id = (storage.foldername(name))[2]::uuid
          AND list_users.user_id = auth.uid()
          AND list_users.role IN ('owner','editor')
      )
    )
  )
);



CREATE POLICY "Users can delete images in own or editable list folders"
ON storage.objects
AS permissive
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2]::uuid = auth.uid()
    )
    OR
    (
      (storage.foldername(name))[1] = 'lists'
      AND EXISTS (
        SELECT 1
        FROM public.list_users
        WHERE list_users.list_id = (storage.foldername(name))[2]::uuid
          AND list_users.user_id = auth.uid()
          AND list_users.role IN ('owner','editor')
      )
    )
  )
);



