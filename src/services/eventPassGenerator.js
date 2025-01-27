const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class EventPassGenerator {
  static async generateEventPass(data) {
    const qrCodeData = await QRCode.toDataURL(JSON.stringify({
      id: data.id,
      participant_id: data.participant_id,
      event: data.competition_name,
      teamCode: data.teamCode,
      teamName: data.teamName
    }));

    const doc = new PDFDocument({
      size: 'A6',
      margin: 0
    });

    const filePath = path.join(__dirname, `../public/passes/${data.id}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    // Colors
    const lightBlue = '#E3F2FD';
    const darkBlue = '#1E88E5';
    const lightOrange = '#FFE0B2';
    const darkOrange = '#FB8C00';

    // Header background
    doc.rect(0, 0, 297.64, 80)
       .fill(lightBlue);

    // Event name header
    doc.fontSize(24)
       .fillColor(darkBlue)
       .text(data.competition_name, 0, 20, {
         align: 'center',
         width: 297.64
       });
    
    doc.fontSize(16)
       .fillColor(darkOrange)
       .text('EVENT PASS', 0, 50, {
         align: 'center',
         width: 297.64
       });

    // Main content section
    doc.rect(20, 100, 257.64, 160)
       .fill(lightOrange);

    // Participant information
    doc.fillColor('#000000')
       .fontSize(14)
       .text('TEAM & PARTICIPANT DETAILS', 40, 110);

    doc.fontSize(12)
       .text(`Name: ${data.name}`, 40, 135)
       .text(`Team Name: ${data.teamName}`, 40, 155)
       .text(`Team Code: ${data.teamCode}`, 40, 175)
       .text(`ID: ${data.participant_id}`, 40, 195);

    // QR Code section
    doc.rect(20, 280, 257.64, 150)
       .fill(lightBlue);

    // QR Code
    doc.image(qrCodeData, 98.82, 290, { width: 100 });

    // Scan instructions
    doc.fontSize(10)
       .fillColor(darkBlue)
       .text('Scan QR code for verification', 0, 400, {
         align: 'center',
         width: 297.64
       });

    // Footer
    doc.fontSize(8)
       .fillColor('#666666')
       .text('This pass must be presented at the event entrance', 0, 420, {
         align: 'center',
         width: 297.64
       });

    doc.end();
    return filePath;
  }
}

module.exports = EventPassGenerator;