const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');

// Rate limiting za login i registraciju
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 20, // max 20 pokušaja po IP adresi
  message: { message: 'Previše pokušaja sa ove IP adrese. Molimo pokušajte ponovo za 15 minuta.' }
});

const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('Korisničko ime mora imati najmanje 3 karaktera.'),
  body('password').isLength({ min: 8 }).withMessage('Lozinka mora imati najmanje 8 karaktera.'),
  body('organizationName').trim().notEmpty().withMessage('Naziv organizacije je obavezan.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  }
];

router.post('/register', authLimiter, validateRegister, authController.registerOrganization);
router.post('/login', authLimiter, authController.login);
router.get('/me', auth, authController.getMe);
router.delete('/user/:username', auth, authController.deleteUserAccount);

module.exports = router;
