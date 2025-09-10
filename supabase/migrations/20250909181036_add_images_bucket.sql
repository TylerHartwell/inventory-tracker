insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type)
values (
  'images',
  'images',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif'],
  'STANDARD'
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Give users access to own folder 1ffg0oo_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1ffg0oo_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1ffg0oo_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1ffg0oo_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



