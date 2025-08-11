-- Fix for AnonimKu matching system
-- Run this in your Supabase SQL editor to fix the matching issue

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new policies that allow matching to work
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view others for matching" ON users
  FOR SELECT USING (
    auth.uid() != id AND 
    is_online = true AND 
    is_in_chat = false
  );

-- Update the matching function to run with elevated privileges
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing match creation policy if it exists
DROP POLICY IF EXISTS "Users can create matches" ON matches;

-- Create policy to allow match creation
CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);