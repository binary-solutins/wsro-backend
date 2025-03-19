const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const eventController = require('../controller/eventsController');

router.get('/', eventController.getAllEvents);

router.get('/level/:level', eventController.getEventsByLevel);

router.post(
    '/new',
    [
        auth,
        body('title').notEmpty().withMessage('Title is required'),
        body('level')
            .notEmpty()
            .withMessage('Level is required')
            .isIn(['regional', 'national', 'international', 'startup-award'])
            .withMessage('Invalid level value'),
    ],
    eventController.createEvent
);

router.put(
    '/:id',
    [
        auth,
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('level')
            .optional()
            .isIn(['regional', 'national', 'international', 'startup-award'])
            .withMessage('Invalid level value'),
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format (ISO 8601 required)'),
        body('venue').optional().notEmpty().withMessage('Venue cannot be empty'),
    ],
    eventController.updateEvent
);

router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;
