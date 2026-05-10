const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const auth = require('../middleware/auth');

router.get('/', auth, holidayController.getHolidays);
router.post('/', auth, holidayController.createHoliday);
router.delete('/:id', auth, holidayController.deleteHoliday);

module.exports = router;
