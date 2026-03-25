const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/verification-request', auth, validate('verificationRequest'), usersController.requestVerification);
router.get('/me', auth, usersController.getMe);
router.patch('/me', auth, validate('patchMe'), usersController.patchMe);

module.exports = router;
