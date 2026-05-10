const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/register', authController.registerOrganization);
router.post('/login', authController.login);
router.delete('/user/:username', auth, authController.deleteUserAccount);

module.exports = router;
