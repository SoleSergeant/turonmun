-- Function to search users across both auth.users and applications tables
-- This allows admins to find users who signed up but never submitted an application
CREATE OR REPLACE FUNCTION search_users_for_admin(search_query TEXT)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, source TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Search applications first
  SELECT
    a.id::UUID,
    a.full_name::TEXT,
    a.email::TEXT,
    'application'::TEXT as source
  FROM applications a
  WHERE a.full_name ILIKE '%' || search_query || '%'
     OR a.email ILIKE '%' || search_query || '%'

  UNION

  -- Then search auth.users for those NOT in applications
  SELECT
    au.id::UUID,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))::TEXT as full_name,
    au.email::TEXT,
    'auth'::TEXT as source
  FROM auth.users au
  WHERE (au.email ILIKE '%' || search_query || '%'
     OR au.raw_user_meta_data->>'full_name' ILIKE '%' || search_query || '%')
    AND NOT EXISTS (
      SELECT 1 FROM applications app WHERE app.email = au.email
    )

  ORDER BY full_name
  LIMIT 10;
END;
$$;
