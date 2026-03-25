const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const otpService = require('../services/otpService');

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

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
  };
}

async function register(req, res, next) {
  try {
    const { email, phone, password, name } = req.body;
    if (!email && !phone) throw new AppError('Email or phone required', 400);
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const id = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, phone, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5, 'tenant')`,
      [id, email || null, phone || null, passwordHash, name]
    );
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userToJson(r.rows[0]);
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (e) {
    if (e.code === '23505') {
      return next(new AppError('Email or phone already registered', 409));
    }
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const emailOrPhone = req.body.emailOrPhone || req.body.phone;
    const password = req.body.password;
    if (!emailOrPhone) throw new AppError('Email or phone required', 400);
    const isPhone = /^\d+$/.test(emailOrPhone.trim());
    const r = await pool.query(
      `SELECT * FROM users WHERE ${isPhone ? 'phone' : 'email'} = $1`,
      [emailOrPhone.trim()]
    );
    if (r.rows.length === 0) {
      if (isPhone) return res.json({ requiresOtp: true });
      throw new AppError('Invalid credentials', 401);
    }
    const row = r.rows[0];
    if (password) {
      if (!row.password_hash) throw new AppError('Account uses OTP login', 400);
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) throw new AppError('Invalid credentials', 401);
      const user = userToJson(row);
      const token = signToken(user);
      return res.json({ user, token });
    }
    if (isPhone) return res.json({ requiresOtp: true });
    throw new AppError('Password required', 400);
  } catch (e) {
    next(e);
  }
}

async function otpSend(req, res, next) {
  try {
    const phone = req.body.phone;
    const email = req.body.email;
    const key = phone || email;
    if (!key) throw new AppError('Phone or email required', 400);
    const otp = otpService.generateOtp();
    await otpService.storeOtp(key, otp);
    // Stub: in production send SMS/email
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP] ${key} => ${otp}`);
    }
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

async function otpVerify(req, res, next) {
  try {
    const { phoneOrEmail, otp } = req.body;
    const valid = await otpService.verifyOtp(phoneOrEmail, otp);
    if (!valid) throw new AppError('Invalid or expired OTP', 400);
    const isPhone = /^\d+$/.test(phoneOrEmail.trim());
    const r = await pool.query(
      `SELECT * FROM users WHERE ${isPhone ? 'phone' : 'email'} = $1`,
      [phoneOrEmail.trim()]
    );
    let row;
    if (r.rows.length === 0) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO users (id, ${isPhone ? 'phone' : 'email'}, name, role)
         VALUES ($1, $2, $3, 'tenant')`,
        [id, phoneOrEmail.trim(), 'User']
      );
      const q = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      row = q.rows[0];
    } else {
      row = r.rows[0];
    }
    const user = userToJson(row);
    const token = signToken(user);
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, otpSend, otpVerify };
