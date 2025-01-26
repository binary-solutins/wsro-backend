const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const { generateTeamCode } = require('../../utils/teamCodeGenerator');
const { sendCertificateEmail, generateCertificate } = require('../../utils/certificateService');
const upload = require('../config/s3');
const { sendRegistrationEmail } = require('../../utils/emailService');
const fs = require('fs').promises;

module.exports = {
    getCompetitions: async (req, res) => {
        try {
            const { event_id } = req.query;

            let query = `
            SELECT c.*, 
              (SELECT COUNT(*) FROM Regions r WHERE r.competition_id = c.id) as regions_count
            FROM Competitions c
        `;

            const queryParams = [];

            if (event_id) {
                query += ` WHERE c.event_id = ?`;
                queryParams.push(event_id);
            }

            const [competitions] = await db.query(query, queryParams);

            res.json(competitions);
        } catch (error) {
            console.error('Error fetching competitions:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    createCompetition: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            event_id,
            name,
            level,
            date,
            venue,
            registration_deadline,
            maximum_teams,
            fees,
            rules,
            age_group,
            is_active = true,
        } = req.body;

        const pdf_url = req?.files?.pdf?.[0]?.location;
        const zip_url = req?.files?.zip?.[0]?.location;

        try {
            const [event] = await db.query('SELECT * FROM Events WHERE id = ?', [event_id]);
            if (!event.length) {
                return res.status(404).json({ message: 'Event not found' });
            }

            await db.query(
                `INSERT INTO Competitions 
              (event_id, name, level, date, venue, registration_deadline, maximum_teams, fees, rules, pdf_url, zip_url, age_group, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event_id,
                    name,
                    level,
                    date,
                    venue,
                    registration_deadline,
                    maximum_teams,
                    fees,
                    rules,
                    pdf_url,
                    zip_url,
                    age_group,
                    is_active,
                ]
            );

            res.status(201).json({ message: 'Competition created successfully' });
        } catch (error) {
            console.error('Error creating competition:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    updateCompetition: async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin rights required.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const [competition] = await db.query(
                'SELECT * FROM Competitions WHERE id = ?',
                [req.params.id]
            );

            if (competition.length === 0) {
                return res.status(404).json({ message: 'Competition not found' });
            }

            const updates = [];
            const values = [];
            const allowedFields = [
                'name', 'level', 'date', 'venue', 'registration_deadline', 'maximum_teams', 'fees', 'rules', 'age_group', 'is_active'
            ];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(req.body[field]);
                }
            });

            if (req.files?.pdf?.[0]) {
                updates.push('pdf_url = ?');
                values.push(req.files.pdf[0].location);
            }
            if (req.files?.zip?.[0]) {
                updates.push('zip_url = ?');
                values.push(req.files.zip[0].location);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No valid fields to update' });
            }

            values.push(req.params.id);
            await db.query(`UPDATE Competitions SET ${updates.join(', ')} WHERE id = ?`, values);

            res.json({ message: 'Competition updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    deleteCompetition: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin rights required.' });
            }

            await db.query('DELETE FROM Registrations WHERE competition_id = ?', [req.params.id]);

            const [result] = await db.query('DELETE FROM Competitions WHERE id = ?', [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Competition not found' });
            }

            res.json({ message: 'Competition deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    registerForCompetition: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            competition_id,
            team_name,
            leader_name,
            leader_email,
            leader_age,
            leader_school,
            leader_total_students,
            leader_address,
            leader_city,
            leader_state,
            leader_zipcode,
            leader_phone,
            coach_mentor_name,
            coach_mentor_organization,
            coach_mentor_phone,
            coach_mentor_email,
            member_names,
            member_ages,
            member_emails,
            member_phones,
            member_tshirt_sizes,
            event_id,
        } = req.body;

        try {
            const [competition] = await db.query(
                `SELECT * FROM Competitions 
             WHERE id = ? AND registration_deadline >= CURDATE()`,
                [competition_id]
            );

            if (!competition.length) {
                return res.status(404).json({ message: 'Competition not found or registration deadline has passed' });
            }

            const [existingTeam] = await db.query(
                'SELECT id FROM Registrations WHERE competition_id = ? AND event_id = ? AND team_name = ?',
                [competition_id, event_id, team_name]
            );

            if (existingTeam.length) {
                return res.status(400).json({ message: 'Team name already exists for this competition' });
            }

            const allEmails = [leader_email, ...member_emails];
            const [existingEmails] = await db.query(
                `SELECT leader_email, 
                    JSON_UNQUOTE(JSON_EXTRACT(member_emails, CONCAT('$[', jt.i, ']'))) AS member_email
             FROM Registrations
             CROSS JOIN JSON_TABLE(
                 member_emails, '$[*]'
                 COLUMNS (i FOR ORDINALITY, member_email VARCHAR(255) PATH '$')
             ) jt
             WHERE competition_id = ? AND (
                 leader_email IN (?) OR 
                 JSON_UNQUOTE(JSON_EXTRACT(member_emails, CONCAT('$[', jt.i, ']'))) IN (?)
             )`,
                [competition_id, allEmails, allEmails]
            );

            if (existingEmails.length > 0) {
                return res.status(400).json({
                    message: 'One or more email addresses already exist for this competition.',
                    existingEmails: existingEmails.map(email => email.leader_email || email.member_email),
                });
            }

            const team_code = generateTeamCode(competition_id);

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                const [result] = await connection.query(
                    `INSERT INTO Registrations (
        competition_id, event_id, team_code, team_name, leader_name, leader_email, leader_age, leader_school, 
        leader_total_students, leader_address, leader_city, leader_state, leader_zipcode, leader_phone, 
        coach_mentor_name, coach_mentor_organization, coach_mentor_phone, coach_mentor_email, 
        member_names, member_ages, member_emails, member_phones, member_tshirt_sizes, 
        participant_id, status, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
                    [
                        competition_id,
                        event_id,
                        team_code,
                        team_name,
                        leader_name,
                        leader_email,
                        leader_age,
                        leader_school,
                        leader_total_students,
                        leader_address,
                        leader_city,
                        leader_state,
                        leader_zipcode,
                        leader_phone,
                        coach_mentor_name,
                        coach_mentor_organization,
                        coach_mentor_phone,
                        coach_mentor_email,
                        JSON.stringify(member_names),
                        JSON.stringify(member_ages),
                        JSON.stringify(member_emails),
                        JSON.stringify(member_phones),
                        JSON.stringify(member_tshirt_sizes),
                        `${team_code}-P00`,
                    ]
                );

                const participant_ids = member_names.map((_, index) =>
                    `${team_code}-P${(index + 1).toString().padStart(2, '0')}`
                );

                await connection.query('UPDATE Registrations SET participant_id = ? WHERE id = ?', [
                    JSON.stringify(participant_ids),
                    result.insertId,
                ]);

                await connection.commit();

                const members = member_names.map((name, index) => ({
                    name,
                    email: member_emails[index],
                }));

                await sendRegistrationEmail(
                    leader_email,
                    team_name,
                    team_code,
                    competition[0].name,
                    members
                );

                res.status(201).json({
                    message: 'Registration successful',
                    team_code,
                    participant_ids,
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    sendBulkCertificates: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { competitionId, participants } = req.body;

        const [competition] = await db.query('SELECT name FROM Competitions WHERE id = ?', [competitionId]);

        if (!competition[0]) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        const results = [];
        const failed = [];

        for (const participant of participants) {
            try {
                const certificateId = `CERT-${competitionId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                const certificatePath = await generateCertificate({
                    name: participant.name,
                    competitionName: competition[0].name,
                    position: participant.position,
                    certificateId,
                });

                await sendCertificateEmail({
                    email: participant.email,
                    name: participant.name,
                    competitionName: competition[0].name,
                    certificatePath,
                    certificateId,
                });

                await db.query(
                    `INSERT INTO Certificates (
            competition_id, participant_name, participant_email,
            certificate_id, position, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        competitionId,
                        participant.name,
                        participant.email,
                        certificateId,
                        participant.position,
                    ]
                );

                await fs.unlink(certificatePath);

                results.push({
                    email: participant.email,
                    name: participant.name,
                    status: 'success',
                    certificateId,
                });
            } catch (error) {
                failed.push({
                    email: participant.email,
                    name: participant.name,
                    error: error.message,
                });
            }
        }

        res.status(200).json({
            message: 'Certificate generation and sending completed',
            successful: results,
            failed: failed,
        });
    },

    sendTeamCertificates: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { team_codes } = req.body;

        if (!Array.isArray(team_codes) || team_codes.length === 0) {
            return res.status(400).json({ message: 'team_codes should be a non-empty array' });
        }

        const results = [];
        const failed = [];

        try {
            for (const team_code of team_codes) {
                try {
                    const [teams] = await db.query(
                        `SELECT r.team_name, r.leader_email, r.member_emails, c.name AS competition_name 
                     FROM Registrations r
                     JOIN Competitions c ON r.competition_id = c.id
                     WHERE r.team_code = ?`,
                        [team_code]
                    );

                    if (teams.length === 0) {
                        failed.push({
                            team_code,
                            error: 'No teams found with the given team code',
                        });
                        continue;
                    }

                    const team = teams[0];
                    const { team_name, leader_email, member_emails, competition_name } = team;

                    let memberEmails = [];
                    try {
                        memberEmails = JSON.parse(member_emails) || [];
                    } catch (e) {
                        failed.push({
                            team_code,
                            error: 'Invalid member_emails format in database',
                        });
                        continue;
                    }

                    const allEmails = [leader_email, ...memberEmails];

                    for (const email of allEmails) {
                        const certificateId = `CERT-${team_code}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

                        try {
                            const certificatePath = await generateCertificate({
                                name: team_name,
                                competitionName: competition_name,
                                position: email === leader_email ? 'Team Leader' : 'Team Member',
                                certificateId,
                            });

                            await sendCertificateEmail({
                                email,
                                name: team_name,
                                competitionName: competition_name,
                                certificatePath,
                                certificateId,
                            });

                            await fs.unlink(certificatePath);

                            results.push({
                                email,
                                team_code,
                                team_name,
                                status: 'success',
                                certificateId,
                            });
                        } catch (error) {
                            failed.push({
                                email,
                                team_code,
                                team_name,
                                error: error.message,
                            });
                        }
                    }
                } catch (error) {
                    failed.push({
                        team_code,
                        error: error.message,
                    });
                }
            }

            res.status(200).json({
                message: 'Certificate processing completed',
                successful: results,
                failed,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};
