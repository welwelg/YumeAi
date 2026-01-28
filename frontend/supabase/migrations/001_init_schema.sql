Step 4: Update SQL Schema
The ID field needs to be text for upsert to work. Update your database:
sql-- Drop and recreate user_sessions with text ID
DROP TABLE IF EXISTS panels CASCADE;
DROP TABLE IF EXISTS story_analyses CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Recreate with proper structure
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  input_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE story_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
  title TEXT,
  characters JSONB,
  scenes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES story_analyses(id) ON DELETE CASCADE,
  scene_index INTEGER NOT NULL,
  panel_index INTEGER NOT NULL,
  narrative_description TEXT,
  visual_prompt TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for development
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE panels DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_panels_session_order ON panels(session_id, display_order);
CREATE INDEX idx_panels_analysis ON panels(analysis_id);
CREATE INDEX idx_story_analyses_session ON story_analyses(