const razorpayInstance = require('../config/razorpay');
const crypto = require('crypto');
const db = require('../config/database');

exports.createOrder = async (req, res) => {
    try {
        console.log("📝 [Razorpay] Create Order Request Body:", req.body);

        if (!req.body.amount) {
            console.error("❌ [Razorpay] Amount is missing in request body");
            return res.status(400).json({ message: "Amount is required" });
        }

        const options = {
            amount: req.body.amount * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: crypto.randomBytes(16).toString("hex"),
            payment_capture: 0
        };

        console.log("⚙️ [Razorpay] Creating order with options:", JSON.stringify(options));

        const order = await razorpayInstance.orders.create(options);

        console.log("✅ [Razorpay] Order created successfully:", order);

        if (!order) return res.status(500).send("Some error occured");

        res.status(200).json(order);
    } catch (error) {
        console.error("❌ [Razorpay] Create Order Failed:");
        console.error("Error Message:", error.message);
        console.error("Full Error:", JSON.stringify(error, null, 2));

        res.status(500).json({
            message: "Something went wrong",
            error: error.message,
            details: error
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        console.log("📝 [Razorpay] Verify Payment Request Body:", req.body);

        const {
            orderCreationId,
            razorpayPaymentId,
            razorpaySignature,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Simplify: use whatever is available
        const orderId = orderCreationId || razorpay_order_id;
        const paymentId = razorpayPaymentId || razorpay_payment_id;
        const signature = razorpaySignature || razorpay_signature;

        if (!orderId || !paymentId || !signature) {
            console.error("❌ [Razorpay] Missing required payment details");
            return res.status(400).json({ message: "Missing required payment details" });
        }

        const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${orderId}|${paymentId}`);
        const digest = shasum.digest("hex");

        console.log(`🔐 [Razorpay] verification: generated=${digest}, received=${signature}`);

        if (digest !== signature) {
            console.error("❌ [Razorpay] Signature mismatch! Transaction not legit.");
            return res.status(400).json({ message: "Transaction not legit!" });
        }

        console.log("✅ [Razorpay] Signature matched. Payment verified.");

        // Payment is legit, update the database
        // We assume 'orderId' corresponds to 'payment_id' in Registrations table.
        // If the frontend sends 'razorpay_order_id' which matches the 'id' from createOrder response.

        // 1. Update Registration status
        const [updateResult] = await db.query(
            "UPDATE Registrations SET payment_status = 'paid', status = 'confirmed' WHERE payment_id = ?",
            [orderId]
        );

        if (updateResult.affectedRows === 0) {
            console.warn(`⚠️ [Razorpay] Payment verified for order ${orderId} but no registration found to update.`);
            // Even if DB update fails to find a record, valid payment signatures should strictly be treated with care.
            // But for the API response, we might still want to say success or warn.
        } else {
            console.log(`✅ [Razorpay] Registration updated for payment_id: ${orderId}`);

            // 2. Insert into Payments table for record keeping
            const [rows] = await db.query("SELECT id FROM Registrations WHERE payment_id = ?", [orderId]);
            if (rows.length > 0) {
                const registrationId = rows[0].id;
                await db.query(
                    "INSERT INTO Payments (registration_id, amount, transaction_id, status) VALUES (?, ?, ?, ?)",
                    [registrationId, 0, paymentId, 'success']
                );
                console.log(`✅ [Razorpay] Payment record inserted for registration ID: ${registrationId}`);
            }
        }

        res.status(200).json({
            message: "success",
            orderId: orderId,
            paymentId: paymentId,
        });
    } catch (error) {
        console.error("❌ [Razorpay] Error in verifyPayment:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};