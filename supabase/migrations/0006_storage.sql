-- ============================================================================
-- 0006 · Almacenamiento (fotos de memorias, planos, logos)
--
-- Convencion de rutas: <uid>/<proyecto_id>/<archivo>  y  <uid>/logo.<ext>
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documentos', 'documentos', false, 20971520,
   array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('logos', 'logos', true, 2097152,
   array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Cada usuario solo toca su primera carpeta (su uid).
create policy documentos_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documentos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documentos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_leer on storage.objects for select to public
  using (bucket_id = 'logos');

create policy logos_escribir on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
