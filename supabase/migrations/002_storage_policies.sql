-- Run this in the Supabase SQL editor AFTER 001_initial_schema.sql
-- Creates the contracts storage bucket and access policies

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "Users can upload own contracts"
on storage.objects for insert
with check (
  bucket_id = 'contracts' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

create policy "Users can read own contracts"
on storage.objects for select
using (
  bucket_id = 'contracts' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

create policy "Users can delete own contracts"
on storage.objects for delete
using (
  bucket_id = 'contracts' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);
