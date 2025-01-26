const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const router = express.Router();
dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_0csZrzRUR87k64',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'Woj9fs8GdWcg66bQFgkDwk3a',
});

// Route to create an order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
      notes,
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.message,
    });
  }
});

// Route to verify payment
router.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        details: {
          order_id: !razorpay_order_id ? "missing" : "present",
          payment_id: !razorpay_payment_id ? "missing" : "present",
          signature: !razorpay_signature ? "missing" : "present"
        }
      });
    }

    // Create signature verification data
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Generate signature
    const expectedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(body.toString())
      .digest("hex");

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        details: "Signature mismatch"
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

module.exports = router;