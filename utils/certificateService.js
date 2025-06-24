const htmlToPdf = require('html-pdf-node');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Configure email transporter
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
        background: #731f15;
        padding: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }

      .certificate-border {
        width: 100%;
        height: 100%;
        border: 4px solid white;
        background: rgb(251, 250, 250);
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .certificate-inner {
        width: 100%;
        height: 100%;
        padding: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        box-sizing: border-box;
      }

      .header {
        text-align: center;
        flex-shrink: 0;
      }

      .wsro-logo-container {
        margin-bottom: 20px;
      }

      .logo-right {
        display: flex;
        justify-content: flex-end;
      }
      
      .wsro-logo {
        width: 45%;
        max-width: 300px;
        height: auto;
        object-fit: contain;
      }

      .certificate-title {
        font-size: 36px;
        font-weight: 500;
        color: #3e3c3c;
        margin-bottom: 10px;
        letter-spacing: 4px;
      }

      .participation-text {
        font-size: 18px;
        color: #414141;
        margin-bottom: 15px;
        letter-spacing: 3px;
      }

      .event-details {
        font-size: 18px;
        color: #333;
        margin-bottom: 15px;
        letter-spacing: 2px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .awarded-text {
        font-size: 14px;
        color: #666;
        margin-bottom: 15px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .participant-name {
        font-size: 28px;
        font-weight: bold;
        color: #333;
        padding-bottom: 8px;
        border-bottom: 2px dashed #731f15;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin-bottom: 5px;
      }

      .team-name {
        font-size: 16px;
        font-weight: 600;
        color: #731f15;
        margin-top: 5px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .content-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin: 20px 0;
      }

      .participation-details {
        text-align: center;
        font-weight: 500;
        font-size: 14px;
        color: #333;
        letter-spacing: 0.8px;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .signature-badge-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 0 20px;
        flex-shrink: 0;
      }

      .award-badge {
        height: 80px;
        width: auto;
        object-fit: contain;
      }

      .signature-image {
        height: 60px;
        width: auto;
        object-fit: contain;
      }

      .sponsors-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding: 0 10px;
        flex-shrink: 0;
      }

      .sponsor-logo {
        height: 50px;
        width: auto;
        object-fit: contain;
      }

      .footer-section {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        flex-shrink: 0;
      }

      .footer-right {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
      }

      .contact-info {
        font-size: 12px;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        text-align: left;
        line-height: 1.3;
        font-weight: 500;
      }

      .contact-info svg {
        background-color: #731f15;
        padding: 3px;
        border-radius: 2px;
      }

      .contact-info p {
        margin-top: 8px;
        font-weight: 500;
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
          padding: 15px;
        }

        .certificate-inner {
          padding: 30px;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="certificate-border">
        <div class="certificate-inner">
          <!-- Header with WSRO Logo -->
          <div class="header">
            <div class="wsro-logo-container">
              <div class="logo-right">
                <img
                  src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a29000921fb3e0f/view?project=67aee32f0028febbce2c&"
                  alt="WSRO Logo"
                  class="wsro-logo"
                />
              </div>
            </div>

            <div class="certificate-title">CERTIFICATE</div>
            <div class="participation-text">OF PARTICIPATION</div>
            <div class="event-details">(${certificateData.competitionName.toUpperCase()})</div>
            <div class="awarded-text">This certificate is awarded to</div>

            <div class="participant-name">${certificateData.participantName}</div>
            ${certificateData.teamName ? `<div class="team-name">Team: ${certificateData.teamName}</div>` : ''}
          </div>

          <!-- Main Content -->
          <div class="content-section">
            <div class="participation-details">
              In recognition of active participation in the <br />
              <strong>${certificateData.competitionName}</strong>, conducted on
              ${competitionDate} <br />at
              <strong>${certificateData.venue}</strong>
              ${certificateData.position ? `<br /><br />Position: <strong>${certificateData.position}</strong>` : ''}
            </div>
          </div>

          <!-- Signature and Badge Section -->
          <div class="signature-badge-section">
            <img
              src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a00000b2df78936/view?project=67aee32f0028febbce2c&"
              alt="WSRO Award Badge"
              class="award-badge"
            />

            <div class="signature-section">
              <img
                src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/684f2a30002b5fd714e2/view?project=67aee32f0028febbce2c&"
                alt="Signature"
                class="signature-image"
              />
            </div>
          </div>

          <!-- Sponsors Section -->
          <div class="sponsors-section">
            <img
              src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/685a8dee002201cf14be/view?project=67aee32f0028febbce2c&"
              alt="Chiripal"
              class="sponsor-logo"
            />
            <img
              src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/68516ae5002d14f601e7/view?project=67aee32f0028febbce2c&"
              alt="Happiness"
              class="sponsor-logo"
            />
            <img
              src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/685a8ddc001de00152a8/view?project=67aee32f0028febbce2c&"
              alt="Science City"
              class="sponsor-logo"
            />
            <img
              src="http://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/685a8de500184129eb9c/view?project=67aee32f0028febbce2c&"
              alt="DST"
              class="sponsor-logo"
            />
          </div>
          
          <!-- Footer -->
          <div class="footer-section">
            <div class="footer-right">
              <div class="contact-info">
                <!-- Phone -->
                <p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M6.62 10.79a15.464 15.464 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.48 2.53.74 3.88.74a1 1 0 011 1v3.49a1 1 0 01-1 1C9.94 22 2 14.06 2 4.5a1 1 0 011-1h3.49a1 1 0 011 1c0 1.35.25 2.68.74 3.88a1 1 0 01-.21 1.11l-2.2 2.2z"/>
                  </svg>
                  +91 99044 63224, +91 81287 28882
                </p>
            
                <!-- Email -->
                <p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  www.wsro.in, info@wsro.in
                </p>
            
                <!-- Location -->
                <p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
                  </svg>
                  Happiness Reserves Foundation, Ahmedabad, India - 380058
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  // Configure PDF options - optimized for single page
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
    width: '210mm'
  };

  // Create file object for html-pdf-node
  const file = { content: htmlContent };

  // Generate PDF
  const pdfBuffer = await htmlToPdf.generatePdf(file, options);

  // Create certificate PDF
  const certificatePath = path.join(uploadsDir, `certificate-${certificateData.certificateId}.pdf`);
  await fs.writeFile(certificatePath, pdfBuffer);

  return certificatePath;
}

async function sendCertificateEmail(emailData) {
  const { email, name, competitionName, certificatePath, certificateId } = emailData;

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `Your Certificate - ${competitionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #731f15;">Congratulations ${name}!</h2>
        <p>Thank you for participating in <strong>${competitionName}</strong>.</p>
        <p>Please find your certificate of participation attached to this email.</p>
        <p>Certificate ID: <strong>${certificateId}</strong></p>
        <br>
        <p>Best regards,<br>WSRO Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Contact: +91 99044 63224, +91 81287 28882<br>
          Email: info@wsro.in | Website: www.wsro.in
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${name.replace(/[^a-zA-Z0-9]/g, '_')}-Certificate.pdf`,
        path: certificatePath
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = {
  generateCertificate,
  sendCertificateEmail
};