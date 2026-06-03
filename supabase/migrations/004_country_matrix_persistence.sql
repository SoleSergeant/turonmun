-- Add matrix_countries table to persist manually added countries in the Country Matrix
CREATE TABLE IF NOT EXISTS matrix_countries (
  country_name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Enable Row Level Security
ALTER TABLE matrix_countries ENABLE ROW LEVEL SECURITY;

-- Policies for matrix_countries
-- Allow anyone to view common/managed countries
CREATE POLICY "Anyone can view matrix countries" 
  ON matrix_countries FOR SELECT 
  USING (true);

-- Allow admins to manage matrix countries
-- Assuming 'true' for simplicity to match existing policies in migrations
CREATE POLICY "Admins can manage matrix countries" 
  ON matrix_countries FOR ALL 
  USING (true);

-- Add some initial countries if needed (optional since we have COMMON_COUNTRIES in code)
-- INSERT INTO matrix_countries (country_name) VALUES ('Kazakhstan'), ('Uzbekistan') ON CONFLICT DO NOTHING;
