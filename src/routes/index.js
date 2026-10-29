const { Router } = require('express');
const authRoutes = require('./auth.routes');
const leadRoutes = require('./lead.routes');
const ApiResponse = require('../utils/ApiResponse');

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'Foster CRM API service is healthy and operational', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Resource Routes
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);

module.exports = router;

