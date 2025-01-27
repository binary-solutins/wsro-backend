const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
const EventPassGenerator = require('../src/services/eventPassGenerator');
const fs = require('fs').promises;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'binarysolutions0000@gmail.com',
    pass: 'volw mohh opdb llpi'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Function to generate and save QR code
const generateQRCode = async (data, teamCode) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    const qrCodePath = path.join(uploadsDir, `qr-${teamCode}.png`);

    await QRCode.toFile(qrCodePath, JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#4F46E5',
        light: '#FFFFFF'
      }
    });

    return qrCodePath;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};


const verifyEmailConnection = async () => {
  try {
    const verification = await transporter.verify();
    console.log('SMTP connection verified:', verification);
    return verification;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    throw error;
  }
};

const sendRegistrationEmail = async (
  leaderEmail,
  teamName,
  teamCode,
  competitionName,
  members
) => {
  const memberDetails = members
    .map((member, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #E3F2FD;">
          ${index + 1}. ${member.name}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #E3F2FD;">
          ${member.email}
        </td>
      </tr>
    `)
    .join('');

  const teamData = {
    teamName,
    teamCode,
    competitionName,
    leaderEmail,
    members,
  };

  try {
    // Generate badge for team leader
    const badgeData = {
      id: `${teamCode}-${members[0].name.replace(/\s+/g, '-')}`.toLowerCase(),
      participant_id: `P-${teamCode}-1`,
      competition_name: competitionName,
      name: members[0].name,
      teamName: teamName,
      teamCode: teamCode
    };

    const badgePath = await EventPassGenerator.generateEventPass(badgeData);
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(teamData));

    const mailOptions = {
      from: 'binarysolutions0000@gmail.com',
      to: leaderEmail,
      subject: `🎉 Registration Confirmation for ${competitionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #E3F2FD; padding: 30px; text-align: center; border-bottom: 4px solid #1E88E5;">
              <h1 style="color: #1E88E5; margin: 0; font-size: 28px;">Registration Confirmed!</h1>
              <p style="color: #FB8C00; font-size: 18px; margin-top: 10px;">${competitionName}</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px; background-color: #ffffff;">
              <div style="background-color: #FFE0B2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #FB8C00; margin: 0; font-size: 20px;">Team Information</h2>
                <p style="margin: 10px 0;">Team Name: <strong>${teamName}</strong></p>
                <p style="margin: 10px 0;">Team Code: <strong style="color: #1E88E5; background-color: #E3F2FD; padding: 4px 8px; border-radius: 4px;">${teamCode}</strong></p>
              </div>

              <div style="margin-bottom: 25px;">
                <h2 style="color: #1E88E5; font-size: 20px;">Team Members</h2>
                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #E3F2FD;">
                      <th style="padding: 12px 8px; text-align: left;">Name</th>
                      <th style="padding: 12px 8px; text-align: left;">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${memberDetails}
                  </tbody>
                </table>
              </div>

              <!-- Important Information -->
              <div style="background-color: #fff; border: 2px solid #E3F2FD; padding: 20px; border-radius: 8px;">
                <h3 style="color: #1E88E5; margin-top: 0;">Next Steps:</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                  <li style="margin-bottom: 10px;">Save your team code: <strong>${teamCode}</strong></li>
                  <li style="margin-bottom: 10px;">Download and save your event badge from the attachments</li>
                  <li style="margin-bottom: 10px;">Share team details with all members</li>
                  <li style="margin-bottom: 10px;">Check your email for updates</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #E3F2FD; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@binarysolutions.com" style="color: #1E88E5; text-decoration: none;">support@binarysolutions.com</a>
              </p>
              <div style="margin-top: 15px;">
                <p style="color: #FB8C00; margin: 0;">Best of luck! 🚀</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${teamName}-EventBadge.pdf`,
          path: badgePath,
          contentType: 'application/pdf'
        }
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Registration email with event badge sent successfully.');
  } catch (error) {
    console.error('Failed to send registration email:', error);
    throw new Error('Failed to send registration email.');
  }
};

module.exports = {
  verifyEmailConnection,
  sendRegistrationEmail,
};