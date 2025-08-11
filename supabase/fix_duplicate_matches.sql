-- Fix for duplicate matches issue in AnonimKu
-- This script will clean up existing matches and fix the matching function

-- 1. First, let's see what matches exist
SELECT m.*, m.created_at, m.status,
       u1.name as user1_name, u2.name as user2_name
FROM matches m 
JOIN users u1 ON m.user1_id = u1.id 
JOIN users u2 ON m.user2_id = u2.id 
ORDER BY m.created_at DESC;

-- 2. Clean up old/duplicate matches (run this to reset)
DELETE FROM matches;

-- 3. Reset all users to not be in chat
UPDATE users SET is_in_chat = false, is_online = false;

-- 4. Fix the matching function to handle duplicates better
CREATE OR REPLACE FUNCTION find_match_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  potential_match_id UUID;
  new_match_id UUID;
  existing_match_id UUID;
BEGIN
  -- First check if user already has an active match
  SELECT id INTO existing_match_id
  FROM matches 
  WHERE (user1_id = user_id OR user2_id = user_id) 
    AND status = 'active'
  LIMIT 1;
  
  -- If user already has a match, return it
  IF existing_match_id IS NOT NULL THEN
    RETURN existing_match_id;
  END IF;

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
    -- Create new match (handle potential duplicates)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (user_id, potential_match_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO new_match_id;
    
    -- If no ID returned due to conflict, try to get existing match
    IF new_match_id IS NULL THEN
      SELECT id INTO new_match_id
      FROM matches 
      WHERE (user1_id = user_id AND user2_id = potential_match_id)
         OR (user1_id = potential_match_id AND user2_id = user_id)
      LIMIT 1;
    END IF;

    -- Update both users to be in chat
    UPDATE users 
    SET is_in_chat = true 
    WHERE id IN (user_id, potential_match_id);

    RETURN new_match_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;