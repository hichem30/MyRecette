-- =====================================================================
-- Storage bucket for product / category / bundle images
-- =====================================================================
-- Public-read so storefront pages can render with no auth (catalog is
-- public). Admin-only writes are enforced through the bucket policies
-- below. Resolution + compression are enforced client-side at upload
-- (see src/lib/image/resize.ts) so the bucket only ever stores small
-- WebP files (~50-200 KB each).
--
-- Idempotent: safe to re-run.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  524288,    -- 512 KB hard cap (resize.ts targets ~200 KB)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read: anyone (public catalog).
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select
  using (bucket_id = 'product-images');

-- Insert / update / delete: admins only.
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );
