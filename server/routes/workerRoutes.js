const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const auth = require('../middleware/auth');

router.get('/', auth, workerController.getWorkers);
router.post('/', auth, workerController.createWorker);
router.put('/:id', auth, workerController.updateWorker);
router.delete('/:id', auth, workerController.deleteWorker);

module.exports = router;
