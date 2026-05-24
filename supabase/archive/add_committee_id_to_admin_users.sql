-- Add committee_id column to admin_users table
-- This allows chairs to be assigned to specific committees

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_committee_id ON admin_users(committee_id);

-- Update existing chairs with their committee assignments based on committees table
-- This matches chairs by name (fragile but works with current data)
UPDATE admin_users au
SET committee_id = c.id
FROM committees c
WHERE au.role IN ('chair', 'co-chair')
  AND (c.chair = au.full_name OR c.co_chair = au.full_name)
  AND au.committee_id IS NULL;
