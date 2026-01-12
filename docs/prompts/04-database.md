# Database Setup (Supabase)

> **Role Context:** You are designing a scalable database schema. Focus on efficient queries, data integrity, and anti-cheat considerations.

## Overview

Using Supabase (PostgreSQL) to store:
- Player profiles
- Player statistics  
- Match history
- Leaderboard data

Free tier includes: 500MB storage, unlimited API requests.

## Additional Features to Implement

| Feature | Implementation |
|---------|----------------|
| **Pagination** | Use `.range(0, 49)` for leaderboard pages (50 per page) |
| **Profanity Filter** | Check usernames against blocklist before insert |
| **Rate Limiting** | Limit API calls per player (e.g., 60/minute) |
| **Anti-Cheat** | Server validates all score submissions, flag suspicious stats |
| **Friends Leaderboard** | Future: friends table with mutual follow system |

---

## Setup Steps

1. Go to https://supabase.com and create a free account
2. Create a new project (choose region closest to your users)
3. Wait for database to provision (~2 minutes)
4. Go to SQL Editor and run the schema below
5. Get your API credentials from Settings → API

---

## Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- TABLES
-- ============================================

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Username limited to 20 characters (character count, not bytes)
  -- Allows Unicode characters including emoji
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) <= 20 AND char_length(username) >= 3),
  display_name VARCHAR(50),
  avatar_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics
CREATE TABLE player_stats (
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
CREATE TABLE matches (
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
CREATE VIEW leaderboard AS
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
-- IMPORTANT: These policies prevent direct client writes using the anon key.
-- Only the backend server with the service_role key can write to these tables.
-- This prevents leaderboard manipulation and match history corruption.

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view leaderboards)
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);

-- Backend write access (restricted to service role only)
-- This prevents clients with the anon key from directly writing to these tables
CREATE POLICY "Service insert players" ON players 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service insert player_stats" ON player_stats 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service insert matches" ON matches 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update player_stats" ON player_stats 
  FOR UPDATE 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update players" ON players 
  FOR UPDATE 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_player_stats_elo ON player_stats(elo_rating DESC);
CREATE INDEX idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_players_username ON players(username);
```

---

## API Credentials

After running the schema, get these from **Settings → API**:

| Credential | Where to Use | Security |
|------------|--------------|----------|
| `Project URL` | Frontend + Backend | Public |
| `anon/public key` | Frontend only | Public (read-only) |
| `service_role key` | Backend only | **SECRET** - never expose! |

---

## Common Queries

### Get Leaderboard (Top 100)
```javascript
const { data, error } = await supabase
  .from('leaderboard')
  .select('*')
  .limit(100);
```

### Get Player by Username
```javascript
const { data, error } = await supabase
  .from('players')
  .select('*, player_stats(*)')
  .eq('username', username)
  .single();
```

### Create New Player
```javascript
// 1. Create player
const { data: player, error } = await supabase
  .from('players')
  .insert({ username, display_name: username })
  .select()
  .single();

// 2. Create initial stats
await supabase
  .from('player_stats')
  .insert({ player_id: player.id });
```

### Record Match Result
```javascript
await supabase.from('matches').insert({
  player1_id: player1.id,
  player2_id: player2.id,
  player1_score: 11,
  player2_score: 7,
  winner_id: player1.id,
  game_mode: 'classic',
  duration_seconds: 180,
  longest_rally: 15
});
```

### Update Player Stats After Match
```javascript
// For winner
await supabase
  .from('player_stats')
  .update({
    games_played: stats.games_played + 1,
    games_won: stats.games_won + 1,
    total_points_scored: stats.total_points_scored + winnerScore,
    total_points_conceded: stats.total_points_conceded + loserScore,
    current_win_streak: stats.current_win_streak + 1,
    best_win_streak: Math.max(stats.best_win_streak, stats.current_win_streak + 1),
    elo_rating: stats.elo_rating + eloGain,
    updated_at: new Date().toISOString()
  })
  .eq('player_id', winner.id);

// For loser
await supabase
  .from('player_stats')
  .update({
    games_played: stats.games_played + 1,
    games_lost: stats.games_lost + 1,
    total_points_scored: stats.total_points_scored + loserScore,
    total_points_conceded: stats.total_points_conceded + winnerScore,
    current_win_streak: 0,
    elo_rating: Math.max(100, stats.elo_rating - eloLoss), // Minimum 100
    updated_at: new Date().toISOString()
  })
  .eq('player_id', loser.id);
```

### Get Weekly Leaderboard
```javascript
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const { data, error } = await supabase
  .from('matches')
  .select('winner_id')
  .gte('played_at', oneWeekAgo.toISOString());

// Then aggregate wins per player
```

---

## ELO Rating System

Standard ELO calculation for competitive ranking:

```javascript
function calculateEloChange(winnerRating, loserRating) {
  const K = 32; // K-factor (higher = more volatile ratings)
  
  // Expected score (probability of winning)
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  
  // Rating changes
  // Winner gains K * (actual - expected) = K * (1 - expectedWinner)
  // Loser loses K * (expected - actual) = K * expectedWinner
  const winnerGain = Math.round(K * (1 - expectedWinner));
  const loserLoss = Math.round(K * expectedWinner);
  
  return { winnerGain, loserLoss };
}

// Example:
// Player A (1200) beats Player B (1000)
// expectedA = 0.76, winnerGain = 8
// expectedB = 0.24, loserLoss = 8

// Player A (1000) beats Player B (1200) - upset!
// expectedA = 0.24, winnerGain = 24
// expectedB = 0.76, loserLoss = 24
```

---

## Frontend Read-Only Access

The frontend can query leaderboards directly using the anon key:

```javascript
// js/leaderboard.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(100);
  
  return data;
}

async function getPlayerStats(username) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('username', username)
    .single();
  
  return data;
}
```

**Note**: All write operations (creating players, recording matches) should go through the backend server using the service key.

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What are the three main database tables?
2. What is the default ELO rating for new players?
3. Which Supabase key is safe to use in frontend code?
4. What does the K-factor (K=32) control in ELO calculation?

**Response Format:**
```
04-database.md verified ✓
Answers: [Tables: ___, ___, ___] | [Default ELO: ___] | [Safe frontend key: ___] | [K-factor controls: ___]
```
