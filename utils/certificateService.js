const htmlToPdf = require('html-pdf-node');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Configure email transporter
const transporter = nodemailer.createTransporter({
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
        background-image: url('https://fra.cloud.appwrite.io/v1/storage/buckets/67aee35f000b324ca10c/files/685c0aee003e37dfc5fa/view?project=67aee32f0028febbce2c&mode=admin');
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
        padding: 50px;
        box-sizing: border-box;
      }

      .certificate-title {
        font-size: 48px;
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
        font-size: 20px;
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
        border-bottom: 3px solid #731f15;
        margin-bottom: 30px;
        min-width: 400px;
        font-family: "Times New Roman", serif;
      }

      .participation-details {
        font-size: 16px;
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
        bottom: 20px;
        right: 30px;
        font-size: 12px;
        color: #888;
        font-family: monospace;
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

      /* Responsive adjustments for different screen sizes */
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
          <strong>WSRO Regional Competition</strong>, conducted on
          <span class="competition-date">${competitionDate}</span><br />
          at <span class="venue">${certificateData.venue}</span>
        </div>
        
        <!-- Certificate ID -->
        <div class="certificate-id">Certificate ID: ${certificateData.certificateId}</div>
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
    const certificatePath = path.join(uploadsDir, `certificate-${certificateData.certificateId}.pdf`);
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
    subject: `Your Certificate - ${competitionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #731f15; margin-bottom: 10px;">🎉 Congratulations ${name}! 🎉</h2>
          <div style="width: 50px; height: 3px; background: #731f15; margin: 0 auto;"></div>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Thank you for your outstanding participation in <strong style="color: #731f15;">${competitionName}</strong>.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Your dedication and enthusiasm made this competition a great success!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Please find your <strong>Certificate of Participation</strong> attached to this email.
          </p>
        </div>
        
        <div style="background: #731f15; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; font-family: monospace;">
            <strong>Certificate ID: ${certificateId}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            Keep this certificate as a token of your achievement!
          </p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
            <strong>Best regards,</strong><br>
            <span style="color: #731f15;">WSRO Team</span>
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
            📞 <strong>Contact:</strong> +91 99044 63224, +91 81287 28882
          </p>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
            📧 <strong>Email:</strong> info@wsro.in | 🌐 <strong>Website:</strong> www.wsro.in
          </p>
          <p style="font-size: 12px; color: #666; margin: 0;">
            📍 <strong>Address:</strong> Happiness Reserves Foundation, Ahmedabad, India - 380058
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${name.replace(/[^a-zA-Z0-9]/g, '_')}-Certificate-${certificateId}.pdf`,
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

// Example usage function
async function createAndSendCertificate(participantData) {
  try {
    // Sample certificate data
    const certificateData = {
      participantName: participantData.name,
      competitionDate: participantData.competitionDate || new Date(),
      venue: participantData.venue || 'Saraswat Vidyalaya Mapusa, Goa',
      certificateId: participantData.certificateId || `WSRO-${Date.now()}`
    };

    // Generate certificate
    const certificatePath = await generateCertificate(certificateData);

    // Send email if email is provided
    if (participantData.email) {
      const emailData = {
        email: participantData.email,
        name: participantData.name,
        competitionName: 'WSRO Regional Competition',
        certificatePath: certificatePath,
        certificateId: certificateData.certificateId
      };

      await sendCertificateEmail(emailData);
    }

    return {
      success: true,
      certificatePath: certificatePath,
      certificateId: certificateData.certificateId
    };
  } catch (error) {
    console.error('Error in certificate generation process:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateCertificate,
  sendCertificateEmail,
  createAndSendCertificate
};
