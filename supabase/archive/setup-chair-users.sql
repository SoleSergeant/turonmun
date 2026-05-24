-- =============================================
-- SETUP CHAIR USERS AND ASSIGNMENTS
-- =============================================
-- This script creates chair users and assigns them to committees

-- First, create chair users in admin_users table
-- You can add as many chair users as needed

-- Example: Create chair users (passwords are hashed with bcrypt)
-- To generate new password hashes, use: https://bcrypt-generator.com/

INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
-- Chair users for each committee
('chair.ecosoc@turonmun.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'Dr. Sarah Mitchell', 'chair'),
('chair.unhrc@turonmun.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'Prof. James Chen', 'chair'),
('chair.wto@turonmun.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'Dr. Maria Rodriguez', 'chair'),
('chair.unga@turonmun.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'Amb. John Smith', 'chair')
ON CONFLICT (email) DO NOTHING;

-- Assign chairs to committees
-- This creates the relationship between admin users and committees

INSERT INTO chair_assignments (admin_user_id, committee_id, role, assigned_by)
SELECT 
    au.id,
    c.id,
    'chair',
    (SELECT id FROM admin_users WHERE email = 'admin@turonmun.com' LIMIT 1)
FROM admin_users au
CROSS JOIN committees c
WHERE (
    (au.email = 'chair.ecosoc@turonmun.com' AND c.abbreviation = 'ECOSOC') OR
    (au.email = 'chair.unhrc@turonmun.com' AND c.abbreviation = 'HRC') OR
    (au.email = 'chair.wto@turonmun.com' AND c.abbreviation = 'WTO') OR
    (au.email = 'chair.unga@turonmun.com' AND c.abbreviation = 'UNGA')
)
ON CONFLICT (admin_user_id, committee_id) DO NOTHING;

-- Update committees table with chair names (for backward compatibility)
UPDATE committees SET chair = 'Dr. Sarah Mitchell' WHERE abbreviation = 'ECOSOC';
UPDATE committees SET chair = 'Prof. James Chen' WHERE abbreviation = 'HRC';
UPDATE committees SET chair = 'Dr. Maria Rodriguez' WHERE abbreviation = 'WTO';
UPDATE committees SET chair = 'Amb. John Smith' WHERE abbreviation = 'UNGA';

-- Create sample country assignments for testing
-- This assigns countries to approved applications for demonstration

INSERT INTO country_assignments (application_id, committee_id, country, assigned_by)
SELECT 
    a.id,
    c.id,
    CASE c.abbreviation
        WHEN 'ECOSOC' THEN 'United States'
        WHEN 'HRC' THEN 'China'
        WHEN 'WTO' THEN 'Germany'
        WHEN 'UNGA' THEN 'France'
        ELSE 'Sample Country'
    END,
    (SELECT id FROM admin_users WHERE email = 'admin@turonmun.com' LIMIT 1)
FROM applications a
CROSS JOIN committees c
WHERE a.status = 'approved'
AND c.abbreviation IN ('ECOSOC', 'HRC', 'WTO', 'UNGA')
AND a.id NOT IN (SELECT application_id FROM country_assignments WHERE committee_id = c.id)
LIMIT 20;

-- Create sample position papers for testing
-- This creates sample position papers for assigned delegates

INSERT INTO position_papers (application_id, committee_id, title, content, status, submitted_at)
SELECT 
    ca.application_id,
    ca.committee_id,
    'Position Paper - ' || ca.country,
    'This position paper addresses the key issues facing ' || ca.country || ' in the context of ' || 
    CASE c.abbreviation
        WHEN 'ECOSOC' THEN 'economic development and social progress'
        WHEN 'HRC' THEN 'human rights and civil liberties'
        WHEN 'WTO' THEN 'international trade and economic cooperation'
        WHEN 'UNGA' THEN 'global governance and international cooperation'
    END || '. The delegate provides comprehensive analysis and thoughtful recommendations.',
    'submitted',
    NOW() - INTERVAL '1 day' * (RANDOM() * 7)::integer
FROM country_assignments ca
JOIN committees c ON ca.committee_id = c.id
WHERE ca.is_active = true
AND ca.application_id NOT IN (SELECT application_id FROM position_papers WHERE committee_id = ca.committee_id);

-- Create sample announcements for testing
INSERT INTO announcements (title, content, sender_id, committee_id, target_audience, is_published, published_at, total_recipients)
SELECT 
    'Welcome to ' || c.name,
    'Dear delegates, welcome to the ' || c.name || ' committee. We are excited to have you participate in this year''s conference. Please review the rules of procedure and prepare your position papers.',
    (SELECT id FROM admin_users WHERE email = 'chair.' || LOWER(c.abbreviation) || '@turonmun.com' LIMIT 1),
    c.id,
    'committee',
    true,
    NOW() - INTERVAL '1 day',
    (SELECT COUNT(*) FROM country_assignments WHERE committee_id = c.id AND is_active = true)
FROM committees c
WHERE c.abbreviation IN ('ECOSOC', 'HRC', 'WTO', 'UNGA');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check chair users
SELECT email, full_name, role FROM admin_users WHERE role = 'chair';

-- Check chair assignments
SELECT 
    au.full_name as chair_name,
    au.email as chair_email,
    c.name as committee_name,
    ca.role,
    ca.assigned_at
FROM chair_assignments ca
JOIN admin_users au ON ca.admin_user_id = au.id
JOIN committees c ON ca.committee_id = c.id
WHERE ca.is_active = true;

-- Check country assignments
SELECT 
    a.full_name as delegate_name,
    a.email as delegate_email,
    ca.country,
    c.name as committee_name,
    ca.assigned_at
FROM country_assignments ca
JOIN applications a ON ca.application_id = a.id
JOIN committees c ON ca.committee_id = c.id
WHERE ca.is_active = true;

-- Check position papers
SELECT 
    a.full_name as delegate_name,
    ca.country,
    c.name as committee_name,
    pp.title,
    pp.status,
    pp.score,
    pp.submitted_at
FROM position_papers pp
JOIN applications a ON pp.application_id = a.id
JOIN country_assignments ca ON pp.application_id = ca.application_id AND pp.committee_id = ca.committee_id
JOIN committees c ON pp.committee_id = c.id;

-- =============================================
-- LOGIN INFORMATION
-- =============================================
-- Chair users can now log in with:
-- Email: chair.ecosoc@turonmun.com
-- Email: chair.unhrc@turonmun.com  
-- Email: chair.wto@turonmun.com
-- Email: chair.unga@turonmun.com
-- Password: admin123 (same for all chair accounts)

-- After logging in, they can access:
-- /chair-dashboard - Main chair dashboard
-- /chair-dashboard/announcements - Manage announcements
-- /chair-dashboard/papers - Review position papers
-- /chair-dashboard/messaging - Message delegates
-- /chair-dashboard/schedule - View schedule
-- /chair-dashboard/delegates - View assigned delegates

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Chair users setup completed successfully!
-- The chair dashboard is now ready for use.
