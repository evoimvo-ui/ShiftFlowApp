const express = require('express');
const router = express.Router();
const { saveSubscription, deleteSubscription } = require('../controllers/pushController');
const auth = require('../middleware/auth');

router.post('/subscribe', auth, saveSubscription);
router.post('/unsubscribe', auth, deleteSubscription);

module.exports = router;