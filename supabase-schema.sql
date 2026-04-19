-- ============================================
-- AI Smart Browser - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PAGES TABLE
-- ============================================
create table if not exists public.pages (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  url         text,
  title       text not null,
  content     text not null,
  tags        text[] default '{}',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Indexes for pages
create index if not exists pages_user_id_idx on public.pages(user_id);
create index if not exists pages_created_at_idx on public.pages(created_at desc);
create index if not exists pages_tags_idx on public.pages using gin(tags);

-- Full-text search index
create index if not exists pages_search_idx on public.pages using gin(
  to_tsvector('english', title || ' ' || coalesce(url, ''))
);

-- ============================================
-- SUMMARIES TABLE
-- ============================================
create table if not exists public.summaries (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  type        text check(type in ('tldr', 'bullets', 'eli5', 'keypoints', 'questions')) not null,
  content     text not null,
  created_at  timestamptz default now() not null
);

create index if not exists summaries_page_id_idx on public.summaries(page_id);

-- ============================================
-- CHATS TABLE
-- ============================================
create table if not exists public.chats (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  message     text not null,
  role        text check(role in ('user', 'assistant')) not null,
  created_at  timestamptz default now() not null
);

create index if not exists chats_page_id_idx on public.chats(page_id);
create index if not exists chats_user_id_idx on public.chats(user_id);

-- ============================================
-- EXTRACTED DATA TABLE
-- ============================================
create table if not exists public.extracted_data (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  type        text check(type in ('emails', 'phones', 'tables', 'links')) not null,
  data        jsonb not null default '{}',
  created_at  timestamptz default now() not null
);

create index if not exists extracted_data_page_id_idx on public.extracted_data(page_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.pages enable row level security;
alter table public.summaries enable row level security;
alter table public.chats enable row level security;
alter table public.extracted_data enable row level security;

-- PAGES policies
create policy "Users can view their own pages"
  on public.pages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own pages"
  on public.pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pages"
  on public.pages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own pages"
  on public.pages for delete
  using (auth.uid() = user_id);

-- SUMMARIES policies (inherit from pages)
create policy "Users can view summaries of their pages"
  on public.summaries for select
  using (
    exists (
      select 1 from public.pages
      where pages.id = summaries.page_id
      and pages.user_id = auth.uid()
    )
  );

create policy "Users can insert summaries for their pages"
  on public.summaries for insert
  with check (
    exists (
      select 1 from public.pages
      where pages.id = page_id
      and pages.user_id = auth.uid()
    )
  );

-- CHATS policies
create policy "Users can view their own chats"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

-- EXTRACTED DATA policies
create policy "Users can view extracted data of their pages"
  on public.extracted_data for select
  using (
    exists (
      select 1 from public.pages
      where pages.id = extracted_data.page_id
      and pages.user_id = auth.uid()
    )
  );

create policy "Users can insert extracted data for their pages"
  on public.extracted_data for insert
  with check (
    exists (
      select 1 from public.pages
      where pages.id = page_id
      and pages.user_id = auth.uid()
    )
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_pages_updated_at
  before update on public.pages
  for each row execute function update_updated_at_column();

-- ============================================
-- DONE! Your schema is ready.
-- ============================================
