const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
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
    .map((member, index) => `<li>${index + 1}. ${member.name} (${member.email})</li>`)
    .join('');

  const teamData = {
    teamName,
    teamCode,
    competitionName,
    leaderEmail,
    members,
  };

  try {
    // Generate QR Code as a Data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(teamData));

    const mailOptions = {
      from: 'binarysolutions0000@gmail.com',
      to: leaderEmail,
      subject: `Registration Confirmation for ${competitionName}`,
      html: `
        <h1>Registration Confirmation</h1>
        <p>Dear ${teamName},</p>
        <p>Thank you for registering for the competition: <strong>${competitionName}</strong>.</p>
        <p>Your team code is: <strong>${teamCode}</strong></p>
        <p><strong>Team Members:</strong></p>
        <ul>
          ${memberDetails}
        </ul>
        <p>Attached is a QR code containing your team details for the competition.</p>
        <p>We wish you the best of luck!</p>
        <p>Best regards,</p>
        <p>The Competition Team</p>
      `,
      attachments: [
        {
          filename: 'team-details-qr.png',
          content: qrCodeDataURL.split(',')[1],
          encoding: 'base64',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Registration email with QR code sent successfully.');
  } catch (error) {
    console.error('Failed to send registration email with QR code:', error);
    throw new Error('Failed to send registration email with QR code.');
  }
};

module.exports = {
  verifyEmailConnection,
  sendRegistrationEmail,
};