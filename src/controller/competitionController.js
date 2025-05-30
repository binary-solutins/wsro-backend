const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { auth } = require("../middleware/auth");
const { generateTeamCode } = require("../../utils/teamCodeGenerator");
const {
  sendCertificateEmail,
  generateCertificate,
} = require("../../utils/certificateService");
const upload = require("../config/s3");
const { sendRegistrationEmail, sendParticipantEmail, sendTeamSummaryEmail } = require("../../utils/emailService");
const fs = require("fs").promises;

module.exports = {
  getCompetitions: async (req, res) => {
    try {
      const { event_id } = req.query;

      let query = `
            SELECT c.*, 
              (SELECT COUNT(*) FROM Regions r WHERE r.competition_id = c.id) as regions_count
            FROM Competitions c 
            WHERE c.is_deleted = 0
        `;

      const queryParams = [];

      if (event_id) {
        query += ` AND c.event_id = ?`;
        queryParams.push(event_id);
      }

      const [competitions] = await db.query(query, queryParams);

      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getCompetitionsAll: async (req, res) => {
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
      console.error("Error fetching all competitions:", error);
      res.status(500).json({ message: "Server error", error: error.message });
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
      const [event] = await db.query("SELECT * FROM Events WHERE id = ?", [
        event_id,
      ]);
      if (!event.length) {
        return res.status(404).json({ message: "Event not found" });
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

      res.status(201).json({ message: "Competition created successfully" });
    } catch (error) {
      console.error("Error creating competition:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  updateCompetition: async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin rights required." });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const [competition] = await db.query(
        "SELECT * FROM Competitions WHERE id = ?",
        [req.params.id]
      );

      if (competition.length === 0) {
        return res.status(404).json({ message: "Competition not found" });
      }

      const updates = [];
      const values = [];
      const allowedFields = [
        "name",
        "level",
        "date",
        "venue",
        "registration_deadline",
        "maximum_teams",
        "fees",
        "rules",
        "age_group",
        "is_active",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      });

      if (req.files?.pdf?.[0]) {
        updates.push("pdf_url = ?");
        values.push(req.files.pdf[0].location);
      }
      if (req.files?.zip?.[0]) {
        updates.push("zip_url = ?");
        values.push(req.files.zip[0].location);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      values.push(req.params.id);
      await db.query(
        `UPDATE Competitions SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      res.json({ message: "Competition updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  deleteCompetition: async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Admin rights required." });
      }

      await db.query("DELETE FROM Registrations WHERE competition_id = ?", [
        req.params.id,
      ]);

      const [result] = await db.query("DELETE FROM Competitions WHERE id = ?", [
        req.params.id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Competition not found" });
      }

      res.json({ message: "Competition deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
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
      coach_mentor_name,
      coach_mentor_organization,
      coach_mentor_phone,
      coach_mentor_email,
      member_names,
      member_ages,
      member_emails,
      member_phones,
      member_states,      
      member_cities,      
      member_zipcodes,    
      member_institutions,
      event_id,
      no_of_students,
    } = req.body;
  
    if (!member_names || !Array.isArray(member_names) || member_names.length === 0) {
      return res.status(400).json({ message: "Member names are required" });
    }
    if (!member_emails || !Array.isArray(member_emails) || member_emails.length === 0) {
      return res.status(400).json({ message: "Member emails are required" });
    }
    if (!member_ages || !Array.isArray(member_ages) || member_ages.length === 0) {
      return res.status(400).json({ message: "Member ages are required" });
    }
    if (!member_phones || !Array.isArray(member_phones) || member_phones.length === 0) {
      return res.status(400).json({ message: "Member phones are required" });
    }
    if (!member_institutions || !Array.isArray(member_institutions) || member_institutions.length === 0) {
      return res.status(400).json({ message: "Member institutions are required" });
    }
    if (no_of_students === undefined || isNaN(parseInt(no_of_students))) {
      return res.status(400).json({ message: "Number of students is required and must be a number" });
    }
  
    const memberCount = member_names.length;
    if (
      member_emails.length !== memberCount ||
      member_ages.length !== memberCount ||
      member_phones.length !== memberCount ||
      member_institutions.length !== memberCount
    ) {
      return res.status(400).json({
        message: "All member information arrays must have the same length",
      });
    }
  
    try {
      const [competition] = await db.query(
        `SELECT * FROM Competitions
         WHERE id = ? AND registration_deadline >= CURDATE()`,
        [competition_id]
      );
  
      if (!competition || !competition.length) {
        return res.status(404).json({
          message: "Competition not found or registration closed",
        });
      }
  
      const [existingTeam] = await db.query(
        "SELECT id FROM Registrations WHERE competition_id = ? AND team_name = ?",
        [competition_id, team_name]
      );
  
      if (existingTeam && existingTeam.length) {
        return res.status(400).json({
          message: "Team name already exists for this competition",
        });
      }
  
      const [event] = await db.query("SELECT title FROM Events WHERE id = ?", [
        event_id,
      ]);
  
      if (!event || !event.length) {
        return res.status(404).json({
          message: "Event not found",
        });
      }
  
      const team_code = generateTeamCode(
        event[0].title,
        competition[0].name,
        competition_id
      );
  
      const connection = await db.getConnection();
      await connection.beginTransaction();
  
      try {
        const participant_id = member_names.map(
          (_, i) => `${team_code}-P${i.toString().padStart(2, "0")}`
        );
  
        const [result] = await connection.query(
          `INSERT INTO Registrations (
            competition_id, event_id, team_code, team_name,
            coach_mentor_name, coach_mentor_organization,
            coach_mentor_phone, coach_mentor_email,
            member_names, member_ages, member_emails,
            member_phones, member_states, member_cities,
            member_zipcodes, member_institutions,
            no_of_students, participant_id, status, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
          [
            competition_id,
            event_id,
            team_code,
            team_name,
            coach_mentor_name,
            coach_mentor_organization,
            coach_mentor_phone,
            coach_mentor_email,
            JSON.stringify(member_names),
            JSON.stringify(member_ages),
            JSON.stringify(member_emails),
            JSON.stringify(member_phones),
            JSON.stringify(member_states),
            JSON.stringify(member_cities),
            JSON.stringify(member_zipcodes),
            JSON.stringify(member_institutions),
            no_of_students,
            JSON.stringify(participant_id),
          ]
        );
  
        await connection.commit();
  
        try {
          const membersList = member_names.map((name, index) => ({
            name: name,
            email: member_emails[index],
            participant_id: participant_id[index]
          }));
  
          await Promise.all(
            membersList.map(async (member) => {
              if (member.email) {
                await sendParticipantEmail({
                  email: member.email,
                  name: member.name,
                  team_name: team_name,
                  team_code: team_code,
                  participant_id: member.participant_id,
                  competition_name: competition[0].name,
                  event_name: event[0].title
                });
              }
            })
          );
        } catch (emailError) {
          console.error("Email sending error:", emailError);
        }
  
        res.status(201).json({
          message: "Registration successful",
          team_code,
          participant_id,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
  

  registerIranCompetition: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const entries = req.body;
  
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "Entries array is required" });
    }
  
    // Validate each entry
    for (const entry of entries) {
      if (!entry.full_name || !entry.school_institute || !entry.dob || 
          !entry.age || !entry.course_name_competition_category || !entry.grade_or_winning_rank) {
        return res.status(400).json({ message: "All fields are required for each entry" });
      }
      
      if (isNaN(entry.age) || entry.age < 1) {
        return res.status(400).json({ message: "Valid age is required" });
      }
    }
  
    const connection = await db.getConnection();
    await connection.beginTransaction();
  
    try {
      // Get and lock sequence
      const [seq] = await connection.query(
        'SELECT current_val FROM iran_certificate_sequence FOR UPDATE'
      );
      const currentVal = seq[0].current_val;
      const newVal = currentVal + entries.length;
  
      // Generate certificate IDs
      const entriesWithCertId = entries.map((entry, index) => {
        const sequenceNumber = currentVal + index + 1;
        return {
          ...entry,
          certificate_u_id: `IR/CR${sequenceNumber.toString().padStart(6, '0')}`
        };
      });
  
      // Update sequence
      await connection.query(
        'UPDATE iran_certificate_sequence SET current_val = ?',
        [newVal]
      );
  
      // Prepare bulk insert
      const values = entriesWithCertId.map(entry => [
        entry.full_name,
        entry.school_institute,
        entry.dob,
        entry.age,
        entry.course_name_competition_category,
        entry.grade_or_winning_rank,
        entry.certificate_u_id
      ]);
  
      await connection.query(
        `INSERT INTO iran_registrations 
        (full_name, school_institute, dob, age, course_name_competition_category, grade_or_winning_rank, certificate_u_id)
        VALUES ?`,
        [values]
      );
  
      await connection.commit();
  
      res.status(201).json({
        message: "Registrations added successfully",
        entries: entriesWithCertId.map(e => ({
          full_name: e.full_name,
          certificate_u_id: e.certificate_u_id
        }))
      });
    } catch (error) {
      await connection.rollback();
      console.error("Registration Error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  getIranRegistrationByCertificateId: async (req, res) => {
    const { certificate_u_id } = req.body;
  
    if (!certificate_u_id) {
      return res.status(400).json({ message: "certificate_u_id is required" });
    }
  
    try {
      const [result] = await db.query(
        `SELECT 
          id,
          full_name,
          school_institute,
          DATE_FORMAT(dob, '%Y-%m-%d') as dob,
          age,
          course_name_competition_category,
          grade_or_winning_rank,
          certificate_u_id
        FROM iran_registrations
        WHERE certificate_u_id = ?`,
        [certificate_u_id]
      );
  
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Registration not found" });
      }
  
      res.status(200).json({
        message: "Registration details retrieved successfully",
        data: result[0]
      });
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  },

  getAllIranRegistrations: async (req, res) => {
    try {
      // Get pagination parameters from query (default to page 1, 20 items per page)
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
  
      // Get optional filters
      const { search, sort_by = 'id', sort_order = 'DESC' } = req.query;
  
      // Base query
      let query = `
        SELECT 
          id,
          full_name,
          school_institute,
          DATE_FORMAT(dob, '%Y-%m-%d') as dob,
          age,
          course_name_competition_category,
          grade_or_winning_rank,
          certificate_u_id
        FROM iran_registrations
      `;
  
      // Add search filter if provided
      const params = [];
      if (search) {
        query += ` WHERE 
          full_name LIKE ? OR 
          school_institute LIKE ? OR 
          course_name_competition_category LIKE ? OR 
          certificate_u_id LIKE ?`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
  
      // Add sorting
      const validSortColumns = ['id', 'full_name', 'age', 'dob', 'certificate_u_id'];
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'id';
      const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${order}`;
  
      // Add pagination
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
  
      // Execute query
      const [registrations] = await db.query(query, params);
  
      // Get total count for pagination info
      let countQuery = `SELECT COUNT(*) as total FROM iran_registrations`;
      if (search) {
        countQuery += ` WHERE 
          full_name LIKE ? OR 
          school_institute LIKE ? OR 
          course_name_competition_category LIKE ? OR 
          certificate_u_id LIKE ?`;
      }
      const [totalResult] = await db.query(countQuery, search ? 
        [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []);
  
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
  
      res.status(200).json({
        message: "Registrations retrieved successfully",
        data: registrations,
        pagination: {
          current_page: page,
          per_page: limit,
          total_records: total,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  },

  sendBulkCertificates: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { competitionId, participants } = req.body;

    const [competition] = await db.query(
      "SELECT name FROM Competitions WHERE id = ?",
      [competitionId]
    );

    if (!competition[0]) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const results = [];
    const failed = [];

    for (const participant of participants) {
      try {
        const certificateId = `CERT-${competitionId}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 4)}`;
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
          status: "success",
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
      message: "Certificate generation and sending completed",
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
      return res
        .status(400)
        .json({ message: "team_codes should be a non-empty array" });
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
              error: "No teams found with the given team code",
            });
            continue;
          }

          const team = teams[0];
          const { team_name, leader_email, member_emails, competition_name } =
            team;

          let memberEmails = [];
          try {
            memberEmails = JSON.parse(member_emails) || [];
          } catch (e) {
            failed.push({
              team_code,
              error: "Invalid member_emails format in database",
            });
            continue;
          }

          const allEmails = [leader_email, ...memberEmails];

          for (const email of allEmails) {
            const certificateId = `CERT-${team_code}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 4)}`;

            try {
              const certificatePath = await generateCertificate({
                name: team_name,
                competitionName: competition_name,
                position:
                  email === leader_email ? "Team Leader" : "Team Member",
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
                status: "success",
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
        message: "Certificate processing completed",
        successful: results,
        failed,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

   resendEventPassEmail: async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email } = req.body;
  
    try {
      // Find all registrations where this email exists in member_emails
      const [registrations] = await db.query(
        `SELECT r.*, c.name as competition_name, e.title as event_name 
         FROM Registrations r
         JOIN Competitions c ON r.competition_id = c.id
         JOIN Events e ON r.event_id = e.id
         WHERE JSON_CONTAINS(r.member_emails, ?)`,
        [JSON.stringify(email)]
      );
  
      if (!registrations || registrations.length === 0) {
        return res.status(404).json({
          message: "No registrations found for this email address"
        });
      }
  
      // Track which teams the participant is part of for response
      const teamResults = [];
  
      // Process each registration
      for (const registration of registrations) {
        // Parse JSON fields
        const memberNames = JSON.parse(registration.member_names);
        const memberEmails = JSON.parse(registration.member_emails);
        const participantIds = JSON.parse(registration.participant_id);
        
        // Find the participant's index in this team
        const participantIndex = memberEmails.findIndex(memberEmail => 
          memberEmail.toLowerCase() === email.toLowerCase()
        );
        
        if (participantIndex !== -1) {
          // Get participant details
          const name = memberNames[participantIndex];
          const participant_id = participantIds[participantIndex];
          
          // Send email to the participant
          await sendParticipantEmail({
            email,
            name,
            team_name: registration.team_name,
            team_code: registration.team_code,
            participant_id,
            competition_name: registration.competition_name,
            event_name: registration.event_name
          });
          
          teamResults.push({
            team_name: registration.team_name,
            team_code: registration.team_code,
            participant_id,
            competition_name: registration.competition_name
          });
        }
      }
  
      // Return success response
      res.status(200).json({
        message: "Event pass email(s) resent successfully",
        teams: teamResults
      });
      
    } catch (error) {
      console.error("Error resending event pass email:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
   },

  toggleCompetitionIsDeleted: async (req, res) => {
    const { competition_id } = req.body;

    if (!competition_id) {
      return res.status(400).json({ message: "Competition ID is required" });
    }

    try {
      const [competition] = await db.query(
        "SELECT is_deleted FROM Competitions WHERE id = ?",
        [competition_id]
      );

      if (!competition || competition.length === 0) {
        return res.status(404).json({ message: "Competition not found" });
      }

      const currentIsDeleted = competition[0].is_deleted;
      const newIsDeleted = currentIsDeleted === 0 ? 1 : 0;

      await db.query(
        "UPDATE Competitions SET is_deleted = ? WHERE id = ?",
        [newIsDeleted, competition_id]
      );

      res.status(200).json({
        message: "Competition is_deleted status toggled successfully",
        is_deleted: newIsDeleted,
      });
    } catch (error) {
      console.error(
        "Error toggling competition is_deleted status:",
        error
      );
      res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  },
};
