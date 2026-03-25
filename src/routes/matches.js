const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matchesController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/swipe', auth, validate('swipe'), matchesController.swipe);
router.get('/', auth, matchesController.list);

module.exports = router;
