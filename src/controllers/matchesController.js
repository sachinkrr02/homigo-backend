const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const matchService = require('../services/matchService');

async function swipe(req, res, next) {
  try {
    if (req.user.role !== 'tenant') return next(new AppError('Tenant only', 403));
    const { propertyId, direction } = req.body;
    const tenantId = req.user.id;
    const prop = await pool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (prop.rows.length === 0) return next(new AppError('Property not found', 404));
    const property = prop.rows[0];
    const hostId = property.host_id;

    let prefsRow = null;
    const prefs = await pool.query('SELECT * FROM tenant_preferences WHERE user_id = $1', [tenantId]);
    if (prefs.rows.length > 0) prefsRow = prefs.rows[0];
    const compatibilityScore = prefsRow ? matchService.computeCompatibility(prefsRow, property) : 50;
    const tenantSwipedRight = direction === 'like';

    const existing = await pool.query(
      'SELECT id FROM matches WHERE tenant_id = $1 AND property_id = $2',
      [tenantId, propertyId]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE matches SET tenant_swiped_right = $1, compatibility_score = $2, matched_at = NOW() WHERE tenant_id = $3 AND property_id = $4',
        [tenantSwipedRight, compatibilityScore, tenantId, propertyId]
      );
    } else {
      await pool.query(
        `INSERT INTO matches (id, tenant_id, property_id, host_id, tenant_swiped_right, host_swiped_right, compatibility_score)
         VALUES ($1, $2, $3, $4, $5, false, $6)`,
        [uuidv4(), tenantId, propertyId, hostId, tenantSwipedRight, compatibilityScore]
      );
    }
    const m = await pool.query(
      'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
      [tenantId, propertyId]
    );
    const row = m.rows[0];
    res.json({
      id: row.id,
      tenantId: row.tenant_id,
      propertyId: row.property_id,
      hostId: row.host_id,
      tenantSwipedRight: row.tenant_swiped_right,
      hostSwipedRight: row.host_swiped_right,
      compatibilityScore: row.compatibility_score,
      matchedAt: row.matched_at,
    });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const r = await pool.query(
      `SELECT m.*, u_tenant.name AS tenant_name, u_host.name AS host_name,
        p.locality, p.rent, p.property_type, p.furnishing_type,
        COALESCE(
          (SELECT array_agg(pi.url_or_path ORDER BY pi.sort_order) FROM property_images pi WHERE pi.property_id = p.id),
          '{}'
        ) AS image_paths
       FROM matches m
       JOIN users u_tenant ON u_tenant.id = m.tenant_id
       JOIN users u_host ON u_host.id = m.host_id
       JOIN properties p ON p.id = m.property_id
       WHERE m.tenant_id = $1 OR m.host_id = $1
       ORDER BY m.matched_at DESC`,
      [userId]
    );
    const list = r.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      hostId: row.host_id,
      propertyId: row.property_id,
      tenantName: row.tenant_name,
      hostName: row.host_name,
      compatibilityScore: row.compatibility_score,
      matchedAt: row.matched_at,
      tenantSwipedRight: row.tenant_swiped_right,
      hostSwipedRight: row.host_swiped_right,
      property: {
        id: row.property_id,
        locality: row.locality,
        rent: row.rent,
        propertyType: row.property_type,
        furnishingType: row.furnishing_type,
        imagePaths: row.image_paths || [],
      },
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
}

module.exports = { swipe, list };