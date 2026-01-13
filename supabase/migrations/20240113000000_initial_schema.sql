-- Pong7 Database Schema
-- Run this in Supabase SQL Editor or via CLI: supabase db push
-- Migration: 20240113_initial_schema

-- ============================================
-- TABLES
-- ============================================

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_-]{3,20}$'),
  display_name VARCHAR(50),
  avatar_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics
CREATE TABLE IF NOT EXISTS player_stats (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE PRIMARY KEY,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  total_points_scored INTEGER DEFAULT 0,
  total_points_conceded INTEGER DEFAULT 0,
  longest_rally INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match history
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player1_score INTEGER NOT NULL,
  player2_score INTEGER NOT NULL,
  winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  game_mode VARCHAR(20) NOT NULL,
  duration_seconds INTEGER,
  longest_rally INTEGER,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEWS
-- ============================================

-- Leaderboard view (auto-calculated rankings)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_id,
  s.elo_rating,
  s.games_played,
  s.games_won,
  s.games_lost,
  CASE WHEN s.games_played > 0 
    THEN ROUND((s.games_won::DECIMAL / s.games_played) * 100, 1) 
    ELSE 0 
  END as win_percentage,
  s.best_win_streak,
  s.longest_rally
FROM players p
JOIN player_stats s ON p.id = s.player_id
WHERE s.games_played >= 1
ORDER BY s.elo_rating DESC;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view leaderboards)
DROP POLICY IF EXISTS "Public read access" ON players;
DROP POLICY IF EXISTS "Public read access" ON player_stats;
DROP POLICY IF EXISTS "Public read access" ON matches;

CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);

-- Backend write access (restricted to service role only)
DROP POLICY IF EXISTS "Service insert players" ON players;
DROP POLICY IF EXISTS "Service insert player_stats" ON player_stats;
DROP POLICY IF EXISTS "Service insert matches" ON matches;
DROP POLICY IF EXISTS "Service update player_stats" ON player_stats;
DROP POLICY IF EXISTS "Service update players" ON players;

CREATE POLICY "Service insert players" ON players 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service insert player_stats" ON player_stats 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service insert matches" ON matches 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update player_stats" ON player_stats 
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update players" ON players 
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Deny deletes
DROP POLICY IF EXISTS "No deletes players" ON players;
DROP POLICY IF EXISTS "No deletes player_stats" ON player_stats;
DROP POLICY IF EXISTS "No deletes matches" ON matches;

CREATE POLICY "No deletes players" ON players FOR DELETE USING (false);
CREATE POLICY "No deletes player_stats" ON player_stats FOR DELETE USING (false);
CREATE POLICY "No deletes matches" ON matches FOR DELETE USING (false);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_stats_elo ON player_stats(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
