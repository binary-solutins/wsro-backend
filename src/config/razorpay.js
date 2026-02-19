const Razorpay = require('razorpay');
require('dotenv').config();

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.error("❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in environment variables.");
}

const instance = new Razorpay({
    key_id: key_id || "test_key_id", // Fallback to prevent crash on init, but payment will fail
    key_secret: key_secret || "test_key_secret"
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
