const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const competitionController = require('../controller/competitionController');
const upload = require('../config/s3');
const multer = require('multer');
const uploads = multer({ storage: multer.memoryStorage() });
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.70/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

router.get('/', competitionController.getCompetitions);
router.get('/all', competitionController.getCompetitionsAll);
router.post('/delete', competitionController.toggleCompetitionIsDeleted); // Route to get all competitions.  Example curl -X GET "http://localhost:3000/api/competitions/all?event_id=123"

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
router.post('/generate-iran', competitionController.generateIranCertificates);
router.get('/getall-iran', competitionController.getAllIranRegistrations);

router.post('/send-certificates', [
  auth,
], competitionController.sendBulkCertificates);

router.post('/sent-team-certificates', auth, competitionController.sendTeamCertificates);

router.post('/resend-email', competitionController.resendEventPassEmail);

// Add multer for file upload


router.post('/bulk-register', uploads.single('excel'), competitionController.bulkRegisterForCompetition);


module.exports = router;
