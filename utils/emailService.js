const nodemailer = require('nodemailer');
const EventPassGenerator = require('../src/services/eventPassGenerator');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'competitionswsro@gmail.com',
    pass: 'hxvg uavf bybs rczm'
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

// Individual email for each participant with their own event pass
const sendParticipantEmail = async ({ email, name, team_name, team_code, participant_id, competition_name, event_name }) => {
  // Generate event pass for this participant
  const eventPassBuffer = await EventPassGenerator.generateEventPass({
    id: `${team_code}-${participant_id.slice(-2)}`, // Using last two characters of participant ID
    participant_id: participant_id,
    name: name,
    competition_name: competition_name,
    role: 'Participant' // Everyone is a participant
  });

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `🎉 Your Event Pass for ${competition_name}`,
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
            <h1 style="color: #1E88E5; margin: 0; font-size: 28px;">Your Event Pass</h1>
            <p style="color: #FB8C00; font-size: 18px; margin-top: 10px;">${competition_name}</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="background-color: #FFE0B2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #FB8C00; margin: 0; font-size: 20px;">Hello ${name}!</h2>
              <p style="margin: 10px 0;">You have been registered for team: <strong>${team_name}</strong></p>
              <p style="margin: 10px 0;">Team Code: <strong style="color: #1E88E5; background-color: #E3F2FD; padding: 4px 8px; border-radius: 4px;">${team_code}</strong></p>
              <p style="margin: 10px 0;">Your Participant ID: <strong style="color: #1E88E5; background-color: #E3F2FD; padding: 4px 8px; border-radius: 4px;">${participant_id}</strong></p>
            </div>

            <!-- Event Pass Information -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #E3F2FD; border-radius: 8px;">
              <h3 style="color: #1E88E5; margin-bottom: 15px;">Your Event Pass</h3>
              <p style="color: #666; font-size: 14px; margin: 0;">
                Your personal event pass is attached to this email. It includes a QR code that will be used for event check-in.
                Please keep it safe and present it on the day of the event.
              </p>
            </div>

            <!-- Important Information -->
            <div style="background-color: #fff; border: 2px solid #E3F2FD; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1E88E5; margin-top: 0;">Next Steps:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">Save your team code: <strong>${team_code}</strong></li>
                <li style="margin-bottom: 10px;">Print or keep a digital copy of your event pass</li>
                <li style="margin-bottom: 10px;">Check your email for updates about the event</li>
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
    attachments: [{
      filename: `event-pass-${participant_id}.pdf`,
      content: eventPassBuffer,
      contentType: 'application/pdf'
    }]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Event pass sent to ${email} successfully.`);
  } catch (error) {
    console.error(`Failed to send event pass to ${email}:`, error);
    throw new Error(`Failed to send event pass to ${email}.`);
  }
};

// Team summary email sent to the coach/mentor
const sendTeamSummaryEmail = async ({ email, team_name, team_code, competition_name, event_name, members }) => {
  const memberDetails = members
    .map((member, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #E3F2FD;">
          ${index + 1}. ${member.name}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #E3F2FD;">
          ${member.email}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #E3F2FD;">
          ${member.participant_id}
        </td>
      </tr>
    `)
    .join('');

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `🎉 Team Registration Summary for ${competition_name}`,
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
            <h1 style="color: #1E88E5; margin: 0; font-size: 28px;">Team Registration Summary</h1>
            <p style="color: #FB8C00; font-size: 18px; margin-top: 10px;">${competition_name}</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="background-color: #FFE0B2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #FB8C00; margin: 0; font-size: 20px;">Team Information</h2>
              <p style="margin: 10px 0;">Team Name: <strong>${team_name}</strong></p>
              <p style="margin: 10px 0;">Team Code: <strong style="color: #1E88E5; background-color: #E3F2FD; padding: 4px 8px; border-radius: 4px;">${team_code}</strong></p>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #1E88E5; font-size: 20px;">Team Members</h2>
              <p>All team members have been sent their individual event passes to their email addresses.</p>
              <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #E3F2FD;">
                    <th style="padding: 12px 8px; text-align: left;">Name</th>
                    <th style="padding: 12px 8px; text-align: left;">Email</th>
                    <th style="padding: 12px 8px; text-align: left;">ID</th>
                  </tr>
                </thead>
                <tbody>
                  ${memberDetails}
                </tbody>
              </table>
            </div>

            <!-- Important Information -->
            <div style="background-color: #fff; border: 2px solid #E3F2FD; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1E88E5; margin-top: 0;">Coach/Mentor Information:</h3>
              <p>As the coach/mentor, please ensure that:</p>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">All team members have received their event passes</li>
                <li style="margin-bottom: 10px;">Everyone knows the team code: <strong>${team_code}</strong></li>
                <li style="margin-bottom: 10px;">Team members are informed of any updates</li>
                <li style="margin-bottom: 10px;">Check your email for any important announcements</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #E3F2FD; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Need help? Contact us at <a href="mailto:support@binarysolutions.com" style="color: #1E88E5; text-decoration: none;">support@binarysolutions.com</a>
            </p>
            <div style="margin-top: 15px;">
              <p style="color: #FB8C00; margin: 0;">Best of luck to your team! 🚀</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Team summary email sent to ${email} successfully.`);
  } catch (error) {
    console.error(`Failed to send team summary email to ${email}:`, error);
    throw new Error(`Failed to send team summary email to ${email}.`);
  }
};

// For backward compatibility
const sendRegistrationEmail = async ({ email, name, team_name, team_code, participant_id, competition_name, event_name }) => {
  await sendParticipantEmail({
    email,
    name,
    team_name,
    team_code,
    participant_id,
    competition_name,
    event_name
  });
};

module.exports = {
  verifyEmailConnection,
  sendRegistrationEmail,
  sendParticipantEmail,
  sendTeamSummaryEmail
};