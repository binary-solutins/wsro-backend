const db = require('../config/database');

const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
};

exports.getAllInquiries = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Inquiry');
        res.status(200).json(results);
    } catch (error) {
        handleError(res, error);
    }
};

exports.getInquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await db.query('SELECT * FROM Inquiry WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json(results[0]);
    } catch (error) {
        handleError(res, error);
    }
};

exports.createInquiry = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const [results] = await db.query('INSERT INTO Inquiry (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
        res.status(201).json({ message: 'Inquiry created', id: results.insertId });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, message, is_resolved } = req.body;
        const [results] = await db.query(
            'UPDATE Inquiry SET name = ?, email = ?, message = ?, is_resolved = ? WHERE id = ?',
            [name, email, message, is_resolved, id]
        );
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json({ message: 'Inquiry updated' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await db.query('DELETE FROM Inquiry WHERE id = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json({ message: 'Inquiry deleted' });
    } catch (error) {
        handleError(res, error);
    }
};
