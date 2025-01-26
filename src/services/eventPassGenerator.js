const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class EventPassGenerator {
  static async generateEventPass(data) {
    const qrCodeData = await QRCode.toDataURL(JSON.stringify({
      id: data.id,
      participant_id: data.participant_id,
      event: data.competition_name
    }));

    const doc = new PDFDocument({
      size: 'A6',
    });

    const filePath = path.join(__dirname, `../public/passes/${data.id}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    // Add event pass content
    doc.fontSize(16)
       .text('EVENT PASS', { align: 'center' });

    doc.fontSize(12)
       .text(`Name: ${data.name}`, 50, 100)
       .text(`Event: ${data.competition_name}`, 50, 120)
       .text(`ID: ${data.participant_id}`, 50, 140);

    doc.image(qrCodeData, 50, 170, { width: 100 });

    doc.end();
    return `/passes/${data.id}.pdf`;
  }
}

module.exports = EventPassGenerator;