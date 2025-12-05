--panels table
create table if not exists public.panels (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.user_sessions(id) on delete cascade,
  analysis_id uuid references public.story_analyses(id) on delete cascade,
  scene_index int,
  panel_index int,
  narrative_description text,
  visual_prompt text,
  image_url text,
  display_order int,
  created_at timestamptz default now()
); 

--User_sessions table
create table if not exists public.user_sessions (
  id uuid default gen_random_uuid() primary key,
  session_id text unique,
  input_text text,
  created_at timestamptz default now()
);

--story_analyses table
create table if not exists public.story_analyses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.user_sessions(id) on delete cascade,
  title text,
  characters jsonb,
  scenes jsonb,
  created_at timestamptz default now()
);
