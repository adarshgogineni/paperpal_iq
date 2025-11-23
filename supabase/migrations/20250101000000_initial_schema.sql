-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create documents table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'error')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create summaries table
create table public.summaries (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  audience text not null check (audience in ('elementary', 'high_school', 'undergraduate', 'graduate', 'expert')),
  summary_text text not null,
  tokens_used integer,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.documents enable row level security;
alter table public.summaries enable row level security;

-- RLS Policies for documents table
create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- RLS Policies for summaries table
create policy "Users can view summaries of their own documents"
  on public.summaries for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = summaries.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert summaries for their own documents"
  on public.summaries for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = summaries.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can delete summaries of their own documents"
  on public.summaries for delete
  using (
    exists (
      select 1 from public.documents
      where documents.id = summaries.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index documents_user_id_idx on public.documents(user_id);
create index documents_created_at_idx on public.documents(created_at desc);
create index summaries_document_id_idx on public.summaries(document_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for documents table
create trigger on_documents_updated
  before update on public.documents
  for each row
  execute procedure public.handle_updated_at();
