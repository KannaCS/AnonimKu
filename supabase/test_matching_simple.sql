-- Temporary fix to test matching without RLS restrictions
-- ONLY for testing - run this to debug the matching issue

-- 1. Temporarily disable RLS on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Check current user status
SELECT id, name, phone, is_online, is_in_chat, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Manually set users to be online and available (if needed)
-- Replace with your actual user IDs from step 2
-- UPDATE users SET is_online = true, is_in_chat = false WHERE id = 'USER_ID_1';
-- UPDATE users SET is_online = true, is_in_chat = false WHERE id = 'USER_ID_2';

-- 4. Test matching function directly
-- Replace 'USER_ID_HERE' with one of your user IDs from step 2
-- SELECT find_match_for_user('USER_ID_HERE');

-- 5. Check if there are blocking matches
SELECT * FROM matches WHERE status = 'active';

-- 6. Clean up any stale matches (if needed)
-- UPDATE matches SET status = 'ended', ended_at = NOW() WHERE status = 'active';
-- UPDATE users SET is_in_chat = false WHERE is_in_chat = true;

-- 7. Re-enable RLS after testing (IMPORTANT!)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;