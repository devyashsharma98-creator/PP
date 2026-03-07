-- Private-by-default storage buckets and policies

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('event-media', 'event-media', false, 52428800),
  ('article-media', 'article-media', false, 52428800),
  ('documents', 'documents', false, 104857600),
  ('avatars', 'avatars', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists p_storage_authenticated_read on storage.objects;
create policy p_storage_authenticated_read
on storage.objects
for select to authenticated
using (
  bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
  and (
    public.is_manager()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists p_storage_authenticated_insert on storage.objects;
create policy p_storage_authenticated_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
  and (
    public.is_manager()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists p_storage_authenticated_update on storage.objects;
create policy p_storage_authenticated_update
on storage.objects
for update to authenticated
using (
  bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
  and (
    public.is_manager()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
  and (
    public.is_manager()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists p_storage_authenticated_delete on storage.objects;
create policy p_storage_authenticated_delete
on storage.objects
for delete to authenticated
using (
  bucket_id in ('event-media', 'article-media', 'documents', 'avatars')
  and (
    public.is_manager()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
