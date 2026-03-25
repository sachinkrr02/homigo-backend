const express = require('express');
const router = express.Router();
const propertiesController = require('../controllers/propertiesController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

router.get('/', auth, propertiesController.list);
router.get('/:id', auth, propertiesController.getById);
router.post('/', auth, validate('createProperty'), propertiesController.create);
router.patch('/:id', auth, validate('patchProperty'), propertiesController.patch);
router.delete('/:id', auth, propertiesController.remove);
router.post('/:id/images', auth, upload.array('images', 6), propertiesController.addImages);
router.delete('/:id/images/:imageId', auth, propertiesController.deleteImage);

module.exports = router;
