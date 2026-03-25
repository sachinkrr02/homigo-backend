const express = require('express');
const router = express.Router();
const visitRequestsController = require('../controllers/visitRequestsController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/', auth, validate('createVisitRequest'), visitRequestsController.create);
router.get('/', auth, visitRequestsController.list);

module.exports = router;
