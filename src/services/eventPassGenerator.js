const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path'); 

class EventPassGenerator {
  static async generateEventPass(data) {
    // Generate QR code as a Buffer
    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify({
      id: data.id,
      participant_id: data.participant_id,
      name: data.name,
      event: data.competition_name,
      role: data.role
    }));

    // Set the path for your local logo image
    const logoPath = path.join(__dirname, 'assests', 'images', 'logo.jpg'); // Change this path based on your local setup

    const doc = new PDFDocument({
      size: 'A6',
      margin: 0
    });

    // Color Palette
    const colors = {
      background: '#F0F4F8',
      primaryBlue: '#1E3A8A',
      secondaryBlue: '#3B82F6',
      accentOrange: '#F97316',
      textDark: '#1F2937',
      textLight: '#F9FAFB'
    };

    // Background
    doc.rect(0, 0, 297.64, 420)
       .fill(colors.background);

    // Header with Logo
    const logoWidth = 80;  // Width of the logo
    const logoHeight = 50; // Height of the logo
    const logoX = (297.64 - logoWidth) / 2;  // Center the logo horizontally
    const logoY = 20;  // Position the logo at the top

    // Pass the local logo image path to pdfkit's .image() method
    doc.image(logoPath, logoX, logoY, { 
      width: logoWidth, 
      height: logoHeight
    });

    // Event Name (Placed after the logo)
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor(colors.primaryBlue)
       .text(data.competition_name, 0, logoY + logoHeight + 10, {  // Add a small gap after the logo
         align: 'center',
         width: 297.64
       });

    // Decorative Line
    doc.strokeColor(colors.secondaryBlue)
       .lineWidth(2)
       .moveTo(20, logoY + logoHeight + 40) // Line starts below the competition name
       .lineTo(277.64, logoY + logoHeight + 40)
       .stroke();

    // Role Badge
    doc.rect(20, logoY + logoHeight + 50, 257.64, 40)
       .fill(colors.accentOrange);
    
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor(colors.textLight)
       .text(data.role, 0, logoY + logoHeight + 60, {
         align: 'center',
         width: 297.64
       });

    // Participant Information Section
    doc.font('Helvetica')
       .fillColor(colors.textDark)
       .fontSize(12)
       .text('Name:', 40, logoY + logoHeight + 110)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(data.name, 40, logoY + logoHeight + 130, { width: 217.64 })
       .font('Helvetica')
       .fontSize(12)
       .text('Participant ID:', 40, logoY + logoHeight + 160)
       .font('Helvetica-Bold')
       .text(data.participant_id, 40, logoY + logoHeight + 180);

    // QR Code Section
    doc.rect(20, logoY + logoHeight + 210, 257.64, 130)
       .fill('#FFFFFF')
       .strokeColor(colors.secondaryBlue)
       .lineWidth(1)
       .stroke();

    // QR Code: Pass the QR Code Buffer here
    doc.image(qrCodeBuffer, 98.82, logoY + logoHeight + 220, { width: 100 });

    // Scan Instructions
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(colors.primaryBlue)
       .text('Scan for Event Verification', 0, logoY + logoHeight + 360, {
         align: 'center',
         width: 297.64
       });

    // Footer
    doc.fontSize(8)
       .fillColor('#6B7280')
       .text('Official Event Pass - Keep Safe', 0, logoY + logoHeight + 380, {
         align: 'center',
         width: 297.64
       });

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
