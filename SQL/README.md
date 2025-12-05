# YumeAI Database Schema

## Overview
This folder contains SQL migration scripts for the YumeAI mobile-first text-to-webtoon generator.

## Database Structure

### Tables

#### `user_sessions`
Stores user sessions and their input text.
- `id`: UUID primary key
- `session_id`: Unique session identifier
- `input_text`: Raw story text input
- `created_at`, `updated_at`: Timestamps

#### `story_analyses`
Stores analyzed story structure from Gemini API.
- `id`: UUID primary key
- `session_id`: Foreign key to user_sessions
- `title`: Story title
- `characters`: JSONB array of character objects
- `scenes`: JSONB array of scene objects with panels
- `created_at`: Timestamp

#### `panels`
Stores individual generated comic panels with ordering for drag-and-drop.
- `id`: UUID primary key
- `session_id`: Foreign key to user_sessions
- `analysis_id`: Foreign key to story_analyses
- `scene_index`, `panel_index`: Panel identification
- `narrative_description`: Text description of panel
- `visual_prompt`: AI image generation prompt
- `image_url`: URL of generated image
- `display_order`: Integer for manual reordering
- `created_at`, `updated_at`: Timestamps

## Setup Instructions

### 1. Run in Supabase SQL Editor
Copy and paste `001_initial_schema.sql` into your Supabase project's SQL Editor and execute.

### 2. Verify Tables
Run this query to check tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. Test Indexes
Check indexes were created:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Key Features

### Automatic Timestamps
Tables use triggers to automatically update `updated_at` columns.

### Efficient Queries
Indexes on frequently queried columns:
- `panels.session_id` + `display_order` for fast ordered retrieval
- `story_analyses.session_id` for session lookups

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate panels
- CASCADE deletes clean up related records

## Usage Example

```sql
-- Create a session
INSERT INTO user_sessions (session_id, input_text)
VALUES ('test-123', 'Kael walked into the bar...')
RETURNING id;

-- Create a panel
INSERT INTO panels (
  session_id, 
  scene_index, 
  panel_index, 
  visual_prompt, 
  display_order
)
VALUES (
  'session-uuid-here',
  1,
  1,
  'Cyberpunk bar, neon lights, rain outside',
  0
);

-- Reorder panels
UPDATE panels SET display_order = 5 WHERE id = 'panel-uuid';

-- Get all panels in order
SELECT * FROM panels 
WHERE session_id = 'session-uuid'
ORDER BY display_order;
```

## Maintenance

### Cleanup Old Sessions
```sql
-- Delete sessions older than 30 days
DELETE FROM user_sessions 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Reset Panel Order
```sql
-- Recalculate display_order for a session
WITH ordered_panels AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS new_order
  FROM panels WHERE session_id = 'session-uuid'
)
UPDATE panels p
SET display_order = op.new_order
FROM ordered_panels op
WHERE p.id = op.id;
```