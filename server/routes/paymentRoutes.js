const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Important: Use raw body parser for Paddle webhook (not express.json())
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
