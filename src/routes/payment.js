const router = require('express').Router();

const {
    createOrder,
    verifyPayment,
} = require('../controller/paymentController');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;