const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const matchService = require('../services/matchService');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

function propertyToJson(row, hostName = null) {
  const r = {
    id: row.id,
    hostId: row.host_id,
    hostName: hostName ?? row.host_name,
    imagePaths: row.image_paths || [],
    locality: row.locality,
    towerBuilding: row.tower_building,
    furnishingType: row.furnishing_type,
    parkingAvailable: row.parking_available,
    totalArea: row.total_area != null ? parseFloat(row.total_area) : null,
    rentedArea: row.rented_area != null ? parseFloat(row.rented_area) : null,
    rent: row.rent,
    deposit: row.deposit,
    brokerage: row.brokerage,
    monthlyCharges: row.monthly_charges,
    distanceToMetro: row.distance_metro,
    distanceToBus: row.distance_bus,
    distanceToGym: row.distance_gym,
    distanceToAirport: row.distance_airport,
    nearbyHospitals: row.nearby_hospitals || [],
    nearbyMalls: row.nearby_malls || [],
    nearbyGrocery: row.nearby_grocery || [],
    amenities: row.amenities || [],
    petPolicy: row.pet_policy,
    waterSupply: row.water_supply,
    restrictions: row.restrictions,
    propertyType: row.property_type,
    occupancy: row.occupancy,
    isPremium: row.is_premium,
    createdAt: row.created_at,
  };
  return r;
}

async function list(req, res, next) {
  try {
    const { location, minRent, maxRent, propertyType, furnishing, occupancy, limit = 50, offset = 0, userId: queryUserId, mine } = req.query;
    const userId = queryUserId || (req.user.role === 'tenant' ? req.user.id : null);
    let query = `
      SELECT p.*, u.name AS host_name,
        COALESCE(
          (SELECT array_agg(pi.url_or_path ORDER BY pi.sort_order) FROM property_images pi WHERE pi.property_id = p.id),
          '{}'
        ) AS image_paths
      FROM properties p
      JOIN users u ON u.id = p.host_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (mine === '1' || mine === 'true') {
      query += ` AND p.host_id = $${i}`;
      params.push(req.user.id);
      i++;
    }
    if (location) { query += ` AND p.locality ILIKE $${i}`; params.push(`%${location}%`); i++; }
    if (minRent) { query += ` AND p.rent >= $${i}`; params.push(parseInt(minRent, 10)); i++; }
    if (maxRent) { query += ` AND p.rent <= $${i}`; params.push(parseInt(maxRent, 10)); i++; }
    if (propertyType) { query += ` AND p.property_type = $${i}`; params.push(propertyType); i++; }
    if (furnishing) { query += ` AND p.furnishing_type = $${i}`; params.push(furnishing); i++; }
    if (occupancy) { query += ` AND p.occupancy = $${i}`; params.push(occupancy); i++; }
    query += ` ORDER BY p.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

    const r = await pool.query(query, params);
    let rows = r.rows.map((row) => ({ ...row, image_paths: row.image_paths || [] }));

    if (userId) {
      const prefs = await pool.query('SELECT * FROM tenant_preferences WHERE user_id = $1', [userId]);
      if (prefs.rows.length > 0) {
        const prefsRow = prefs.rows[0];
        rows = rows.map((row) => ({
          ...row,
          _compatibility: matchService.computeCompatibility(prefsRow, row),
        }));
        rows.sort((a, b) => (b._compatibility || 0) - (a._compatibility || 0));
      }
    }

    const list = rows.map((row) => {
      const out = propertyToJson(row);
      if (row._compatibility != null) out.compatibilityScore = row._compatibility;
      return out;
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const id = req.params.id;
    const r = await pool.query(
      `SELECT p.*, u.name AS host_name,
        COALESCE(
          (SELECT array_agg(pi.url_or_path ORDER BY pi.sort_order) FROM property_images pi WHERE pi.property_id = p.id),
          '{}'
        ) AS image_paths
       FROM properties p
       JOIN users u ON u.id = p.host_id
       WHERE p.id = $1`,
      [id]
    );
    if (r.rows.length === 0) return next(new AppError('Property not found', 404));
    res.json(propertyToJson(r.rows[0]));
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const b = req.body;
    const id = uuidv4();
    await pool.query(
      `INSERT INTO properties (id, host_id, locality, tower_building, furnishing_type, parking_available,
       total_area, rented_area, rent, deposit, brokerage, monthly_charges, distance_metro, distance_bus,
       distance_gym, distance_airport, nearby_hospitals, nearby_malls, nearby_grocery, amenities,
       pet_policy, water_supply, restrictions, property_type, occupancy, is_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb, $21, $22, $23, $24, $25, $26)`,
      [id, req.user.id, b.locality, b.towerBuilding ?? null, b.furnishingType, b.parkingAvailable ?? false,
        b.totalArea ?? null, b.rentedArea ?? null, b.rent, b.deposit, b.brokerage ?? null, b.monthlyCharges ?? null,
        (b.distance_metro ?? b.distanceToMetro) ?? null, (b.distance_bus ?? b.distanceToBus) ?? null, (b.distance_gym ?? b.distanceToGym) ?? null, (b.distance_airport ?? b.distanceToAirport) ?? null,
        JSON.stringify(b.nearby_hospitals || b.nearbyHospitals || []),
        JSON.stringify(b.nearby_malls || b.nearbyMalls || []),
        JSON.stringify(b.nearby_grocery || b.nearbyGrocery || []),
        JSON.stringify(b.amenities || []),
        b.petPolicy ?? null, b.waterSupply ?? null, b.restrictions ?? null,
        b.propertyType, b.occupancy ?? null, b.isPremium ?? false]
    );
    const q = await pool.query(
      `SELECT p.*, u.name AS host_name FROM properties p JOIN users u ON u.id = p.host_id WHERE p.id = $1`,
      [id]
    );
    const row = q.rows[0];
    row.image_paths = [];
    res.status(201).json(propertyToJson(row));
  } catch (e) {
    next(e);
  }
}

async function patch(req, res, next) {
  try {
    const id = req.params.id;
    const r = await pool.query('SELECT host_id FROM properties WHERE id = $1', [id]);
    if (r.rows.length === 0) return next(new AppError('Property not found', 404));
    if (r.rows[0].host_id !== req.user.id) return next(new AppError('Forbidden', 403));
    const b = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    const map = {
      locality: 'locality', towerBuilding: 'tower_building', furnishingType: 'furnishing_type',
      parkingAvailable: 'parking_available', totalArea: 'total_area', rentedArea: 'rented_area',
      rent: 'rent', deposit: 'deposit', brokerage: 'brokerage', monthlyCharges: 'monthly_charges',
      propertyType: 'property_type', occupancy: 'occupancy', isPremium: 'is_premium',
    };
    for (const [k, v] of Object.entries(b)) {
      const col = map[k];
      if (!col || v === undefined) continue;
      updates.push(`${col} = $${i++}`);
      values.push(v);
    }
    if (updates.length === 0) {
      const q = await pool.query(`SELECT p.*, u.name AS host_name FROM properties p JOIN users u ON u.id = p.host_id WHERE p.id = $1`, [id]);
      const row = q.rows[0];
      const imgs = await pool.query('SELECT url_or_path FROM property_images WHERE property_id = $1 ORDER BY sort_order', [id]);
      row.image_paths = imgs.rows.map((r) => r.url_or_path);
      return res.json(propertyToJson(row));
    }
    values.push(id);
    await pool.query(`UPDATE properties SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
    const q = await pool.query(`SELECT p.*, u.name AS host_name FROM properties p JOIN users u ON u.id = p.host_id WHERE p.id = $1`, [id]);
    const row = q.rows[0];
    const imgs = await pool.query('SELECT url_or_path FROM property_images WHERE property_id = $1 ORDER BY sort_order', [id]);
    row.image_paths = imgs.rows.map((r) => r.url_or_path);
    res.json(propertyToJson(row));
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const id = req.params.id;
    const r = await pool.query('SELECT host_id FROM properties WHERE id = $1', [id]);
    if (r.rows.length === 0) return next(new AppError('Property not found', 404));
    if (r.rows[0].host_id !== req.user.id) return next(new AppError('Forbidden', 403));
    const imgs = await pool.query('SELECT url_or_path FROM property_images WHERE property_id = $1', [id]);
    for (const row of imgs.rows) {
      const filePath = path.isAbsolute(row.url_or_path) ? row.url_or_path : path.join(UPLOADS_DIR, path.basename(row.url_or_path));
      try { fs.promises.unlink(filePath); } catch (_) {}
    }
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

async function addImages(req, res, next) {
  try {
    const id = req.params.id;
    const files = req.files || [];
    const r = await pool.query('SELECT host_id FROM properties WHERE id = $1', [id]);
    if (r.rows.length === 0) return next(new AppError('Property not found', 404));
    if (r.rows[0].host_id !== req.user.id) return next(new AppError('Forbidden', 403));
    const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS m FROM property_images WHERE property_id = $1', [id]);
    let sortOrder = (maxOrder.rows[0].m || 0) + 1;
    for (const f of files) {
      const relPath = path.basename(f.path);
      await pool.query(
        'INSERT INTO property_images (id, property_id, url_or_path, sort_order) VALUES ($1, $2, $3, $4)',
        [uuidv4(), id, relPath, sortOrder++]
      );
    }
    const imgs = await pool.query('SELECT id, url_or_path, sort_order FROM property_images WHERE property_id = $1 ORDER BY sort_order', [id]);
    res.status(201).json(imgs.rows.map((row) => ({ id: row.id, urlOrPath: row.url_or_path, sortOrder: row.sort_order })));
  } catch (e) {
    next(e);
  }
}

async function deleteImage(req, res, next) {
  try {
    const { id: propertyId, imageId } = req.params;
    const r = await pool.query('SELECT host_id FROM properties WHERE id = $1', [propertyId]);
    if (r.rows.length === 0) return next(new AppError('Property not found', 404));
    if (r.rows[0].host_id !== req.user.id) return next(new AppError('Forbidden', 403));
    const img = await pool.query('SELECT url_or_path FROM property_images WHERE id = $1 AND property_id = $2', [imageId, propertyId]);
    if (img.rows.length === 0) return next(new AppError('Image not found', 404));
    const filePath = path.join(UPLOADS_DIR, path.basename(img.rows[0].url_or_path));
    try { fs.promises.unlink(filePath); } catch (_) {}
    await pool.query('DELETE FROM property_images WHERE id = $1 AND property_id = $2', [imageId, propertyId]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create, patch, remove, addImages, deleteImage };
