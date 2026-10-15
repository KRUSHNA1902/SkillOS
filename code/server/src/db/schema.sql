-- ================================================================================
-- SKILLOS DATABASE MIGRATION: WORKFLOW TASKS
-- Table: public.skillos_tasks
-- Engine: PostgreSQL on Supabase with Row Level Security (RLS)
-- ================================================================================

CREATE TABLE IF NOT EXISTS public.skillos_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'pending', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'General',
  due_date TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  timeline_stage TEXT NOT NULL DEFAULT 'in_progress' CHECK (timeline_stage IN ('backlog', 'planning', 'in_progress', 'review', 'completed')),
  notes TEXT DEFAULT '',
  reminder_alert BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.skillos_tasks ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if re-running
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.skillos_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.skillos_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.skillos_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.skillos_tasks;

-- RLS Policies ensuring strict tenant data isolation
CREATE POLICY "Users can view their own tasks"
  ON public.skillos_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.skillos_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.skillos_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.skillos_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_skillos_tasks_user_id ON public.skillos_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_skillos_tasks_deadline ON public.skillos_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_skillos_tasks_status ON public.skillos_tasks(status);

-- ================================================================================
-- SKILLOS DATABASE MIGRATION: CROSS-ENTITY TAGS
-- Table: public.skillos_tags
-- Engine: PostgreSQL on Supabase with Row Level Security (RLS)
-- ================================================================================

CREATE TABLE IF NOT EXISTS public.skillos_tags (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.skillos_tags ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if re-running
DROP POLICY IF EXISTS "Users can view their own tags" ON public.skillos_tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.skillos_tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.skillos_tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.skillos_tags;

-- RLS Policies ensuring strict tenant data isolation
CREATE POLICY "Users can view their own tags"
  ON public.skillos_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON public.skillos_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.skillos_tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.skillos_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_skillos_tags_user_id ON public.skillos_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_skillos_tags_name ON public.skillos_tags(name);

