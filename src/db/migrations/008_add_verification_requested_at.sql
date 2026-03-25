-- When user submits for verification we set requested_at; admin later sets *_verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verification_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_id_verification_requested_at TIMESTAMPTZ;
