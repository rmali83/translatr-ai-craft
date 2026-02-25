-- Fix RLS policies for glossary_terms table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON glossary_terms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON glossary_terms;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON glossary_terms;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON glossary_terms;

-- Enable RLS
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON glossary_terms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON glossary_terms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON glossary_terms FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON glossary_terms FOR DELETE
TO authenticated
USING (true);
