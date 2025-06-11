const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises; // Promises API

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

async function generateCertificate(participantData) {
  const {
    name,
    competitionName,
    position = '',
    date = new Date().toLocaleDateString(),
    certificateId
  } = participantData;

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  // Create certificate PDF
  const certificatePath = path.join(uploadsDir, `certificate-${certificateId}.pdf`);
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape'
  });

  // Buffer to collect PDF content (instead of writing stream directly to file)
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', async () => {
    try {
      // Write PDF content to file after document generation
      const pdfBuffer = Buffer.concat(chunks);
      await fs.writeFile(certificatePath, pdfBuffer); // Save PDF to the file system
    } catch (err) {
      console.error('Error saving certificate:', err);
    }
  });

  // Set up PDF styling
  doc.fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#4F46E5')
    .text('Certificate of Achievement', {
      align: 'center',
      underline: true
    });

  // Add border
  doc.lineWidth(2)
    .strokeColor('#4F46E5')
    .rect(50, 50, doc.page.width - 100, doc.page.height - 100)
    .stroke();

  // Participant details
  doc.fontSize(36)
    .font('Helvetica')
    .fillColor('black')
    .text(name, {
      align: 'center',
      moveDown: 2
    });

  doc.fontSize(18)
    .text('for successfully participating in', { align: 'center' })
    .fontSize(24)
    .fillColor('#4F46E5')
    .text(competitionName, { align: 'center' });

  // Add position if provided
  if (position) {
    doc.fontSize(18)
      .fillColor('black')
      .text(`Securing ${position} Position`, { align: 'center' });
  }

  // Add date and certificate ID
  doc.fontSize(12)
    .text(`Date: ${date}`, {
      align: 'center',
      moveDown: 2
    })
    .text(`Certificate ID: ${certificateId}`, { align: 'center' });

  // Finalize PDF
  doc.end();

  return certificatePath;
}

async function sendCertificateEmail(emailData) {
  const {
    email,
    name,
    competitionName,
    certificatePath,
    certificateId
  } = emailData;

  const mailOptions = {
    from: 'competitionswsro@gmail.com',
    to: email,
    subject: `Your Certificate - ${competitionName}`,
    html: `<!-- HTML content for the email -->`,
    attachments: [
      {
        filename: `${name}-Certificate.pdf`,
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
