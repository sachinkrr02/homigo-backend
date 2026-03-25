require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

pool.query('SELECT 1')
  .then(() => {
    console.log('DB connected');
    app.listen(PORT, () => {
      console.log(`Homigo API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
