const express = require('express');
const { body } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controller/adminController');

const router = express.Router();

router.post(
  '/competitions',
  adminAuth,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('level').isIn(['Regional', 'National', 'International']).withMessage('Invalid level'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('registration_deadline').isISO8601().withMessage('Invalid registration deadline'),
    body('maximum_teams').isInt({ min: 0 }).withMessage('Maximum teams must be non-negative'),
    body('fees').isFloat({ min: 0 }).withMessage('Fees must be non-negative'),
    body('rules').notEmpty().withMessage('Rules are required'),
  ],
  adminController.createCompetition
);

router.post(
  '/regions',
  adminAuth,
  [
    body('region_name').notEmpty().withMessage('Region name is required'),
    body('event_date').isISO8601().withMessage('Invalid date format'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('competition_id').isInt().withMessage('Competition ID must be an integer'),
  ],
  adminController.addRegion
);

router.get('/registrations', adminController.getRegistrations);

router.post(
  '/certificates',
  adminAuth,
  [body('registration_id').isInt().withMessage('Registration ID must be an integer')],
  adminController.generateCertificate
);

router.post(
  '/event-pass',
  adminAuth,
  [body('registration_id').isInt().withMessage('Registration ID must be an integer')],
  adminController.generateEventPass
);

module.exports = router;