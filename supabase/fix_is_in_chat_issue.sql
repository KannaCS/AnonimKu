-- Fix the is_in_chat issue that's preventing matching
-- All users are stuck with is_in_chat = true

-- 1. First, reset all users to not be in chat
UPDATE users SET is_in_chat = false WHERE is_online = true;

-- 2. Verify the fix
SELECT id, name, is_online, is_in_chat, created_at 
FROM users 
WHERE is_online = true 
ORDER BY created_at DESC;

-- 3. Now test the matching function again
-- SELECT find_match_for_user('a9f09744-9b9b-4eeb-ab6b-a92d1595f138');