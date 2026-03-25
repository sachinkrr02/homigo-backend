const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.get('/me/preferences', auth, preferencesController.getPreferences);
router.put('/me/preferences', auth, validate('putPreferences'), preferencesController.putPreferences);

module.exports = router;
