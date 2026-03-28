require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const preferencesRoutes = require('./routes/preferences');
const propertiesRoutes = require('./routes/properties');
const matchesRoutes = require('./routes/matches');
const visitRequestsRoutes = require('./routes/visitRequests');
const { notFound, errorHandler } = require('./utils/errors');

const app = express();

app.use(cors());
app.use(express.json());

const API_BASE = '/api';
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, usersRoutes);
app.use(`${API_BASE}/properties`, propertiesRoutes);
app.use(`${API_BASE}/matches`, matchesRoutes);
app.use(`${API_BASE}/visit-requests`, visitRequestsRoutes);
// preferences under users/me
app.use(`${API_BASE}/users`, preferencesRoutes);

if (process.env.UPLOADS_DIR) {
  app.use('/uploads', express.static(path.resolve(process.env.UPLOADS_DIR)));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
