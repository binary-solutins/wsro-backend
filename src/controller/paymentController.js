const Razorpay = require('razorpay');
const crypto = require('crypto');

exports.createOrder = async (req, res) => {
    const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const options = {
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: crypto.randomBytes(16).toString("hex"),
        payment_capture: 0
    };
    try {
        const order = await instance.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

exports.verifyPayment = async (req, res) => {
    const {
        orderCreationId,
        razorpayPaymentId,
        razorpaySignature
    } = req.body;
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");
    if (digest !== razorpaySignature)
        return res.status(400).json({ message: "Transaction not legit!" });
    res.status(200).json({ message: "Payment successful" });
};