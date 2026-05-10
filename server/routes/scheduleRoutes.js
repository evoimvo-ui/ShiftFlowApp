const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

router.get('/', auth, scheduleController.getSchedules);
router.post('/generate', auth, scheduleController.generateNewSchedule);
router.delete('/:weekStart', auth, scheduleController.deleteSchedule);
router.delete('/assignment/:scheduleId/:assignmentId', auth, scheduleController.deleteAssignment);
router.put('/manual-update', auth, scheduleController.manualUpdate);

module.exports = router;
