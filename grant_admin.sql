-- Grant admin permissions
-- Replace 'your-email@example.com' with your actual email address

INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Check if it worked
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';