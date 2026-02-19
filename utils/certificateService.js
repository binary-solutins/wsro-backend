const htmlToPdf = require('html-pdf-node');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const db = require("../src/config/database");

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'binarysolutions0000@gmail.com',
    pass: 'vjfl zawy sxop xlqm'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Generate sequential certificate ID
async function generateSequentialCertificateId(db) {
  try {
    // Get the last certificate ID from database
    const [lastCertResult] = await db.query(
      `SELECT certificate_id FROM Certificates 
       WHERE certificate_id LIKE 'WSROIN/25/PA/%' 
       ORDER BY id DESC LIMIT 1`
    );

    let nextSequence = 1;

    if (lastCertResult && lastCertResult.length > 0) {
      const lastId = lastCertResult[0].certificate_id;
      const sequenceMatch = lastId.match(/WSROIN\/25\/PA\/(\d+)$/);
      if (sequenceMatch) {
        nextSequence = parseInt(sequenceMatch[1]) + 1;
      }
    }

    // Format with leading zeros (4 digits)
    const formattedSequence = nextSequence.toString().padStart(4, '0');
    return `WSROIN/25/PA/${formattedSequence}`;
  } catch (error) {
    console.error('Error generating sequential certificate ID:', error);
    // Fallback to timestamp-based ID
    return `WSROIN/25/PA/${Date.now().toString().slice(-4)}`;
  }
}

function generateCertificateHTML(certificateData) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format competition date
  const competitionDate = new Date(certificateData.competitionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate - ${certificateData.certificateId}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      @page {
        size: A4;
        margin: 0;
      }

      body {
        font-family: "Times New Roman", serif;
        background: white;
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        overflow: hidden;
        page-break-inside: avoid;
      }

      .certificate-container {
        width: 100%;
        height: 100vh;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }

      .certificate-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/685c124a00047f12d79c/view?project=67aee32f0028febbce2c');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 1;
      }

      .certificate-content {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding-bottom: 160px;
        box-sizing: border-box;
      }

      .certificate-title {
        font-size: 52px;
        font-weight: bold;
        color: #333;
        margin-bottom: 15px;
        letter-spacing: 6px;
        font-family: "Times New Roman", serif;
        text-transform: uppercase;
      }

      .participation-text {
        font-size: 24px;
        color: #555;
        margin-bottom: 20px;
        letter-spacing: 4px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .event-details {
        font-size: 24px;
        color: #666;
        margin-bottom: 25px;
        letter-spacing: 2px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .awarded-text {
        font-size: 18px;
        color: #777;
        margin-bottom: 30px;
        font-style: italic;
      }

      .participant-name {
        font-size: 36px;
        font-weight: bold;
        color: #333;
        padding: 15px 0;
        border-bottom: 3px dashed #731f15;
        margin-bottom: 30px;
        min-width: 400px;
        font-family: "Times New Roman", serif;
      }

      .participation-details {
        font-size: 20px;
        color: #555;
        line-height: 1.8;
        max-width: 600px;
        margin: 0 auto 30px;
        font-weight: 500;
      }

      .competition-date {
        font-weight: bold;
        color: #731f15;
      }

      .venue {
        font-weight: bold;
        color: #731f15;
      }

      .certificate-id {
        position: absolute;
        left: 30px;
        bottom: 200px;
        font-size: 16px;
        color: #731f15;
        font-family: monospace;
        font-weight: 600;
        z-index: 1000;
      }

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
        }

        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }

      @media screen and (max-width: 768px) {
        .certificate-title {
          font-size: 36px;
          letter-spacing: 4px;
        }
        
        .participant-name {
          font-size: 28px;
          min-width: 300px;
        }
        
        .participation-text {
          font-size: 20px;
          letter-spacing: 3px;
        }
        
        .event-details {
          font-size: 18px;
        }
        
        .participation-details {
          font-size: 14px;
          max-width: 500px;
        }

        .certificate-id {
          font-size: 14px;
          padding: 6px 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <!-- Background Image -->
      <div class="certificate-background"></div>
      
      <!-- Certificate Content Overlay -->
      <div class="certificate-content">
        <div class="certificate-title">CERTIFICATE</div>
        <div class="participation-text">OF PARTICIPATION</div>
        <div class="event-details">(WSRO REGIONAL COMPETITION)</div>
        <div class="awarded-text">This certificate is awarded to</div>
        
        <div class="participant-name">${certificateData.participantName}</div>
        
        <div class="participation-details">
          In recognition of active participation in the<br />
          <strong>${certificateData.competitionName}</strong>, conducted on
          <span class="competition-date">${competitionDate}</span><br />
          at <span class="venue">${certificateData.venue}</span>
        </div>
      </div>
      
      <!-- Certificate ID -->
      <div class="certificate-id">Certificate ID: ${certificateData.certificateId}</div>
    </div>
  </body>
</html>`;
}

async function generateCertificate(certificateData) {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  // Generate HTML content
  const htmlContent = generateCertificateHTML(certificateData);

  // Configure PDF options - optimized for A4
  const options = {
    format: 'A4',
    orientation: 'portrait',
    border: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    height: '297mm',
    width: '210mm',
    quality: 100
  };

  // Create file object for html-pdf-node
  const file = { content: htmlContent };

  try {
    // Generate PDF
    const pdfBuffer = await htmlToPdf.generatePdf(file, options);

    // Create certificate PDF
    const certificatePath = path.join(uploadsDir, `certificate-${certificateData.certificateId.replace(/\//g, '_')}.pdf`);
    await fs.writeFile(certificatePath, pdfBuffer);

    console.log(`Certificate generated successfully: ${certificatePath}`);
    return certificatePath;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}

async function sendCertificateEmail(emailData) {
  const { email, name, competitionName, certificatePath, certificateId } = emailData;

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `🏆 Certificate of Participation - ${competitionName} | WSRO`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WSRO Certificate</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Times New Roman', serif; background-color: #f5f5f5;">
        <div style="max-width: 650px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header with WSRO Branding -->
          <div style="background: linear-gradient(135deg, #731f15, #a02c20); padding: 30px 20px; text-align: center; position: relative; overflow: hidden;">
          
            
            <div style="position: relative; z-index: 2;">
              <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 50px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <h1 style="color: #731f15; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">WSRO</h1>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">WORLD STEM & ROBOTICS OLYMPIAD</p>
              </div>
              
              <h2 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎉 CONGRATULATIONS! 🎉</h2>
              <div style="width: 80px; height: 3px; background: white; margin: 15px auto; border-radius: 2px;"></div>
            </div>
          </div>
  
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <!-- Personalized Greeting -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="color: #333; font-size: 24px; margin-bottom: 10px; font-weight: bold;">Dear ${name},</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                We are delighted to inform you about your successful participation in our prestigious competition!
              </p>
            </div>
  
            <!-- Certificate Info Box -->
            <div style="background: linear-gradient(135deg, #f9f9f9, #ffffff); border-left: 5px solid #731f15; padding: 25px; margin-bottom: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h4 style="color: #731f15; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📜 CERTIFICATE OF PARTICIPATION</h4>
              <p style="color: #555; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                This certificate recognizes your <strong style="color: #731f15;">outstanding participation</strong> in the 
                <strong style="color: #731f15;">${competitionName}</strong>.
              </p>
              <p style="color: #555; font-size: 16px; line-height: 1.7; margin: 0;">
                Your dedication, enthusiasm, and competitive spirit have made this event a remarkable success. 
                This achievement reflects your commitment to excellence in STEM and Robotics.
              </p>
            </div>
  
            <!-- Certificate ID Highlight -->
            <div style="background: #731f15; background: linear-gradient(135deg, #731f15, #a02c20); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(115,31,21,0.3);">
              <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">YOUR CERTIFICATE ID</p>
              <p style="margin: 0; font-size: 18px; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                ${certificateId}
              </p>
            </div>
  
            <!-- Achievement Highlights -->
            <div style="background: #fff; border: 2px dashed #731f15; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <h4 style="color: #731f15; margin: 0 0 15px 0; font-size: 16px; text-align: center;">🏆 ACHIEVEMENT HIGHLIGHTS</h4>
              <div style="display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap;">
                <div style="margin: 5px;">
                  <div style="color: #731f15; font-size: 24px; font-weight: bold;">✓</div>
                  <p style="color: #666; font-size: 12px; margin: 5px 0;">PARTICIPATED</p>
                </div>
                <div style="margin: 5px;">
                  <div style="color: #731f15; font-size: 24px; font-weight: bold;">🎯</div>
                  <p style="color: #666; font-size: 12px; margin: 5px 0;">COMPETED</p>
                </div>
                <div style="margin: 5px;">
                  <div style="color: #731f15; font-size: 24px; font-weight: bold;">🌟</div>
                  <p style="color: #666; font-size: 12px; margin: 5px 0;">ACHIEVED</p>
                </div>
              </div>
            </div>
  
            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #f0f8ff, #e6f3ff); padding: 20px; border-radius: 10px; border: 1px solid #ddeeff;">
                <p style="color: #333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">
                  📎 Your personalized certificate is attached to this email
                </p>
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Save it, print it, and display it with pride! Share your achievement with friends and family.
                </p>
              </div>
            </div>
          </div>
  
          <!-- Footer -->
          <div style="background: #2c2c2c; color: white; padding: 30px 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h4 style="color: #731f15; margin: 0 0 10px 0; font-size: 18px;">Best Regards,</h4>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">WSRO Team</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #ccc;">World STEM & Robotics Olympiad</p>
            </div>
            
            <div style="border-top: 1px solid #444; padding-top: 20px;">
              <div style="background: #333; padding: 20px; border-radius: 8px;">
                <h5 style="color: #731f15; margin: 0 0 15px 0; font-size: 16px; text-align: center;">📞 GET IN TOUCH</h5>
                
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                  <div style="flex: 1; min-width: 200px;">
                    <p style="color: #ccc; font-size: 13px; margin: 5px 0;">
                      <strong style="color: white;">📱 Phone:</strong><br>
                      +91 99044 63224<br>
                      +91 81287 28882
                    </p>
                  </div>
                  
                  <div style="flex: 1; min-width: 200px;">
                    <p style="color: #ccc; font-size: 13px; margin: 5px 0;">
                      <strong style="color: white;">✉️ Email:</strong><br>
                      info@wsro.in
                    </p>
                    <p style="color: #ccc; font-size: 13px; margin: 5px 0;">
                      <strong style="color: white;">🌐 Website:</strong><br>
                      www.wsro.in
                    </p>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
                  <p style="color: #ccc; font-size: 12px; margin: 0;">
                    <strong style="color: white;">📍 Address:</strong><br>
                    Happiness Reserves Foundation, Ahmedabad, India - 380058
                  </p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #444;">
              <p style="color: #888; font-size: 11px; margin: 0;">
                © 2025 WSRO. All rights reserved. | This is an automated email, please do not reply.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `${name.replace(/[^a-zA-Z0-9]/g, '_')}-Certificate-${certificateId.replace(/\//g, '_')}.pdf`,
        path: certificatePath,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Certificate email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending certificate email:', error);
    throw error;
  }
}

// Enhanced bulk certificate sending with team ID tracking
const sendBulkCertificatesByTeamId = async (req, res) => {
  try {
    const { team_ids } = req.body;

    // Validate required fields
    if (!team_ids || !Array.isArray(team_ids) || team_ids.length === 0) {
      return res.status(400).json({
        message: "team_ids should be a non-empty array"
      });
    }

    const results = [];
    const failed = [];

    // Process each team ID
    for (const team_id of team_ids) {
      try {
        // Check if certificates already exist for this team
        const [existingCertificates] = await db.query(
          `SELECT * FROM Certificates WHERE team_id = ?`,
          [team_id]
        );

        if (existingCertificates && existingCertificates.length > 0) {
          failed.push({
            team_id,
            error: "Certificates already generated for this team"
          });
          continue;
        }

        // Get team and competition details
        const [teamResult] = await db.query(
          `SELECT r.*, c.name AS competition_name, c.date, c.venue, c.level 
           FROM Registrations r
           JOIN Competitions c ON r.competition_id = c.id
           WHERE r.id = ? AND c.is_deleted = 0`,
          [team_id]
        );

        if (!teamResult || teamResult.length === 0) {
          failed.push({
            team_id,
            error: "No team found with the given team ID or competition not found"
          });
          continue;
        }

        const team = teamResult[0];
        const {
          team_name,
          member_emails,
          member_names,
          competition_id,
          competition_name,
          date,
          venue,
          level
        } = team;

        let memberEmails = [];
        let memberNames = [];

        try {
          memberEmails = JSON.parse(member_emails) || [];
          memberNames = JSON.parse(member_names) || [];
        } catch (e) {
          failed.push({
            team_id,
            error: "Invalid member data format in database"
          });
          continue;
        }

        // Process each team member
        for (let i = 0; i < memberEmails.length; i++) {
          const email = memberEmails[i];
          const participantName = memberNames[i] || `Team Member ${i + 1}`;

          try {
            // Generate sequential certificate ID
            const certificateId = await generateSequentialCertificateId(db);

            // Prepare certificate data
            const certificateData = {
              certificateId,
              participantName,
              teamName: team_name,
              competitionName: competition_name,
              competitionDate: date,
              venue: venue,
              level: level
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

            // Save certificate record to database with team_id
            await db.query(
              `INSERT INTO Certificates (
                competition_id, participant_name, participant_email,
                certificate_id, team_name, team_id, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
              [
                competition_id,
                participantName,
                email,
                certificateId,
                team_name,
                team_id
              ]
            );

            // Clean up temporary file
            await fs.unlink(certificatePath);

            results.push({
              team_id: team_id,
              email: email,
              name: participantName,
              teamName: team_name,
              status: "success",
              certificateId
            });

          } catch (error) {
            console.error(`Error processing certificate for ${email}:`, error);
            failed.push({
              team_id: team_id,
              email: email,
              error: error.message
            });
          }
        }

      } catch (error) {
        console.error(`Error processing team ID ${team_id}:`, error);
        failed.push({
          team_id,
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
    console.error('Error in sendBulkCertificatesByTeamId:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  generateCertificate,
  sendCertificateEmail,
  generateSequentialCertificateId,
  sendBulkCertificatesByTeamId
};