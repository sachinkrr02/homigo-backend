const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

function rowToJson(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    hostId: row.host_id,
    tenantName: row.tenant_name,
    hostName: row.host_name,
    propertyLocality: row.locality,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function create(req, res, next) {
  try {
    const tenantId = req.user.id;
    const { propertyId, requestedDate, requestedTime, message } = req.body;
    if (!propertyId || !requestedDate || !requestedTime) {
      return next(new AppError('propertyId, requestedDate and requestedTime are required', 400));
    }
    const prop = await pool.query('SELECT id, host_id FROM properties WHERE id = $1', [propertyId]);
    if (prop.rows.length === 0) return next(new AppError('Property not found', 404));
    const hostId = prop.rows[0].host_id;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO visit_requests (id, tenant_id, property_id, host_id, requested_date, requested_time, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [id, tenantId, propertyId, hostId, requestedDate, requestedTime, message || null]
    );

    const r = await pool.query(
      `SELECT vr.*, u_tenant.name AS tenant_name, u_host.name AS host_name, p.locality
       FROM visit_requests vr
       JOIN users u_tenant ON u_tenant.id = vr.tenant_id
       JOIN users u_host ON u_host.id = vr.host_id
       JOIN properties p ON p.id = vr.property_id
       WHERE vr.id = $1`,
      [id]
    );
    res.status(201).json(rowToJson(r.rows[0]));
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const forRole = req.query.for || (req.user.role === 'host' ? 'host' : 'tenant');
    let query;
    const params = [userId];
    if (forRole === 'host') {
      query = `
        SELECT vr.*, u_tenant.name AS tenant_name, u_host.name AS host_name, p.locality
        FROM visit_requests vr
        JOIN users u_tenant ON u_tenant.id = vr.tenant_id
        JOIN users u_host ON u_host.id = vr.host_id
        JOIN properties p ON p.id = vr.property_id
        WHERE vr.host_id = $1
        ORDER BY vr.created_at DESC`;
    } else {
      query = `
        SELECT vr.*, u_tenant.name AS tenant_name, u_host.name AS host_name, p.locality
        FROM visit_requests vr
        JOIN users u_tenant ON u_tenant.id = vr.tenant_id
        JOIN users u_host ON u_host.id = vr.host_id
        JOIN properties p ON p.id = vr.property_id
        WHERE vr.tenant_id = $1
        ORDER BY vr.created_at DESC`;
    }
    const r = await pool.query(query, params);
    res.json(r.rows.map(rowToJson));
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list };
