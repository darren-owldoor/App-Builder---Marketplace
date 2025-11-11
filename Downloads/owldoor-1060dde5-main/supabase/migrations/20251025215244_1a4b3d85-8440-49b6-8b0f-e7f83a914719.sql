-- Grant admin role to Darren@OwlDoor.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'darren@owldoor.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add staff role as well for Darren
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'staff'::app_role
FROM auth.users
WHERE email = 'darren@owldoor.com'
ON CONFLICT (user_id, role) DO NOTHING;