const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');

router.post('/register', validate('register'), authController.register);
router.post('/login', validate('login'), authController.login);
router.post('/otp/send', validate('otpSend'), authController.otpSend);
router.post('/otp/verify', validate('otpVerify'), authController.otpVerify);

module.exports = router;
