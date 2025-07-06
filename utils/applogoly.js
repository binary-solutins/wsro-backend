const nodemailer = require('nodemailer');
const db = require("../src/config/database");

// Configure email transporter (using existing configuration)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'binarysolutions0000@gmail.com',
    pass: 'bekr rmpn lyye tuyf'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send apology email for mistakenly sent certificates
async function sendApologyEmail(emailData) {
  const { email, name, competitionName, certificateId } = emailData;

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `Important Notice - Certificate Status Update | ${competitionName} | WSRO`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WSRO - Certificate Status Update</title>
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
              
              <h2 style="color: white; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">📢 IMPORTANT NOTICE</h2>
              <div style="width: 80px; height: 3px; background: white; margin: 15px auto; border-radius: 2px;"></div>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <!-- Personalized Greeting -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="color: #333; font-size: 24px; margin-bottom: 10px; font-weight: bold;">Dear ${name},</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                We hope this email finds you well. We are writing to inform you about an important update regarding your certificate.
              </p>
            </div>

            <!-- Apology Notice Box -->
            <div style="background: linear-gradient(135deg, #fff3e0, #ffecb3); border-left: 5px solid #ff9800; padding: 25px; margin-bottom: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h4 style="color: #e65100; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">⚠️ CERTIFICATE STATUS UPDATE</h4>
              <p style="color: #555; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                We sincerely apologize for any confusion. The certificate you received earlier was sent by mistake as the 
                <strong style="color: #e65100;">${competitionName}</strong> event has not been completed yet.
              </p>
              <p style="color: #555; font-size: 16px; line-height: 1.7; margin: 0;">
                <strong style="color: #e65100;">Please disregard the previous certificate.</strong> 
                Your actual certificate with the proper certificate ID will be sent to you once the competition is successfully completed.
              </p>
            </div>

            <!-- Certificate ID Reference -->
            <div style="background: #f5f5f5; border: 2px dashed #731f15; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <h4 style="color: #731f15; margin: 0 0 15px 0; font-size: 16px; text-align: center;">📄 REFERENCE CERTIFICATE ID</h4>
              <p style="text-align: center; margin: 0; font-size: 16px; font-family: 'Courier New', monospace; color: #666;">
                ${certificateId}
              </p>
              <p style="text-align: center; margin: 10px 0 0 0; font-size: 14px; color: #888; font-style: italic;">
                (This ID was from the mistakenly sent certificate)
              </p>
            </div>

            <!-- What to Expect -->
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <h4 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px; text-align: center;">✅ WHAT TO EXPECT</h4>
              <div style="color: #555; font-size: 15px; line-height: 1.8;">
                <p style="margin: 0 0 10px 0;">
                  🎯 <strong>After Competition Completion:</strong> You will receive your official certificate with a new certificate ID
                </p>
                <p style="margin: 0 0 10px 0;">
                  📧 <strong>New Email:</strong> A separate email will be sent with your actual certificate
                </p>
                <p style="margin: 0;">
                  🏆 <strong>Valid Certificate:</strong> Only the certificate received after competition completion will be valid
                </p>
              </div>
            </div>

            <!-- Apology Message -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #ffebee, #ffcdd2); padding: 20px; border-radius: 10px; border: 1px solid #f8bbd9;">
                <p style="color: #333; font-size: 16px; margin-bottom: 10px; font-weight: bold;">
                  🙏 We Sincerely Apologize for the Confusion
                </p>
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Thank you for your understanding and patience. We are committed to providing you with the best experience possible.
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
                <h5 style="color: #731f15; margin: 0 0 15px 0; font-size: 16px; text-align: center;">📞 CONTACT US</h5>
                
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Apology email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending apology email:', error);
    throw error;
  }
}

// API to send apology emails to all participants who have certificates
const sendApologyEmailsToAllCertificateHolders = async (req, res) => {
  try {
    const { competition_ids } = req.body;

    // Validate required fields
    if (!competition_ids || !Array.isArray(competition_ids) || competition_ids.length === 0) {
      return res.status(400).json({ 
        message: "competition_ids should be a non-empty array" 
      });
    }

    const results = [];
    const failed = [];

    // Process each competition ID
    for (const competition_id of competition_ids) {
      try {
        // Get all certificates for this competition
        const [certificates] = await db.query(
          `SELECT c.*, comp.name AS competition_name 
           FROM Certificates c
           JOIN Competitions comp ON c.competition_id = comp.id
           WHERE c.competition_id = ? AND comp.is_deleted = 0`,
          [competition_id]
        );

        if (!certificates || certificates.length === 0) {
          failed.push({
            competition_id,
            error: "No certificates found for this competition"
          });
          continue;
        }

        // Send apology email to each certificate holder
        for (const certificate of certificates) {
          const { 
            participant_name, 
            participant_email, 
            certificate_id, 
            competition_name 
          } = certificate;

          try {
            await sendApologyEmail({
              email: participant_email,
              name: participant_name,
              competitionName: competition_name,
              certificateId: certificate_id
            });

            results.push({
              competition_id: competition_id,
              email: participant_email,
              name: participant_name,
              certificateId: certificate_id,
              status: "success"
            });

          } catch (error) {
            console.error(`Error sending apology email to ${participant_email}:`, error);
            failed.push({
              competition_id: competition_id,
              email: participant_email,
              name: participant_name,
              certificateId: certificate_id,
              error: error.message
            });
          }
        }

      } catch (error) {
        console.error(`Error processing competition ID ${competition_id}:`, error);
        failed.push({
          competition_id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Apology email sending completed",
      successful: results.length,
      failed: failed.length,
      results: results,
      failures: failed
    });

  } catch (error) {
    console.error('Error in sendApologyEmailsToAllCertificateHolders:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Alternative API to send apology emails by team IDs
const sendApologyEmailsByTeamIds = async (req, res) => {
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
        // Get all certificates for this team
        const [certificates] = await db.query(
          `SELECT c.*, comp.name AS competition_name 
           FROM Certificates c
           JOIN Competitions comp ON c.competition_id = comp.id
           WHERE c.team_id = ? AND comp.is_deleted = 0`,
          [team_id]
        );

        if (!certificates || certificates.length === 0) {
          failed.push({
            team_id,
            error: "No certificates found for this team"
          });
          continue;
        }

        // Send apology email to each certificate holder in the team
        for (const certificate of certificates) {
          const { 
            participant_name, 
            participant_email, 
            certificate_id, 
            competition_name 
          } = certificate;

          try {
            await sendApologyEmail({
              email: participant_email,
              name: participant_name,
              competitionName: competition_name,
              certificateId: certificate_id
            });

            results.push({
              team_id: team_id,
              email: participant_email,
              name: participant_name,
              certificateId: certificate_id,
              status: "success"
            });

          } catch (error) {
            console.error(`Error sending apology email to ${participant_email}:`, error);
            failed.push({
              team_id: team_id,
              email: participant_email,
              name: participant_name,
              certificateId: certificate_id,
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
      message: "Apology email sending completed",
      successful: results.length,
      failed: failed.length,
      results: results,
      failures: failed
    });

  } catch (error) {
    console.error('Error in sendApologyEmailsByTeamIds:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// API to send apology emails to ALL certificate holders in the database
const sendApologyEmailsToAllCertificateHoldersGlobal = async (req, res) => {
  try {
    const results = [];
    const failed = [];

    // Get ALL certificates from the database
    const [certificates] = await db.query(
      `SELECT c.*, comp.name AS competition_name 
       FROM Certificates c
       JOIN Competitions comp ON c.competition_id = comp.id
       WHERE comp.is_deleted = 0
       ORDER BY c.created_at DESC`
    );

    if (!certificates || certificates.length === 0) {
      return res.status(404).json({
        message: "No certificates found in the database"
      });
    }

    console.log(`Found ${certificates.length} certificates to process`);

    // Send apology email to each certificate holder
    for (const certificate of certificates) {
      const { 
        participant_name, 
        participant_email, 
        certificate_id, 
        competition_name,
        competition_id,
        team_id
      } = certificate;

      try {
        await sendApologyEmail({
          email: participant_email,
          name: participant_name,
          competitionName: competition_name,
          certificateId: certificate_id
        });

        results.push({
          competition_id: competition_id,
          team_id: team_id,
          email: participant_email,
          name: participant_name,
          certificateId: certificate_id,
          competition_name: competition_name,
          status: "success"
        });

        console.log(`Apology email sent to ${participant_email} - ${participant_name}`);

      } catch (error) {
        console.error(`Error sending apology email to ${participant_email}:`, error);
        failed.push({
          competition_id: competition_id,
          team_id: team_id,
          email: participant_email,
          name: participant_name,
          certificateId: certificate_id,
          competition_name: competition_name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Apology email sending to all certificate holders completed",
      total_certificates: certificates.length,
      successful: results.length,
      failed: failed.length,
      results: results,
      failures: failed
    });

  } catch (error) {
    console.error('Error in sendApologyEmailsToAllCertificateHoldersGlobal:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  sendApologyEmail,
  sendApologyEmailsToAllCertificateHolders,
  sendApologyEmailsByTeamIds,
  sendApologyEmailsToAllCertificateHoldersGlobal
};