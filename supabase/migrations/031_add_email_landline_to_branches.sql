-- Add email and landline fields to branches table
ALTER TABLE branches
ADD COLUMN email TEXT,
ADD COLUMN landline TEXT;
