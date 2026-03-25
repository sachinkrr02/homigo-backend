require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const migrationsDir = path.join(__dirname, 'migrations');

async function run() {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
  }
  console.log('Migrations done.');
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
