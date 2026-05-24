-- Fix admin_users deletion by updating foreign key constraints
-- This prevents the 409 Conflict error when deleting a chair who has associated records

-- 1. Update committee_sessions constraint
ALTER TABLE committee_sessions 
DROP CONSTRAINT IF EXISTS committee_sessions_created_by_fkey;

ALTER TABLE committee_sessions 
ADD CONSTRAINT committee_sessions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- 2. Update applications constraint
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_reviewed_by_fkey;

ALTER TABLE applications 
ADD CONSTRAINT applications_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- 3. Update contact_messages constraint
ALTER TABLE contact_messages 
DROP CONSTRAINT IF EXISTS contact_messages_responded_by_fkey;

ALTER TABLE contact_messages 
ADD CONSTRAINT contact_messages_responded_by_fkey 
FOREIGN KEY (responded_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- 4. Update resources constraint
ALTER TABLE resources 
DROP CONSTRAINT IF EXISTS resources_uploaded_by_fkey;

ALTER TABLE resources 
ADD CONSTRAINT resources_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- 5. Update announcements constraint
ALTER TABLE announcements 
DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE announcements 
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;
