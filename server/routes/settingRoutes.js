const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const auth = require('../middleware/auth');

router.get('/', auth, settingController.getSettings);
router.put('/', auth, settingController.updateSettings);

router.get('/shifts', auth, settingController.getShiftTypes);
router.post('/shifts', auth, settingController.createShiftType);
router.put('/shifts/:id', auth, settingController.updateShiftType);
router.delete('/shifts/:id', auth, settingController.deleteShiftType);

module.exports = router;
