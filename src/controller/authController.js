const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

exports.register = async (req, res) => {
    try {
        console.log('📝 Processing registration request:', req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [existingUser] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            console.log('❌ Email already exists:', email);
            return res.status(400).json({ message: 'Email already exists' });
        }

        const [result] = await db.query(
            'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        console.log('✅ User registered successfully:', { id: result.insertId, email });
        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        console.log('🔑 Processing login request for:', req.body.email);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Login validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('❌ Invalid login attempt - user not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Invalid login attempt - wrong password:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log('✅ User logged in successfully:', { id: user.id, email: user.email });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.profile = async (req, res) => {
    try {
        console.log('👤 Fetching profile for user:', req.user.id);
        const [users] = await db.query(
            'SELECT id, name, email, role, created_at FROM Users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            console.log('❌ Profile not found for user:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('✅ Profile fetched successfully for user:', req.user.id);
        res.json(users[0]);
    } catch (error) {
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, currentPassword, newPassword } = req.body;

        const [users] = await db.query('SELECT * FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await db.query('UPDATE Users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('❌ Error updating password:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

exports.checkEmailExists = async (req, res) => {
    try {
        const { emails, competition_id, team_name } = req.body;

        // Validate input
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            console.log('❌ Invalid input format for emails');
            return res.status(400).json({ message: 'Invalid input format for emails' });
        }

        if (!competition_id) {
            console.log('❌ Competition ID is required');
            return res.status(400).json({ message: 'Competition ID is required' });
        }

        if (!team_name) {
            console.log('❌ Team name is required');
            return res.status(400).json({ message: 'Team name is required' });
        }

        // Query to check emails and team_name separately
        const [existingRecords] = await db.query(
            `SELECT DISTINCT 
                JSON_UNQUOTE(JSON_EXTRACT(r.member_emails, CONCAT('$[', jt.i, ']'))) AS member_email, 
                r.leader_email,
                r.team_name
             FROM Registrations r
             CROSS JOIN JSON_TABLE(
                 r.member_emails, '$[*]' 
                 COLUMNS (i FOR ORDINALITY, member_emails VARCHAR(255) PATH '$')
             ) jt
             WHERE r.competition_id = ? AND (
                 r.leader_email IN (?) OR 
                 JSON_UNQUOTE(JSON_EXTRACT(r.member_emails, CONCAT('$[', jt.i, ']'))) IN (?) OR
                 r.team_name = ?
             )`,
            [competition_id, emails, emails, team_name]
        );

        const [teamNameRecords] = await db.query(
            `SELECT team_name FROM Registrations WHERE competition_id = ? AND team_name = ?`,
            [competition_id, team_name]
        );

        if (teamNameRecords.length > 0) {
            return res.status(200).json({
                exists: true,
                message: 'Team name already exists',
                team_names: [team_name]
            });
        }

        if (existingRecords.length > 0) {
            // Collect all unique emails using a Set
            const foundEmails = Array.from(
                new Set([
                    ...existingRecords.map(entry => entry.leader_email),
                    ...existingRecords.map(entry => entry.member_email)
                ])
            ).filter(Boolean);

            const foundTeamNames = Array.from(
                new Set(existingRecords.map(entry => entry.team_name))
            ).filter(Boolean);

            return res.status(200).json({
                exists: true,
                emails: foundEmails,
                message: 'Some emails already exist'
            });
        }

        return res.status(404).json({ exists: false, message: 'None of the emails or team names exist for this competition' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
