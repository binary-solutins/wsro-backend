const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controller/authController');
const { auth } = require('../middleware/auth');
const { resendEventPassEmail } = require('../controller/competitionController');

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['admin', 'customer']).withMessage('Invalid role')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
], authController.login);

router.get('/profile', auth, authController.profile);

router.get('/reset-password', authController.updatePassword);

router.post('/check-email', [
  body('emails').isArray().withMessage('Emails must be an array'),
  body('competition_id').notEmpty().withMessage('Competition ID is required'),
  body('team_name').notEmpty().withMessage('Team name is required')
], authController.checkEmailExists);

router.post('/resend-email', resendEventPassEmail);


module.exports = router;
