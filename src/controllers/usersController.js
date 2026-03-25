const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

function userToJson(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    age: row.age,
    gender: row.gender,
    occupation: row.occupation,
    smokingPreference: row.smoking_preference,
    drinkingPreference: row.drinking_preference,
    foodType: row.food_type,
    hostCategory: row.host_category,
    verificationStatus: row.verification_status,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified,
    aadhaarVerified: row.aadhaar_verified,
    faceIdVerified: row.face_id_verified,
    aadhaarNumber: row.aadhaar_number,
    phoneVerificationRequestedAt: row.phone_verification_requested_at?.toISOString?.() ?? null,
    emailVerificationRequestedAt: row.email_verification_requested_at?.toISOString?.() ?? null,
    aadhaarVerificationRequestedAt: row.aadhaar_verification_requested_at?.toISOString?.() ?? null,
    faceIdVerificationRequestedAt: row.face_id_verification_requested_at?.toISOString?.() ?? null,
  };
}

async function getMe(req, res, next) {
  try {
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) return next(new AppError('User not found', 404));
    res.json(userToJson(r.rows[0]));
  } catch (e) {
    next(e);
  }
}

async function patchMe(req, res, next) {
  try {
    const b = req.body;
    const allowed = [
      'name', 'email', 'phone', 'age', 'gender', 'occupation', 'smoking_preference', 'drinking_preference',
      'food_type', 'host_category', 'verification_status', 'email_verified', 'phone_verified',
      'aadhaar_verified', 'face_id_verified', 'aadhaar_number'
    ];
    const setClauses = [];
    const values = [];
    let i = 1;
    const map = {
      smokingPreference: 'smoking_preference',
      drinkingPreference: 'drinking_preference',
      foodType: 'food_type',
      hostCategory: 'host_category',
      verificationStatus: 'verification_status',
      emailVerified: 'email_verified',
      phoneVerified: 'phone_verified',
      aadhaarVerified: 'aadhaar_verified',
      faceIdVerified: 'face_id_verified',
      aadhaarNumber: 'aadhaar_number',
    };
    for (const [k, v] of Object.entries(b)) {
      const col = map[k] || k;
      if (!allowed.includes(col) || v === undefined) continue;
      setClauses.push(`${col} = $${i++}`);
      values.push(v);
    }
    if (setClauses.length === 0) {
      const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (r.rows.length === 0) return next(new AppError('User not found', 404));
      return res.json(userToJson(r.rows[0]));
    }
    setClauses.push(`updated_at = NOW()`);
    values.push(req.user.id);
    const q = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`;
    const r = await pool.query(q, values);
    if (r.rows.length === 0) return next(new AppError('User not found', 404));
    res.json(userToJson(r.rows[0]));
  } catch (e) {
    next(e);
  }
}

const VERIFICATION_TYPES = ['phone', 'email', 'aadhaar', 'face_id'];

async function requestVerification(req, res, next) {
  try {
    const { type, value } = req.body;
    if (!VERIFICATION_TYPES.includes(type)) {
      return next(new AppError('Invalid verification type', 400));
    }
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) return next(new AppError('User not found', 404));
    const row = r.rows[0];

    const updates = [];
    const params = [];
    let i = 1;

    if (type === 'phone') {
      const phone = (value && value.trim()) || row.phone;
      if (!phone || !phone.trim()) {
        return next(new AppError('Please add your phone number in profile first', 400));
      }
      updates.push('phone = $' + i, 'phone_verification_requested_at = NOW()', 'phone_verified = true');
      params.push(phone.trim());
      i++;
    } else if (type === 'email') {
      const email = (value && value.trim()) || row.email;
      if (!email || !email.trim()) {
        return next(new AppError('Please add your email in profile first', 400));
      }
      updates.push('email = $' + i, 'email_verification_requested_at = NOW()', 'email_verified = true');
      params.push(email.trim());
      i++;
    } else if (type === 'aadhaar') {
      const aadhaar = (value && value.trim()) || row.aadhaar_number;
      if (!aadhaar || aadhaar.length < 4) {
        return next(new AppError('Please enter your Aadhaar number (at least last 4 digits)', 400));
      }
      updates.push('aadhaar_number = $' + i, 'aadhaar_verification_requested_at = NOW()', 'aadhaar_verified = true');
      params.push(aadhaar.trim());
      i++;
    } else {
      updates.push('face_id_verification_requested_at = NOW()', 'face_id_verified = true');
    }

    params.push(req.user.id);
    const whereIdx = params.length;
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${whereIdx}`,
      params
    );
    const q = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json(userToJson(q.rows[0]));
  } catch (e) {
    next(e);
  }
}

module.exports = { getMe, patchMe, requestVerification };