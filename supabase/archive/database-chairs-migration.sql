-- =============================================
-- ADD CHAIR FIELDS TO COMMITTEES TABLE
-- =============================================
-- Migration to add chair and co_chair columns
 
-- Add chair and co_chair columns to committees table
ALTER TABLE committees 
ADD COLUMN IF NOT EXISTS chair VARCHAR(255),
ADD COLUMN IF NOT EXISTS co_chair VARCHAR(255); 