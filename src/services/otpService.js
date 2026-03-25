const { pool } = require('../config/db');

const TTL_SEC = parseInt(process.env.OTP_TTL || '300', 10);

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function storeOtp(phoneOrEmail, otp) {
  const expiresAt = new Date(Date.now() + TTL_SEC * 1000);
  await pool.query(
    `INSERT INTO otp_store (phone_or_email, otp_code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone_or_email) DO UPDATE SET otp_code = $2, expires_at = $3`,
    [phoneOrEmail, otp, expiresAt]
  );
}

async function verifyOtp(phoneOrEmail, otp) {
  const r = await pool.query(
    `DELETE FROM otp_store
     WHERE phone_or_email = $1 AND otp_code = $2 AND expires_at > NOW()
     RETURNING 1`,
    [phoneOrEmail, otp]
  );
  return r.rowCount > 0;
}

async function cleanupExpired() {
  await pool.query(`DELETE FROM otp_store WHERE expires_at < NOW()`);
}

module.exports = { generateOtp, storeOtp, verifyOtp, cleanupExpired };
