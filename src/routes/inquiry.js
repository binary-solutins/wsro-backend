const express = require('express');
const router = express.Router();
const inquiryController = require('../controller/inquiryController');

router.get('/', inquiryController.getAllInquiries);
router.get('/:id', inquiryController.getInquiryById);
router.post('/', inquiryController.createInquiry);
router.put('/:id', inquiryController.updateInquiry);
router.delete('/:id', inquiryController.deleteInquiry);

module.exports = router;
