const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { auth } = require("../middleware/auth");
const { generateTeamCode } = require("../../utils/teamCodeGenerator");
const {
  sendCertificateEmail,
  generateCertificate,
} = require("../../utils/certificateService");
const XLSX = require('xlsx');
const upload = require("../config/s3");
const path = require('path');
const { sendRegistrationEmail, sendParticipantEmail, sendTeamSummaryEmail } = require("../../utils/emailService");
const fs = require("fs").promises;
const axios = require('axios'); 
const FormData = require('form-data'); 
const htmlToPdf = require('html-pdf-node');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const stream = require('stream');
// Appwrite configuration
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '67aee32f0028febbce2c';
const APPWRITE_BUCKET_ID = '67aee35f000b324ca10c';

async function uploadCertificateToAppwrite(pdfBuffer, fileName, certificateId) {
  try {
    // Generate a valid fileId that meets Appwrite requirements:
    // - Max 36 characters
    // - Only a-z, A-Z, 0-9, period, hyphen, underscore
    // - Cannot start with special character

    let validFileId;
    if (certificateId) {
      // Clean the certificate ID to make it valid
      validFileId = certificateId
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
        .substring(0, 36); // Limit to 36 characters

      // Ensure it doesn't start with a special character
      if (validFileId.match(/^[._-]/)) {
        validFileId = 'cert_' + validFileId.substring(5); // Replace first chars and keep within limit
      }
    } else {
      // Generate a new valid UUID-style ID
      validFileId = uuidv4().replace(/-/g, '').substring(0, 32); // Remove hyphens and limit length
    }

    const formData = new FormData();
    formData.append('fileId', validFileId);
    formData.append('file', pdfBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    const response = await axios.post(
      `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          // Note: This might work without API key for some operations, or you'll need to set it
          // 'X-Appwrite-Key': 'your-api-key-here'  // Uncomment and add if needed
        }
      }
    );

    // Return the file URL based on the response
    const uploadedFile = response.data;
    return {
      success: true,
      fileId: uploadedFile.$id,
      url: `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`
    };
  } catch (error) {
    console.error('Appwrite upload error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

function generateCertificateHTML(registration) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - ${registration.certificate_u_id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            background: white;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .certificate-container {
            width: 100%;
            height: 100%;
            background: #731F15;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
      
        .border {
            border: 4px solid white;
            padding: 20px;
            width: 100%;
            height: 100%;
            max-width: 750px;
            max-height: 1050px;
        }
        
        .certificate-border {
            width: 100%;
            height: 100%;
            border: 4px solid white;
            background: white;
            position: relative;
        }
        
        .certificate-inner {
            width: 100%;
            height: 100%;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }
        
        .header {
            text-align: center;
            margin-bottom: 0px;
        }
        
        .wsro-logo-container {
            margin-bottom: -10px;
        }
        
        .wsro-logo {
            width: 100%;
            max-width: 800px;
            object-fit: contain;
        }
        
        .certificate-title {
            font-size: 44px;
            font-weight: 500;
            color: #3e3c3c;
            margin-bottom: 15px;
            letter-spacing: 4px;
        }
        
        .participation-text {
            font-size: 22px;
            color: #414141;
            margin-bottom:0px;
            letter-spacing: 3px;
           
        }
        
        .event-details {
            font-size: 22px;
            color: #333;
            margin-bottom: 20px;
            letter-spacing: 2px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .awarded-text {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .participant-name {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            padding-bottom: 8px;
            border-bottom: 2px dashed #731F15;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            
        }
        
        .content-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-bottom: 30px;
            margin-top: 20px;
        }
        
        .participation-details {
           text-align: center;
           font-weight: 500;
            font-size: 16px;
            color: #333;
            letter-spacing: 0.8px;
            line-height: 1.8;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
        }
        
        .left-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .uin-text {
            font-size: 14px;
            font-weight: bold;
            color: #731F15;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
       
        .signature-section {
            display: flex;
            justify-content: center;
            align-items: center;
        }
            
        .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
        }
        
        .footer-left {
            display: flex;
            align-items: flex-end;
        }
        
        .triangle-image {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }

        .chalik-logo{
            height:100px;
            width: 350px;
            object-fit: cover;
        }
        
        .footer-right {
            display: flex;
            align-items: center;
        }
        
       
        
        /* Responsive adjustments for PDF generation */
        @media print {
            body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
            }
            
            .certificate-container {
                width: 210mm;
                height: 297mm;
                padding: 15mm;
            }
            
            .border {
                padding: 15mm;
            }
            
            .certificate-inner {
                padding: 20mm;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="border"> 
            <div class="certificate-border">
                <div class="certificate-inner">
                    <!-- Header with WSRO Logo -->
                    <div class="header">
                        <div class="wsro-logo-container">
                            <img 
                                src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a29000921fb3e0f/view?project=67aee32f0028febbce2c&" 
                                alt="WSRO Logo" 
                                class="wsro-logo"
                            />
                        </div>
                        
                        <div class="certificate-title">CERTIFICATE</div>
                        <div class="participation-text">OF PLACEMENT</div>
                        <div class="event-details">(WSRO IRAN NATIONAL COMPETITION 2025)</div>
                        <div class="awarded-text">This certificate is awarded to</div>
                        
                        <div class="participant-name">${registration.full_name}</div>
                    </div>
                    
                    <!-- Main Content -->
                    <div class="content-section">
                        <div class="participation-details">
                            for winning the <strong> ${registration.grade_or_winning_rank}</strong> position in the <br> WSRO IRAN National Competition 2025 on the date
                            of <strong>21,22 & 23 May 2025</strong>
                            <br>At <strong>${registration.school_institute}.</strong>
                        </div>
                    </div>
                    
                    <!-- Bottom Section -->
                    <div class="bottom-section">
                        <div class="left-section">
                            <div class="uin-text">UIN: ${registration.certificate_u_id}</div>
                            <img 
                                src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a00000b2df78936/view?project=67aee32f0028febbce2c&" 
                                alt="WSRO Award Badge" 
                                class="award-badge"
                            />
                        </div>
                        
                        <div class="signature-section">
                            <img 
                                src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a30002b5fd714e2/view?project=67aee32f0028febbce2c&" 
                                alt="Signature" 
                                class="signature-image"
                            />
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer-section">
                        <div class="footer-left">
                            <img 
                                src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a4100036a2746c8/view?project=67aee32f0028febbce2c&" 
                                alt="Triangle Design" 
                                class="triangle-image"
                            />
                        </div>
                        
                        <div class="footer-right">
                            <img 
                                src="https://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/68516afc0026e43d7065/view?project=67aee32f0028febbce2c&" 
                                alt="Chalik.net Logo" 
                                class="chalik-logo"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  
  `;
}
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
      payment_id
    } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // ✅ Fetch event and competition names
      const [[eventRow]] = await connection.query(
        'SELECT title FROM Events WHERE id = ?',
        [event_id]
      );
      const [[compRow]] = await connection.query(
        'SELECT name FROM Competitions WHERE id = ?',
        [competition_id]
      );

      const eventName = eventRow?.title || ''; // 🔁 changed from eventRow.name
      const compName = compRow?.name || '';

      // ✅ Generate event prefix (first 3 capital letters of event name)
      const eventPrefix = eventName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

      // ✅ Generate competition initials (first letter of first 3 valid words)
      const compWords = compName.split(' ').filter(w => /^[a-zA-Z]/.test(w));
      const compPrefix = compWords.slice(0, 3).map(w => w[0].toUpperCase()).join('');

      // ✅ Get the current team count for the same event and competition
      const [[{ count }]] = await connection.query(
        'SELECT COUNT(*) AS count FROM Registrations WHERE event_id = ? AND competition_id = ?',
        [event_id, competition_id]
      );

      const teamNumber = count + 1;
      const team_code = `WS/${eventPrefix}/${compPrefix}-${teamNumber}`;

      // ✅ Generate participant IDs
      const participant_id = member_names.map(
        (_, i) => `${team_code}-P${(i + 1).toString().padStart(2, "0")}`
      );

      // ✅ Insert registration
      await connection.query(
        `INSERT INTO Registrations (
        competition_id, event_id, team_code, team_name,
        coach_mentor_name, coach_mentor_organization,
        coach_mentor_phone, coach_mentor_email,
        member_names, member_ages, member_emails,
        member_phones, member_states, member_cities,
        member_zipcodes, member_institutions,
        no_of_students, participant_id, status, payment_status, payment_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)`,
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
          noOfStudents,
          JSON.stringify(participant_id),
          payment_id
        ]
      );

      await connection.commit();

      // ✅ Send emails
      try {
        const membersList = member_names.map((name, index) => ({
          name,
          email: member_emails[index],
          participant_id: participant_id[index]
        }));

        await Promise.all(
          membersList.map(async (member) => {
            if (member.email) {
              await sendParticipantEmail({
                email: member.email,
                name: member.name,
                team_name,
                team_code,
                participant_id: member.participant_id,
                competition_name: compName,
                event_name: eventName
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
      console.error("Registration Error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    } finally {
      connection.release();
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

    // Validate each entry - only full_name is required
    for (const entry of entries) {
      if (!entry.full_name || entry.full_name.trim() === '') {
        return res.status(400).json({ message: "Full name is required for each entry" });
      }

      // Optional age validation - only if provided
      if (entry.age && (isNaN(entry.age) || entry.age < 1)) {
        return res.status(400).json({ message: "Valid age is required if provided" });
      }
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get and lock sequence for certificate ID generation
      const [seq] = await connection.query(
        'SELECT current_val FROM iran_certificate_sequence FOR UPDATE'
      );
      const currentVal = seq[0].current_val;
      const newVal = currentVal + entries.length;

      // Generate certificate IDs in format WSROIR/25/PA/0001
      const entriesWithCertId = entries.map((entry, index) => {
        const sequenceNumber = currentVal + index + 1;
        return {
          full_name: entry.full_name?.trim() || null,
          school_institute: entry.school_institute?.trim() || null,
          dob: entry.dob || null,
          age: entry.age || null,
          course_name_competition_category: entry.course_name_competition_category?.trim() || null,
          grade_or_winning_rank: entry.grade_or_winning_rank?.trim() || null,
          certificate_u_id: `WSROIR/25/PA/${sequenceNumber.toString().padStart(4, '0')}`
        };
      });

      // Update sequence
      await connection.query(
        'UPDATE iran_certificate_sequence SET current_val = ?',
        [newVal]
      );

      // Prepare bulk insert - matching exact database structure
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

  generateIranCertificates: async (req, res) => {
    const { certificate_ids } = req.body;

    if (!Array.isArray(certificate_ids) || certificate_ids.length === 0) {
      return res.status(400).json({ message: "Certificate IDs array is required" });
    }

    try {
      // Fetch registration data for the certificate IDs
      const placeholders = certificate_ids.map(() => '?').join(',');
      const [registrations] = await db.query(
        `SELECT * FROM iran_registrations WHERE certificate_u_id IN (${placeholders})`,
        certificate_ids
      );

      if (registrations.length === 0) {
        return res.status(404).json({ message: "No registrations found for provided certificate IDs" });
      }

      const certificates = [];
      const uploadResults = [];

      for (const registration of registrations) {
        try {
          const certificateHtml = generateCertificateHTML(registration);

          // Updated PDF generation options for better fitting
          const options = {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '0mm',
              right: '0mm',
              bottom: '0mm',
              left: '0mm'
            },
            width: '210mm',
            height: '297mm',
            preferCSSPageSize: true,
            displayHeaderFooter: false
          };

          // Convert HTML to PDF
          const pdfBuffer = await htmlToPdf.generatePdf(
            { content: certificateHtml },
            options
          );

          // Create filename using username (full_name) and certificate ID
          const sanitizedName = registration.full_name.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${sanitizedName}_${registration.certificate_u_id}.pdf`;

          // Upload to Appwrite
          const uploadResult = await uploadCertificateToAppwrite(
            pdfBuffer,
            fileName,
            registration.certificate_u_id
          );

          if (uploadResult.success) {
            // Update database with certificate URL
            await db.query(
              `UPDATE iran_registrations SET certificate_url = ? WHERE certificate_u_id = ?`,
              [uploadResult.url, registration.certificate_u_id]
            );

            certificates.push({
              certificate_id: registration.certificate_u_id,
              full_name: registration.full_name,
              certificate_url: uploadResult.url,
              file_id: uploadResult.fileId,
              upload_status: 'success'
            });

            uploadResults.push({
              certificate_id: registration.certificate_u_id,
              status: 'success',
              url: uploadResult.url
            });
          } else {
            // If upload fails, still return the certificate data but mark upload as failed
            certificates.push({
              certificate_id: registration.certificate_u_id,
              full_name: registration.full_name,
              pdf: pdfBuffer.toString('base64'), // Fallback to base64
              upload_status: 'failed',
              upload_error: uploadResult.error
            });

            uploadResults.push({
              certificate_id: registration.certificate_u_id,
              status: 'failed',
              error: uploadResult.error
            });
          }
        } catch (error) {
          console.error(`Error processing certificate ${registration.certificate_u_id}:`, error);
          certificates.push({
            certificate_id: registration.certificate_u_id,
            full_name: registration.full_name,
            upload_status: 'error',
            error: error.message
          });

          uploadResults.push({
            certificate_id: registration.certificate_u_id,
            status: 'error',
            error: error.message
          });
        }
      }

      res.status(200).json({
        message: "Certificates generated and upload attempted",
        total_processed: certificate_ids.length,
        successful_uploads: uploadResults.filter(r => r.status === 'success').length,
        failed_uploads: uploadResults.filter(r => r.status !== 'success').length,
        certificates: certificates,
        upload_summary: uploadResults
      });

    } catch (error) {
      console.error("Certificate Generation Error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  },

  // New method to get certificate download URL from Appwrite
  getCertificateDownloadUrl: async (req, res) => {
    const { certificate_u_id } = req.params;

    if (!certificate_u_id) {
      return res.status(400).json({ message: "Certificate ID is required" });
    }

    try {
      const [result] = await db.query(
        `SELECT certificate_url, full_name FROM iran_registrations WHERE certificate_u_id = ?`,
        [certificate_u_id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      if (!result[0].certificate_url) {
        return res.status(404).json({ message: "Certificate not yet uploaded" });
      }

      res.status(200).json({
        message: "Certificate URL retrieved successfully",
        certificate_id: certificate_u_id,
        full_name: result[0].full_name,
        download_url: result[0].certificate_url
      });
    } catch (error) {
      console.error("Error fetching certificate URL:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
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
    try {
      const { team_codes } = req.body;
  
      // Validate required fields
      if (!team_codes || !Array.isArray(team_codes) || team_codes.length === 0) {
        return res.status(400).json({ 
          message: "team_codes should be a non-empty array" 
        });
      }
  
      const results = [];
      const failed = [];
  
      // Process each team code
      for (const team_code of team_codes) {
        try {
          // Get team and competition details
          const [teamResult] = await db.query(
            `SELECT r.team_name, r.member_emails, r.competition_id,
                    c.name AS competition_name, c.date, c.venue, c.level 
             FROM Registrations r
             JOIN Competitions c ON r.competition_id = c.id
             WHERE r.team_code = ? AND c.is_deleted = 0`,
            [team_code]
          );
  
          if (!teamResult || teamResult.length === 0) {
            failed.push({
              team_code,
              error: "No team found with the given team code or competition not found"
            });
            continue;
          }
  
          const team = teamResult[0];
          const { 
            team_name, 
            member_emails, 
            competition_id,
            competition_name, 
            date, 
            venue, 
            level 
          } = team;
  
          let memberEmails = [];
          try {
            memberEmails = JSON.parse(member_emails) || [];
          } catch (e) {
            failed.push({
              team_code,
              error: "Invalid member_emails format in database"
            });
            continue;
          }
  
          const allEmails =  [...memberEmails];
  
          // Process each team member
          for (const email of allEmails) {
            try {
              // Generate unique certificate ID
              const certificateId = `WSRO-${competition_id}-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 6)
                .toUpperCase()}`;
  
              // Determine participant name and position
              const participantName = team_name;
              const position =  "Team Member";
  
              // Prepare certificate data
              const certificateData = {
                certificateId,
                participantName,
                teamName: team_name,
                competitionName: competition_name,
                competitionDate: date,
                venue: venue,
                level: level,
                position: position
              };
  
              // Generate certificate PDF
              const certificatePath = await generateCertificate(certificateData);
  
              // Send email with certificate
              await sendCertificateEmail({
                email: email,
                name: participantName,
                competitionName: competition_name,
                certificatePath,
                certificateId
              });
  
              // Save certificate record to database
              await db.query(
                `INSERT INTO Certificates (
                  competition_id, participant_name, participant_email,
                  certificate_id, position, team_name, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                  competition_id,
                  participantName,
                  email,
                  certificateId,
                  position,
                  team_name
                ]
              );
  
              // Clean up temporary file
              await fs.unlink(certificatePath);
  
              results.push({
                email: email,
                name: participantName,
                teamName: team_name,
                team_code: team_code,
                position: position,
                status: "success",
                certificateId
              });
  
            } catch (error) {
              console.error(`Error processing certificate for ${email}:`, error);
              failed.push({
                email: email,
                team_code: team_code,
                error: error.message
              });
            }
          }
  
        } catch (error) {
          console.error(`Error processing team code ${team_code}:`, error);
          failed.push({
            team_code,
            error: error.message
          });
        }
      }
  
      res.status(200).json({
        message: "Certificate generation and sending completed",
        successful: results.length,
        failed: failed.length,
        results: results,
        failures: failed
      });
  
    } catch (error) {
      console.error('Error in sendBulkCertificates:', error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
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

  bulkRegisterForCompetition: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Excel file is required" });
      }

      const { competition_id, event_id } = req.body;

      if (!competition_id || !event_id) {
        return res.status(400).json({
          message: "competition_id and event_id are required"
        });
      }

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      const results = [];
      const errors = [];

      try {
        // Fetch event and competition names once for all registrations
        const [[eventRow]] = await connection.query(
          'SELECT title FROM Events WHERE id = ?',
          [event_id]
        );
        const [[compRow]] = await connection.query(
          'SELECT name FROM Competitions WHERE id = ?',
          [competition_id]
        );

        const eventName = eventRow?.title || '';
        const compName = compRow?.name || '';

        // Generate event prefix (first 3 capital letters of event name)
        const eventPrefix = eventName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

        // Generate competition initials (first letter of first 3 valid words)
        const compWords = compName.split(' ').filter(w => /^[a-zA-Z]/.test(w));
        const compPrefix = compWords.slice(0, 3).map(w => w[0].toUpperCase()).join('');

        // Get the current team count for the same event and competition before starting bulk inserts
        const [[{ count: initialTeamCount }]] = await connection.query(
          'SELECT COUNT(*) AS count FROM Registrations WHERE event_id = ? AND competition_id = ?',
          [event_id, competition_id]
        );
        let currentTeamNumber = initialTeamCount + 1; // Start numbering from the next available team number

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 2; // +2 because Excel rows start from 1 and we have header

          try {
            // Validate required fields
            const requiredFields = [
              'team_name', 'coach_mentor_name', 'coach_mentor_organization',
              'coach_mentor_phone', 'coach_mentor_email', 'no_of_students'
            ];

            for (const field of requiredFields) {
              if (!row[field]) {
                throw new Error(`${field} is required`);
              }
            }

            // Parse member data
            const memberNames = [];
            const memberAges = [];
            const memberEmails = [];
            const memberPhones = [];
            const memberStates = [];
            const memberCities = [];
            const memberZipcodes = [];
            const memberInstitutions = [];

            const noOfStudents = parseInt(row.no_of_students);

            if (isNaN(noOfStudents) || noOfStudents <= 0) {
              throw new Error("no_of_students must be a positive number");
            }

            for (let j = 1; j <= noOfStudents; j++) {
              const name = row[`member_${j}_name`];
              const age = row[`member_${j}_age`];
              const email = row[`member_${j}_email`];
              const phone = row[`member_${j}_phone`];
              const state = row[`member_${j}_state`];
              const city = row[`member_${j}_city`];
              const zipcode = row[`member_${j}_zipcode`];
              const institution = row[`member_${j}_institution`];

              // Basic validation for member fields
              if (!name || !age || !email) {
                throw new Error(`Member ${j} name, age, and email are required`);
              }

              memberNames.push(name);
              memberAges.push(parseInt(age));
              memberEmails.push(email);
              memberPhones.push(phone || '');
              memberStates.push(state || '');
              memberCities.push(city || '');
              memberZipcodes.push(zipcode || '');
              memberInstitutions.push(institution || '');
            }

            // Generate team code using the fetched prefixes and current team number
            const team_code = `WS/${eventPrefix}/${compPrefix}-${currentTeamNumber}`;

            // Generate participant IDs
            const participant_id = memberNames.map(
              (_, idx) => `${team_code}-P${(idx + 1).toString().padStart(2, "0")}`
            );

            // Insert registration
            await connection.query(
              `INSERT INTO Registrations (
                competition_id, event_id, team_code, team_name,
                coach_mentor_name, coach_mentor_organization,
                coach_mentor_phone, coach_mentor_email,
                member_names, member_ages, member_emails,
                member_phones, member_states, member_cities,
                member_zipcodes, member_institutions,
                no_of_students, participant_id, status, payment_status, payment_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)`,
              [
                competition_id,
                event_id,
                team_code,
                row.team_name,
                row.coach_mentor_name,
                row.coach_mentor_organization,
                row.coach_mentor_phone,
                row.coach_mentor_email,
                JSON.stringify(memberNames),
                JSON.stringify(memberAges),
                JSON.stringify(memberEmails),
                JSON.stringify(memberPhones),
                JSON.stringify(memberStates),
                JSON.stringify(memberCities),
                JSON.stringify(memberZipcodes),
                JSON.stringify(memberInstitutions),
                noOfStudents,
                JSON.stringify(participant_id),
                row.payment_id || null
              ]
            );

            // Increment team number for the next registration in the bulk upload
            currentTeamNumber++;

            results.push({
              row: rowNumber,
              team_name: row.team_name,
              team_code: team_code,
              status: 'success'
            });

            // Send emails (optional - you can comment this out for bulk operations)
            try {
              const membersList = memberNames.map((name, index) => ({
                name: name,
                email: memberEmails[index],
                participant_id: participant_id[index]
              }));

              await Promise.all(
                membersList.map(async (member) => {
                  if (member.email) {
                    await sendParticipantEmail({
                      email: member.email,
                      name: member.name,
                      team_name: row.team_name,
                      team_code: team_code,
                      participant_id: member.participant_id,
                      competition_name: compName, // Use actual competition name
                      event_name: eventName // Use actual event name
                    });
                  }
                })
              );
            } catch (emailError) {
              console.error("Email sending error for team:", row.team_name, emailError);
            }

          } catch (rowError) {
            errors.push({
              row: rowNumber,
              team_name: row.team_name || 'Unknown',
              error: rowError.message
            });
          }
        }

        await connection.commit();

        res.status(201).json({
          message: "Bulk registration completed",
          total_processed: jsonData.length,
          successful: results.length,
          failed: errors.length,
          results: results,
          errors: errors
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error("Bulk Registration Error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  },

  generatePaginatedZipCertificates: async (req, res) => {
    try {
      const {
        page = 1,
        per_page = 50, // Process 50 certificates per ZIP
        search = null,
        certificate_ids = null,
        start_id = null,  // New parameter for ID range start
        end_id = null     // New parameter for ID range end
      } = req.query;

      const pageNum = parseInt(page);
      const perPage = Math.min(parseInt(per_page), 100); // Max 100 per ZIP
      const offset = (pageNum - 1) * perPage;

      // Build query with pagination
      let query = `SELECT * FROM iran_registrations`;
      let countQuery = `SELECT COUNT(*) as total FROM iran_registrations`;
      let params = [];
      let conditions = [];

      // Handle ID range filtering
      if (start_id && end_id) {
        const startIdNum = parseInt(start_id);
        const endIdNum = parseInt(end_id);

        if (startIdNum > endIdNum) {
          return res.status(400).json({
            message: "start_id must be less than or equal to end_id"
          });
        }

        conditions.push(`id BETWEEN ? AND ?`);
        params.push(startIdNum, endIdNum);
        console.log(`🎯 Filtering by ID range: ${startIdNum} to ${endIdNum}`);
      }

      // Handle single ID parameter (if only start_id is provided)
      else if (start_id && !end_id) {
        const startIdNum = parseInt(start_id);
        conditions.push(`id >= ?`);
        params.push(startIdNum);
        console.log(`🎯 Filtering from ID: ${startIdNum} onwards`);
      }

      // Handle end ID parameter (if only end_id is provided)
      else if (!start_id && end_id) {
        const endIdNum = parseInt(end_id);
        conditions.push(`id <= ?`);
        params.push(endIdNum);
        console.log(`🎯 Filtering up to ID: ${endIdNum}`);
      }

      // Handle search functionality
      if (search) {
        const searchCondition = `(
          full_name LIKE ? OR 
          school_institute LIKE ? OR 
          course_name_competition_category LIKE ? OR 
          certificate_u_id LIKE ?
        )`;
        conditions.push(searchCondition);
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Handle specific certificate IDs
      if (certificate_ids) {
        const ids = certificate_ids.split(',').map(id => id.trim());
        const placeholders = ids.map(() => '?').join(',');
        conditions.push(`certificate_u_id IN (${placeholders})`);
        params.push(...ids);
      }

      // Apply WHERE conditions if any exist
      if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
      }

      // Get total count
      const [countResult] = await db.query(countQuery, params);
      const totalRecords = countResult[0].total;
      const totalPages = Math.ceil(totalRecords / perPage);

      // Add pagination (only if not using ID range)
      if (!start_id && !end_id) {
        query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
        params.push(perPage, offset);
      } else {
        // For ID range, order by ID ascending and apply pagination
        query += ` ORDER BY id ASC LIMIT ? OFFSET ?`;
        params.push(perPage, offset);
      }

      const [registrations] = await db.query(query, params);

      if (registrations.length === 0) {
        let message = `No records found`;
        if (start_id || end_id) {
          message += ` for ID range ${start_id || 'start'} to ${end_id || 'end'}`;
        } else {
          message += ` for page ${pageNum}`;
        }

        return res.status(404).json({
          message,
          pagination: {
            current_page: pageNum,
            per_page: perPage,
            total_pages: totalPages,
            total_records: totalRecords,
            id_range: start_id || end_id ? { start_id, end_id } : null
          }
        });
      }

      // Determine filename based on filtering type
      let filename;
      if (start_id && end_id) {
        filename = `certificates_id_${start_id}_to_${end_id}_page_${pageNum}.zip`;
      } else if (start_id) {
        filename = `certificates_from_id_${start_id}_page_${pageNum}.zip`;
      } else if (end_id) {
        filename = `certificates_up_to_id_${end_id}_page_${pageNum}.zip`;
      } else {
        filename = `certificates_page_${pageNum}_of_${totalPages}.zip`;
      }

      console.log(`📦 Generating ZIP: ${filename} (${registrations.length} certificates)`);

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Create ZIP
      const archive = archiver('zip', {
        zlib: { level: 1, memLevel: 1 },
        store: true
      });

      archive.pipe(res);

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        width: '210mm',
        height: '297mm',
        timeout: 10000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--max-old-space-size=256'
        ]
      };

      let successful = 0;
      let failed = 0;

      // Process certificates one by one
      for (const registration of registrations) {
        try {
          const certificateHtml = generateCertificateHTML(registration);
          const pdfBuffer = await htmlToPdf.generatePdf({ content: certificateHtml }, pdfOptions);

          const sanitizedName = registration.full_name
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

          const fileName = `${sanitizedName}_${registration.certificate_u_id}_ID_${registration.id}.pdf`;
          archive.append(pdfBuffer, { name: fileName });

          successful++;

        } catch (error) {
          console.error(`❌ Error: ${registration.certificate_u_id} (ID: ${registration.id})`, error.message);
          failed++;
          archive.append(`Error: ${error.message}`, { name: `ERROR_${registration.certificate_u_id}_ID_${registration.id}.txt` });
        }
      }

      // Add info file with details
      let infoContent;
      if (start_id || end_id) {
        infoContent = `
Certificate Generation by ID Range
=================================
ID Range: ${start_id || 'start'} to ${end_id || 'end'}
Page: ${pageNum} of ${totalPages}
Records in this ZIP: ${registrations.length}
Total records in range: ${totalRecords}
Per page: ${perPage}

Generated: ${new Date().toISOString()}
Successful: ${successful}
Failed: ${failed}

ID Range Examples:
- ID 1 to 50: GET /api/certificates/paginated-zip?start_id=1&end_id=50
- ID 33 to 56: GET /api/certificates/paginated-zip?start_id=33&end_id=56
- From ID 100: GET /api/certificates/paginated-zip?start_id=100
- Up to ID 200: GET /api/certificates/paginated-zip?end_id=200

First record ID in this ZIP: ${registrations[0]?.id || 'N/A'}
Last record ID in this ZIP: ${registrations[registrations.length - 1]?.id || 'N/A'}
`;
      } else {
        infoContent = `
Paginated Certificate Generation
===============================
Page: ${pageNum} of ${totalPages}
Records in this ZIP: ${registrations.length}
Total records available: ${totalRecords}
Per page: ${perPage}

Generated: ${new Date().toISOString()}
Successful: ${successful}
Failed: ${failed}

To get all certificates, download each page:
Page 1: GET /api/certificates/paginated-zip?page=1&per_page=${perPage}
Page 2: GET /api/certificates/paginated-zip?page=2&per_page=${perPage}
...
Page ${totalPages}: GET /api/certificates/paginated-zip?page=${totalPages}&per_page=${perPage}

Or use ID ranges:
- ID 1 to 50: GET /api/certificates/paginated-zip?start_id=1&end_id=50
- ID 33 to 56: GET /api/certificates/paginated-zip?start_id=33&end_id=56
`;
      }

      archive.append(infoContent, { name: 'GENERATION_INFO.txt' });
      await archive.finalize();

      console.log(`✅ Generation completed. Success: ${successful}, Failed: ${failed}`);
      if (start_id || end_id) {
        console.log(`🎯 ID Range: ${start_id || 'start'} to ${end_id || 'end'}`);
      }

    } catch (error) {
      console.error("❌ Certificate Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Certificate generation failed", error: error.message });
      }
    }
  },

  generateEventCertificatesZip: async (req, res) => {
    try {
      const { event_id } = req.params;

      if (!event_id) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // First, get event details
      const [eventResult] = await db.query(
        'SELECT id, title FROM Events WHERE id = ?',
        [event_id]
      );

      if (!eventResult || eventResult.length === 0) {
        return res.status(404).json({ message: "Event not found" });
      }

      const event = eventResult[0];

      // Get all competitions for this event
      const [competitions] = await db.query(
        'SELECT id, name FROM Competitions WHERE event_id = ? AND is_deleted = 0',
        [event_id]
      );

      if (!competitions || competitions.length === 0) {
        return res.status(404).json({ message: "No competitions found for this event" });
      }

      // Get all registrations for all competitions in this event
      const competitionIds = competitions.map(comp => comp.id);
      const placeholders = competitionIds.map(() => '?').join(',');
      
      const [registrations] = await db.query(
        `SELECT r.*, c.name as competition_name 
         FROM Registrations r
         JOIN Competitions c ON r.competition_id = c.id
         WHERE r.competition_id IN (${placeholders})
         ORDER BY r.team_code`,
        competitionIds
      );

      if (!registrations || registrations.length === 0) {
        return res.status(404).json({ message: "No registrations found for this event" });
      }

      // Create filename with event name
      const sanitizedEventName = event.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      
      const filename = `${sanitizedEventName}_Event_Certificates_${new Date().toISOString().split('T')[0]}.zip`;

      console.log(`📦 Generating Event Certificates ZIP: ${filename} (${registrations.length} registrations)`);

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Create ZIP
      const archive = archiver('zip', {
        zlib: { level: 1, memLevel: 1 },
        store: true
      });

      archive.pipe(res);

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        width: '210mm',
        height: '297mm',
        timeout: 10000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--max-old-space-size=256'
        ]
      };

      let successful = 0;
      let failed = 0;
      const competitionStats = {};

      // Initialize competition stats
      competitions.forEach(comp => {
        competitionStats[comp.id] = {
          name: comp.name,
          successful: 0,
          failed: 0,
          total: 0
        };
      });

      // Process each registration
      for (const registration of registrations) {
        try {
          // Parse member data
          const memberNames = JSON.parse(registration.member_names || '[]');
          const memberEmails = JSON.parse(registration.member_emails || '[]');
          const participantIds = JSON.parse(registration.participant_id || '[]');

          // Generate certificates for each team member
          for (let i = 0; i < memberNames.length; i++) {
            const memberName = memberNames[i];
            const memberEmail = memberEmails[i];
            const participantId = participantIds[i];

            if (!memberName) continue;

            // Create certificate data
            const certificateData = {
              certificateId: participantId || `CERT-${registration.team_code}-${i + 1}`,
              participantName: memberName,
              teamName: registration.team_name,
              competitionName: registration.competition_name,
              competitionDate: registration.created_at,
              venue: registration.venue || 'TBD',
              level: registration.level || 'Competition',
              position: i === 0 ? 'Team Leader' : 'Team Member'
            };

            // Generate certificate PDF
            const certificatePath = await generateCertificate(certificateData);

            // Read the generated PDF
            const pdfBuffer = await fs.readFile(certificatePath);

            // Create filename
            const sanitizedName = memberName
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .replace(/\s+/g, '_')
              .substring(0, 30);

            const sanitizedTeamName = registration.team_name
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .replace(/\s+/g, '_')
              .substring(0, 20);

            const fileName = `${sanitizedTeamName}_${sanitizedName}_${certificateData.certificateId}.pdf`;
            
            // Add to ZIP with folder structure
            const folderPath = `${registration.competition_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}/${fileName}`;
            archive.append(pdfBuffer, { name: folderPath });

            // Clean up temporary file
            await fs.unlink(certificatePath);

            successful++;
            competitionStats[registration.competition_id].successful++;
            competitionStats[registration.competition_id].total++;
          }

        } catch (error) {
          console.error(`❌ Error processing registration ${registration.team_code}:`, error.message);
          failed++;
          competitionStats[registration.competition_id].failed++;
          competitionStats[registration.competition_id].total++;
          
          // Add error file to ZIP
          const errorFileName = `ERRORS/${registration.team_code}_error.txt`;
          archive.append(`Error: ${error.message}`, { name: errorFileName });
        }
      }

      // Add summary info file
      let summaryContent = `
Event Certificate Generation Summary
==================================
Event: ${event.title}
Event ID: ${event_id}
Generated: ${new Date().toISOString()}

Total Registrations: ${registrations.length}
Total Certificates Generated: ${successful}
Total Failed: ${failed}

Competition Breakdown:
`;

      Object.values(competitionStats).forEach(stat => {
        if (stat.total > 0) {
          summaryContent += `
${stat.name}:
  - Total: ${stat.total}
  - Successful: ${stat.successful}
  - Failed: ${stat.failed}
`;
        }
      });

      summaryContent += `

File Structure:
- Each competition has its own folder
- Certificates are named: TeamName_ParticipantName_CertificateId.pdf
- Error files are in ERRORS/ folder

Generated by: WSRO Certificate System
`;

      archive.append(summaryContent, { name: 'GENERATION_SUMMARY.txt' });
      await archive.finalize();

      console.log(`✅ Event certificate generation completed. Success: ${successful}, Failed: ${failed}`);

    } catch (error) {
      console.error("❌ Event Certificate Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Event certificate generation failed", error: error.message });
      }
    }
  },
};
