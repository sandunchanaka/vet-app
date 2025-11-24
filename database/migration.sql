-- Migration script to add missing columns to existing users table
USE etutor_platform;

-- Add missing columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Update existing users with sample data
UPDATE users SET phone = '+1234567890' WHERE phone IS NULL;
UPDATE users SET business_name = 'Sample Business' WHERE business_name IS NULL;
UPDATE users SET website = 'https://example.com' WHERE website IS NULL;

