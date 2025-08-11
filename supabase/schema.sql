-- AnonimKu Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  is_in_chat BOOLEAN DEFAULT false,
  profile_revealed_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  both_profiles_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reveal requests table
CREATE TABLE reveal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(match_id, requester_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_online ON users(is_online);
CREATE INDEX idx_users_is_in_chat ON users(is_in_chat);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reveal_requests_match_id ON reveal_requests(match_id);
CREATE INDEX idx_reveal_requests_status ON reveal_requests(status);

-- Functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update users.updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to find and create matches
CREATE OR REPLACE FUNCTION find_match_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  potential_match_id UUID;
  new_match_id UUID;
BEGIN
  -- Find a user who is online, not in chat, and not the current user
  SELECT id INTO potential_match_id
  FROM users 
  WHERE id != user_id 
    AND is_online = true 
    AND is_in_chat = false
    AND id NOT IN (
      -- Exclude users who already have active matches
      SELECT user1_id FROM matches WHERE status = 'active'
      UNION
      SELECT user2_id FROM matches WHERE status = 'active'
    )
  ORDER BY RANDOM()
  LIMIT 1;

  IF potential_match_id IS NOT NULL THEN
    -- Create new match
    INSERT INTO matches (user1_id, user2_id)
    VALUES (user_id, potential_match_id)
    RETURNING id INTO new_match_id;

    -- Update both users to be in chat
    UPDATE users 
    SET is_in_chat = true 
    WHERE id IN (user_id, potential_match_id);

    RETURN new_match_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to end a match
CREATE OR REPLACE FUNCTION end_match(match_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update match status
  UPDATE matches 
  SET status = 'ended', ended_at = NOW() 
  WHERE id = match_id;

  -- Update users to not be in chat
  UPDATE users 
  SET is_in_chat = false 
  WHERE id IN (
    SELECT user1_id FROM matches WHERE id = match_id
    UNION
    SELECT user2_id FROM matches WHERE id = match_id
  );
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveal_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can see matches they're part of
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can view messages in their matches
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Users can insert messages in their matches
CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      AND matches.status = 'active'
    )
  );

-- Users can view reveal requests in their matches
CREATE POLICY "Users can view reveal requests in their matches" ON reveal_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = target_id
  );

-- Users can create reveal requests
CREATE POLICY "Users can create reveal requests" ON reveal_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update reveal requests they received
CREATE POLICY "Users can respond to reveal requests" ON reveal_requests
  FOR UPDATE USING (auth.uid() = target_id);