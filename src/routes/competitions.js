
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const competitionController = require('../controller/competitionController');
const upload = require('../config/s3');

router.get('/', competitionController.getCompetitions);

router.post(
  '/new',
  upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'zip', maxCount: 1 }]),
  [body('name').notEmpty().withMessage('Name is required')],
  competitionController.createCompetition
);

router.put(
  '/:id',
  [
    auth,
    upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'zip', maxCount: 1 }]),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  ],
  competitionController.updateCompetition
);

router.delete('/:id', auth, competitionController.deleteCompetition);

router.post('/register', competitionController.registerForCompetition);

router.post('/register-iran', competitionController.registerIranCompetition);
router.post('/get-iran', competitionController.getIranRegistrationByCertificateId);

router.get('/getall-iran', competitionController.getAllIranRegistrations);

router.post('/send-certificates', [
  auth,
], competitionController.sendBulkCertificates);

router.post('/sent-team-certificates', auth, competitionController.sendTeamCertificates);

router.post('/resend-email', competitionController.resendEventPassEmail);

module.exports = router;
