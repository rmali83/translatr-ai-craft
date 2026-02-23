-- Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_roles');

-- Check users table structure
\d users;

-- Check user_roles table structure  
\d user_roles;

-- Check current users and roles
SELECT u.email, ur.role, ur.project_id
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;