const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const auth = require('../middleware/auth');

router.get('/', auth, absenceController.getAbsences);
router.post('/', auth, absenceController.createAbsence);
router.put('/:id/approve', auth, absenceController.approveAbsence);
router.delete('/:id', auth, absenceController.deleteAbsence);

module.exports = router;
