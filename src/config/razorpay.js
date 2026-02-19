const Razorpay = require('razorpay');
require('dotenv').config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Connectivity Check: Attempt to fetch payments (limit 1) to verify credentials
(async () => {
    try {
        // Just a lightweight check to see if credentials are valid
        // Using payments.all with small count
        await instance.orders.all({ count: 1 });
        console.log("✅ Razorpay Connected Successfully!");
    } catch (error) {
        console.error("❌ Razorpay Connection Failed:", error.message);
        // We do not exit process here, as app might still run other parts, 
        // but payment will fail.
    }
})();

module.exports = instance;
