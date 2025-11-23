-- Create storage bucket for papers
insert into storage.buckets (id, name, public)
values ('papers', 'papers', false);

-- Storage policies for papers bucket
create policy "Users can upload their own papers"
  on storage.objects for insert
  with check (
    bucket_id = 'papers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own papers"
  on storage.objects for select
  using (
    bucket_id = 'papers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own papers"
  on storage.objects for update
  using (
    bucket_id = 'papers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own papers"
  on storage.objects for delete
  using (
    bucket_id = 'papers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
