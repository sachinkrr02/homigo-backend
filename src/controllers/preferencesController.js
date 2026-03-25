const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

function rowToJson(row) {
  return {
    id: row.id,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    occupancy: row.occupancy,
    location: row.location,
    possession: row.possession,
    genderPreference: row.gender_preference,
    propertyType: row.property_type,
    furnishingType: row.furnishing_type,
    smokingPreference: row.smoking_preference,
    drinkingPreference: row.drinking_preference,
    foodType: row.food_type,
    priorityWeights: row.priority_weights || {},
  };
}

async function getPreferences(req, res, next) {
  try {
    if (req.user.role !== 'tenant') return next(new AppError('Tenant only', 403));
    const r = await pool.query('SELECT * FROM tenant_preferences WHERE user_id = $1', [req.user.id]);
    if (r.rows.length === 0) return next(new AppError('Preferences not set', 404));
    res.json(rowToJson(r.rows[0]));
  } catch (e) {
    next(e);
  }
}

async function putPreferences(req, res, next) {
  try {
    if (req.user.role !== 'tenant') return next(new AppError('Tenant only', 403));
    const b = req.body;
    const r = await pool.query('SELECT id FROM tenant_preferences WHERE user_id = $1', [req.user.id]);
    const priorityWeights = b.priorityWeights && typeof b.priorityWeights === 'object'
      ? JSON.stringify(b.priorityWeights) : '{}';
    if (r.rows.length === 0) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO tenant_preferences (id, user_id, budget_min, budget_max, occupancy, location, possession,
         gender_preference, property_type, furnishing_type, smoking_preference, drinking_preference, food_type, priority_weights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)`,
        [id, req.user.id, b.budgetMin ?? null, b.budgetMax ?? null, b.occupancy ?? null, b.location ?? null,
          b.possession ?? null, b.genderPreference ?? null, b.propertyType ?? null, b.furnishingType ?? null,
          b.smokingPreference ?? null, b.drinkingPreference ?? null, b.foodType ?? null, priorityWeights]
      );
      const q = await pool.query('SELECT * FROM tenant_preferences WHERE id = $1', [id]);
      return res.json(rowToJson(q.rows[0]));
    }
    await pool.query(
      `UPDATE tenant_preferences SET
       budget_min = $1, budget_max = $2, occupancy = $3, location = $4, possession = $5,
       gender_preference = $6, property_type = $7, furnishing_type = $8,
       smoking_preference = $9, drinking_preference = $10, food_type = $11,
       priority_weights = $12::jsonb, updated_at = NOW()
       WHERE user_id = $13`,
      [b.budgetMin ?? null, b.budgetMax ?? null, b.occupancy ?? null, b.location ?? null, b.possession ?? null,
        b.genderPreference ?? null, b.propertyType ?? null, b.furnishingType ?? null,
        b.smokingPreference ?? null, b.drinkingPreference ?? null, b.foodType ?? null,
        priorityWeights, req.user.id]
    );
    const q = await pool.query('SELECT * FROM tenant_preferences WHERE user_id = $1', [req.user.id]);
    res.json(rowToJson(q.rows[0]));
  } catch (e) {
    next(e);
  }
}

module.exports = { getPreferences, putPreferences };