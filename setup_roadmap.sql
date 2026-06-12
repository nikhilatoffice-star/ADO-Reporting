-- Run this script in your Supabase SQL Editor to create the Roadmap table

CREATE TABLE IF NOT EXISTS roadmap_items (
  id text PRIMARY KEY,
  title text NOT NULL,
  type text,
  state text,
  team text,
  start_sprint text,
  end_sprint text,
  progress numeric
);

-- Enable Row Level Security (optional but recommended in production)
-- ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON roadmap_items FOR ALL USING (true);
