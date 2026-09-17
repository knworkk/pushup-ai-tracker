-- ==========================================================
-- PushUp AI Database Schema for Supabase
-- Copy and paste this into Supabase SQL Editor and click RUN
-- ==========================================================

-- 1. Create Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  athlete_name TEXT NOT NULL DEFAULT 'Anonymous Athlete',
  athlete_avatar TEXT NOT NULL DEFAULT '🏆',
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time BIGINT,
  end_time BIGINT,
  total_reps INTEGER NOT NULL DEFAULT 0,
  valid_reps INTEGER NOT NULL DEFAULT 0,
  avg_form_score INTEGER NOT NULL DEFAULT 0,
  duration_sec NUMERIC NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'standard',
  pushup_style TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Index for Fast Leaderboard Queries by Date
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_workouts_reps ON workouts(valid_reps DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- 4. Allow Public Read and Insert Policies (Anonymous allowed for demo & simple friend use)
CREATE POLICY "Allow public read on workouts"
  ON workouts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on workouts"
  ON workouts FOR INSERT
  WITH CHECK (true);

-- 5. Enable Realtime on workouts table so leaderboards update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
