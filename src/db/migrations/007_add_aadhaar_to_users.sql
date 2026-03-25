-- Add Aadhaar number to users (optional; store last 4 or masked for display)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);
