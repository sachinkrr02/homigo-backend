const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

const validations = {
  register: [
    body('email').optional().isEmail(),
    body('phone').optional().isString().trim().notEmpty(),
    body('password').optional().isString().isLength({ min: 6 }),
    body('name').isString().trim().notEmpty(),
  ],
  login: [
    body('emailOrPhone').optional().isString().trim().notEmpty(),
    body('phone').optional().isString().trim().notEmpty(),
    body('password').optional().isString(),
  ],
  otpSend: [
    body('phone').optional().isString().trim().notEmpty(),
    body('email').optional().isEmail(),
  ],
  otpVerify: [
    body('phoneOrEmail').isString().trim().notEmpty(),
    body('otp').isString().trim().notEmpty().isLength({ min: 4, max: 8 }),
  ],
  verificationRequest: [
    body('type').isIn(['phone', 'email', 'aadhaar', 'face_id']),
    body('value').optional().isString().trim(),
  ],
  patchMe: [
    body('name').optional().isString().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().isString().trim(),
    body('age').optional().isInt({ min: 18, max: 120 }),
    body('gender').optional().isString().trim(),
    body('occupation').optional().isString().trim(),
    body('smokingPreference').optional().isString().trim(),
    body('drinkingPreference').optional().isString().trim(),
    body('foodType').optional().isString().trim(),
    body('hostCategory').optional().isString().trim(),
    body('emailVerified').optional().isBoolean(),
    body('phoneVerified').optional().isBoolean(),
    body('aadhaarVerified').optional().isBoolean(),
    body('faceIdVerified').optional().isBoolean(),
    body('aadhaarNumber').optional().isString().trim().isLength({ min: 4, max: 20 }),
  ],
  putPreferences: [
    body('budgetMin').optional().isInt({ min: 0 }),
    body('budgetMax').optional().isInt({ min: 0 }),
    body('occupancy').optional().isString().trim(),
    body('location').optional().isString().trim(),
    body('possession').optional().isString().trim(),
    body('genderPreference').optional().isString().trim(),
    body('propertyType').optional().isString().trim(),
    body('furnishingType').optional().isString().trim(),
    body('smokingPreference').optional().isString().trim(),
    body('drinkingPreference').optional().isString().trim(),
    body('foodType').optional().isString().trim(),
    body('priorityWeights').optional().isObject(),
  ],
  createProperty: [
    body('locality').isString().trim().notEmpty(),
    body('towerBuilding').optional().isString().trim(),
    body('furnishingType').isString().trim().notEmpty(),
    body('parkingAvailable').optional().isBoolean(),
    body('totalArea').optional().isFloat({ min: 0 }),
    body('rentedArea').optional().isFloat({ min: 0 }),
    body('rent').isInt({ min: 0 }),
    body('deposit').isInt({ min: 0 }),
    body('brokerage').optional().isInt({ min: 0 }),
    body('monthlyCharges').optional().isInt({ min: 0 }),
    body('distance_metro').optional().isString().trim(),
    body('distance_bus').optional().isString().trim(),
    body('distance_gym').optional().isString().trim(),
    body('distance_airport').optional().isString().trim(),
    body('nearby_hospitals').optional().isArray(),
    body('nearby_malls').optional().isArray(),
    body('nearby_grocery').optional().isArray(),
    body('amenities').optional().isArray(),
    body('petPolicy').optional().isString().trim(),
    body('waterSupply').optional().isString().trim(),
    body('restrictions').optional().isString().trim(),
    body('propertyType').isString().trim().notEmpty(),
    body('occupancy').optional().isString().trim(),
    body('isPremium').optional().isBoolean(),
  ],
  patchProperty: [
    param('id').isUUID(),
    body('locality').optional().isString().trim().notEmpty(),
    body('towerBuilding').optional().isString().trim(),
    body('furnishingType').optional().isString().trim().notEmpty(),
    body('parkingAvailable').optional().isBoolean(),
    body('totalArea').optional().isFloat({ min: 0 }),
    body('rentedArea').optional().isFloat({ min: 0 }),
    body('rent').optional().isInt({ min: 0 }),
    body('deposit').optional().isInt({ min: 0 }),
    body('brokerage').optional().isInt({ min: 0 }),
    body('monthlyCharges').optional().isInt({ min: 0 }),
    body('propertyType').optional().isString().trim().notEmpty(),
    body('occupancy').optional().isString().trim(),
    body('isPremium').optional().isBoolean(),
  ],
  swipe: [
    body('propertyId').isUUID(),
    body('direction').isIn(['like', 'pass']),
  ],
  createVisitRequest: [
    body('propertyId').isUUID(),
    body('requestedDate').isString().trim().notEmpty(),
    body('requestedTime').isString().trim().notEmpty(),
    body('message').optional().isString().trim(),
  ],
};

function validate(schemaName) {
  const chain = validations[schemaName];
  if (!chain) return [(req, res, next) => next()];
  return [
    ...chain,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError(errors.array().map(e => e.msg).join('; '), 400));
      }
      next();
    },
  ];
}

module.exports = { validate };