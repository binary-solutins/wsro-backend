const nodemailer = require('nodemailer');
const EventPassGenerator = require('../src/services/eventPassGenerator');

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

  // Generate event passes for all team members
  const eventPassesPromises = [
    // Generate leader's pass
    EventPassGenerator.generateEventPass({
      id: `${teamCode}-L`,
      participant_id: `${teamCode}-P00`,
      name: teamName,
      competition_name: competitionName,
      role: 'Team Leader'
    }),
    // Generate member passes
    ...members.map((member, index) => 
      EventPassGenerator.generateEventPass({
        id: `${teamCode}-M${index + 1}`,
        participant_id: `${teamCode}-P${(index + 1).toString().padStart(2, '0')}`,
        name: member.name,
        competition_name: competitionName,
        role: 'Team Member'
      })
    )
  ];

  const eventPassesBuffers = await Promise.all(eventPassesPromises);
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

            <!-- Event Pass Information -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #E3F2FD; border-radius: 8px;">
              <h3 style="color: #1E88E5; margin-bottom: 15px;">Event Passes</h3>
              <p style="color: #666; font-size: 14px; margin: 0;">
                Your team's event passes are attached to this email. Each member has their own unique pass with a QR code for event check-in.
                Please distribute the passes to respective team members.
              </p>
            </div>

            <!-- Important Information -->
            <div style="background-color: #fff; border: 2px solid #E3F2FD; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1E88E5; margin-top: 0;">Next Steps:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">Save your team code: <strong>${teamCode}</strong></li>
                <li style="margin-bottom: 10px;">Distribute event passes to team members</li>
                <li style="margin-bottom: 10px;">Print or keep digital copies of event passes</li>
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
    attachments: eventPassesBuffers.map((buffer, index) => ({
      filename: index === 0 ? 'team-leader-pass.pdf' : `team-member-${index}-pass.pdf`,
      content: buffer,
      contentType: 'application/pdf'
    }))
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Registration email with event passes sent successfully.');
  } catch (error) {
    console.error('Failed to send registration email with event passes:', error);
    throw new Error('Failed to send registration email with event passes.');
  }
};


module.exports = {
  verifyEmailConnection,
  sendRegistrationEmail,
};