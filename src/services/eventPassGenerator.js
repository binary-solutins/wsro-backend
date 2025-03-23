const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class EventPassGenerator {
  static async generateEventPass(data) {
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify({
      id: data.id,
      participant_id: data.participant_id,
      name: data.name,
      event: data.competition_name,
      role: data.role
    }), {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 6
    });

    // Set paths for assets
    const logoPath = path.join(__dirname, 'assests', 'images', 'logo.jpg');
    
    // Set paths for Poppins font files
    const poppinsRegularPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Regular.ttf');
    const poppinsBoldPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Bold.ttf');
    const poppinsMediumPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Medium.ttf');

    // Document dimensions (ID card style)
    const width = 242; // ~3.4 inches
    const height = 383; // ~5.3 inches
    
    // Create a PDF with ID card dimensions
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0,
      autoFirstPage: true
    });

    // Register fonts
    doc.registerFont('PoppinsRegular', poppinsRegularPath);
    doc.registerFont('PoppinsBold', poppinsBoldPath);
    doc.registerFont('PoppinsMedium', poppinsMediumPath);

    // Color scheme (orange accent like the example)
    const colors = {
      primary: '#F05A28', // Orange
      white: '#FFFFFF',
      light: '#F8F8F8',
      dark: '#333333',
      gray: '#888888'
    };

    // Create white background
    doc.rect(0, 0, width, height).fill(colors.white);

    // Left sidebar with role
    doc.rect(0, 0, 60, height).fill(colors.primary);
    
    // "PARTICIPANT" text (vertical on left side)
    doc.save();
    doc.translate(30, height - 30);
    doc.rotate(-90);
    doc.font('PoppinsBold')
      .fontSize(18)
      .fillColor(colors.white)
      .text("PARTICIPANT", 0, 0, {
        align: 'center',
        width: height - 60
      });
    doc.restore();

    // Event logo at top-right section
    doc.image(logoPath, 90, 30, {
      width: 120,
      height: 60,
      fit: [120, 60],
      align: 'center'
    });

    // Competition name (single line)
    doc.font('PoppinsBold')
      .fontSize(16)
      .fillColor(colors.primary)
      .text(data.competition_name, 70, 100, {
        width: 162,
        align: 'center'
      });

    // Horizontal line separator
    doc.strokeColor(colors.gray)
      .lineWidth(1)
      .moveTo(70, 130)
      .lineTo(232, 130)
      .stroke();

    // Participant name (medium size)
    doc.font('PoppinsMedium')
      .fontSize(14)
      .fillColor(colors.dark)
      .text("Name:", 70, 150);
      
    doc.font('PoppinsRegular')
      .fontSize(14)
      .fillColor(colors.dark)
      .text(data.name, 70, 170, {
        width: 162
      });

    // Participant ID (medium size)
    doc.font('PoppinsMedium')
      .fontSize(14)
      .fillColor(colors.dark)
      .text("ID:", 70, 200);
      
    doc.font('PoppinsRegular')
      .fontSize(14)
      .fillColor(colors.dark)
      .text(data.participant_id, 70, 220, {
        width: 162
      });

    // Access level
    doc.roundedRect(70, 250, 162, 25, 5)
      .fill(colors.primary);
      
    doc.font('PoppinsBold')
      .fontSize(14)
      .fillColor(colors.white)
      .text('EVENT ACCESS', 70, 255, {
        width: 162,
        align: 'center'
      });

    // QR code at bottom
    doc.image(qrCodeBuffer, 101, 290, {
      width: 80,
      height: 80
    });

    // Small decoration hole at top
    doc.circle(width / 2, 10, 7)
      .fill('#EEEEEE');
    doc.circle(width / 2, 10, 5)
      .fill(colors.white);

    // Create PDF buffer and save
    return new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}

module.exports = EventPassGenerator;