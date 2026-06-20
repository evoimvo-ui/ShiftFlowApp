const express = require('express');
const router = express.Router();
const { saveSubscription, deleteSubscription } = require('../controllers/pushController');

router.post('/subscribe', saveSubscription);
router.post('/unsubscribe', deleteSubscription);

module.exports = router;