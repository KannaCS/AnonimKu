-- Debug queries to check matching system status
-- Run these queries in Supabase SQL Editor to debug the matching issue

-- 1. Check if users are properly set as online
SELECT id, name, phone, is_online, is_in_chat, created_at 
FROM auth.users 
JOIN public.users ON auth.users.id = public.users.id
ORDER BY created_at DESC;

-- 2. Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Check if there are any active matches blocking new ones
SELECT m.*, u1.name as user1_name, u2.name as user2_name 
FROM matches m 
JOIN users u1 ON m.user1_id = u1.id 
JOIN users u2 ON m.user2_id = u2.id 
WHERE m.status = 'active';

-- 4. Test the matching function directly (replace with actual user ID)
-- SELECT find_match_for_user('YOUR_USER_ID_HERE');

-- 5. Check if users can see each other (test RLS policy)
-- This should show users that are online and not in chat (excluding yourself)
SELECT id, name, is_online, is_in_chat 
FROM users 
WHERE is_online = true AND is_in_chat = false;