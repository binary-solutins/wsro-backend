const { validationResult } = require('express-validator');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createCompetition = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, level, date, venue, registration_deadline, maximum_teams, fees, rules } = req.body;

        await db.query(
            `INSERT INTO Competitions (name, level, date, venue, registration_deadline, maximum_teams, fees, rules)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, level, date, venue, registration_deadline, maximum_teams, fees, rules]
        );

        res.status(201).json({ message: 'Competition created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addRegion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { region_name, event_date, venue, competition_id } = req.body;

        await db.query(
            'INSERT INTO Regions (region_name, event_date, venue, competition_id) VALUES (?, ?, ?, ?)',
            [region_name, event_date, venue, competition_id]
        );

        res.status(201).json({ message: 'Regional event added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRegistrations = async (req, res) => {
    try {
        const [registrations] = await db.query(`
            SELECT 
                r.*, 
                c.name AS competition_name, 
                reg.region_name,
                r.leader_name,
                r.leader_email,
                r.leader_age,
                r.leader_school,
                r.leader_total_students,
                r.leader_address,
                r.leader_city,
                r.leader_state,
                r.leader_zipcode,
                r.leader_phone,
                r.coach_mentor_name,
                r.coach_mentor_organization,
                r.coach_mentor_phone,
                r.coach_mentor_email,
                r.member_names,
                r.member_ages,
                r.member_emails,
                r.member_phones,
                r.member_tshirt_sizes
            FROM Registrations r
            JOIN Competitions c ON r.competition_id = c.id
            LEFT JOIN Regions reg ON r.region_id = reg.id
        `);

        if (!registrations.length) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        res.status(200).json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.generateCertificate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { registration_id } = req.body;
        const certificateUrl = `${process.env.BASE_URL}/certificates/${uuidv4()}.pdf`;

        await db.query(
            'INSERT INTO Certificates (registration_id, certificate_url) VALUES (?, ?)',
            [registration_id, certificateUrl]
        );

        res.json({ certificate_url: certificateUrl });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.generateEventPass = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { registration_id } = req.body;
        const qrCode = uuidv4();
        const passUrl = `${process.env.BASE_URL}/passes/${qrCode}.pdf`;

        await db.query(
            'INSERT INTO EventPass (registration_id, pass_url, qr_code) VALUES (?, ?, ?)',
            [registration_id, passUrl, qrCode]
        );

        res.json({ pass_url: passUrl, qr_code: qrCode });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
