-- OTP store (in-DB option; can use Redis instead)
CREATE TABLE IF NOT EXISTS otp_store (
  phone_or_email VARCHAR(255) NOT NULL PRIMARY KEY,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_store (expires_at);
