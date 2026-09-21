-- 0014_specialist_rag_knowledge_base.sql
-- Vector Embeddings & Supabase RAG Knowledge Base for Specialist AI Assistant
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Enable pgvector Extension
-- ============================================================

create extension if not exists vector;

-- ============================================================
-- 2. Specialist Knowledge Base Table
-- ============================================================

create table if not exists public.specialist_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null unique,
  content text not null,
  keywords text[] not null default '{}'::text[],
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. HNSW Vector Cosine Index for Rapid Sub-millisecond Lookup
-- ============================================================

create index if not exists specialist_knowledge_base_embedding_idx 
  on public.specialist_knowledge_base 
  using hnsw (embedding vector_cosine_ops);

create index if not exists specialist_knowledge_base_category_idx 
  on public.specialist_knowledge_base (category);

-- ============================================================
-- 4. RLS Security Policies
-- ============================================================

alter table public.specialist_knowledge_base enable row level security;

-- Authenticated users (Specialists & Admins) can read knowledge base articles
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'specialist_knowledge_base' 
      and policyname = 'specialist_knowledge_base_select_all'
  ) then
    create policy specialist_knowledge_base_select_all
      on public.specialist_knowledge_base
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Service role / Admin write policy
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'specialist_knowledge_base' 
      and policyname = 'specialist_knowledge_base_admin_write'
  ) then
    create policy specialist_knowledge_base_admin_write
      on public.specialist_knowledge_base
      for all
      to authenticated
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      );
  end if;
end $$;

-- ============================================================
-- 5. Match Knowledge Base Vector Search Function (RPC)
-- ============================================================

create or replace function public.match_knowledge_base (
  query_embedding vector(1536),
  match_threshold float default 0.35,
  match_count int default 4
)
returns table (
  id uuid,
  category text,
  question text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    category,
    question,
    content,
    1 - (public.specialist_knowledge_base.embedding <=> query_embedding) as similarity
  from public.specialist_knowledge_base
  where public.specialist_knowledge_base.embedding is not null
    and 1 - (public.specialist_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by public.specialist_knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
