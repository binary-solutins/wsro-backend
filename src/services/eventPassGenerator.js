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
    // Note: 'assests' typo preserved from original code to maintain compatibility
    const logoPath = path.join(__dirname, 'assests', 'images', 'logo.jpg');

    // Set paths for Poppins font files
    const poppinsRegularPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Regular.ttf');
    const poppinsBoldPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Bold.ttf');
    const poppinsMediumPath = path.join(__dirname, 'assests', 'fonts', 'Poppins-Medium.ttf');

    // Document dimensions (Standard ID card size: 2.125" x 3.375" approx)
    // Using slightly larger layout from original code but refined
    const width = 242;
    const height = 383;

    // Create a PDF
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0,
      autoFirstPage: true
    });

    // Register fonts
    try {
      doc.registerFont('PoppinsRegular', poppinsRegularPath);
      doc.registerFont('PoppinsBold', poppinsBoldPath);
      doc.registerFont('PoppinsMedium', poppinsMediumPath);
    } catch (e) {
      // Fallback if custom fonts fail
      doc.font('Helvetica');
      console.warn("Custom fonts not found, using Helvetica");
    }

    // Color scheme
    const colors = {
      primary: '#F05A28',   // Orange
      secondary: '#1E88E5', // Blue (complementary)
      text: '#222222',
      textLight: '#666666',
      white: '#FFFFFF',
      bgLight: '#FAFAFA',
      border: '#E0E0E0'
    };

    // --- Background ---
    doc.rect(0, 0, width, height).fill(colors.white);

    // Subtle gradient-like top header bar
    doc.rect(0, 0, width, 55).fill(colors.white); // Clear background for logo area

    // --- Logo ---
    // Centered at top
    try {
      doc.image(logoPath, (width - 100) / 2, 10, {
        width: 100,
        height: 45,
        fit: [100, 45],
        align: 'center'
      });
    } catch (e) {
      console.warn("Logo not found");
    }

    // --- Competition Name ---
    const compNameY = 65;
    doc.font('PoppinsBold')
      .fontSize(13)
      .fillColor(colors.primary)
      .text(data.competition_name.toUpperCase(), 10, compNameY, {
        width: width - 20,
        align: 'center',
        characterSpacing: 0.5
      });

    // --- Separator ---
    doc.moveTo(40, compNameY + 35)
      .lineTo(width - 40, compNameY + 35)
      .lineWidth(0.5)
      .strokeColor(colors.border)
      .stroke();

    // --- Participant Section ---
    let currentY = compNameY + 50;

    // "PARTICIPANT" Tag
    doc.rect((width - 100) / 2, currentY, 100, 18)
      .fillAndStroke(colors.secondary, colors.secondary)
      .fill();

    doc.font('PoppinsMedium')
      .fontSize(9)
      .fillColor(colors.white)
      .text("PARTICIPANT", 0, currentY + 4, {
        width: width,
        align: 'center',
        characterSpacing: 1
      });

    currentY += 35;

    // Name
    doc.font('PoppinsBold')
      .fontSize(16)
      .fillColor(colors.text)
      .text(data.name, 15, currentY, {
        width: width - 30,
        align: 'center'
      });

    currentY += 25;

    // ID
    doc.font('PoppinsRegular')
      .fontSize(10)
      .fillColor(colors.textLight)
      .text(`ID: ${data.participant_id}`, 15, currentY, {
        width: width - 30,
        align: 'center'
      });

    // --- Footer/Bottom Section ---

    // QR Code Box
    const qrSize = 90;
    const qrY = height - 135;

    // Draw container for QR
    doc.roundedRect((width - qrSize) / 2 - 5, qrY - 5, qrSize + 10, qrSize + 10, 8)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();

    doc.image(qrCodeBuffer, (width - qrSize) / 2, qrY, {
      width: qrSize,
      height: qrSize
    });

    // "Scan to Verify"
    doc.font('PoppinsRegular')
      .fontSize(8)
      .fillColor(colors.textLight)
      .text("Scan to Verify", 0, qrY + qrSize + 10, {
        width: width,
        align: 'center'
      });

    // Bottom Color Bar
    doc.rect(0, height - 12, width, 12).fill(colors.primary);

    // Punch Hole marker (optional, subtle)
    doc.circle(width / 2, 12, 3)
      .fillOpacity(0.2)
      .fill(colors.textLight);
    doc.fillOpacity(1); // Reset opacity

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