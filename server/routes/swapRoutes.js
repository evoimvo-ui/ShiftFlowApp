const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const auth = require('../middleware/auth');

router.get('/', auth, swapController.getSwapRequests);
router.post('/', auth, swapController.createSwapRequest);
router.put('/:id', auth, swapController.processSwapRequest);

module.exports = router;
