-- Create rate_limits table to track daily summary generation
create table if not exists public.rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  summaries_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one record per user per day
  unique(user_id, date)
);

-- Enable RLS
alter table public.rate_limits enable row level security;

-- Users can only view their own rate limits
create policy "Users can view their own rate limits"
  on public.rate_limits for select
  using (auth.uid() = user_id);

-- Users can insert their own rate limits
create policy "Users can insert their own rate limits"
  on public.rate_limits for insert
  with check (auth.uid() = user_id);

-- Users can update their own rate limits
create policy "Users can update their own rate limits"
  on public.rate_limits for update
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists rate_limits_user_id_date_idx
  on public.rate_limits(user_id, date);

-- Add updated_at trigger
create or replace function public.handle_rate_limits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rate_limits_updated_at
  before update on public.rate_limits
  for each row
  execute procedure public.handle_rate_limits_updated_at();
