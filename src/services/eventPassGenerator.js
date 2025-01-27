const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Readable } = require('stream');

class EventPassGenerator {
  static async generateEventPass(data) {
    const qrCodeData = await QRCode.toDataURL(JSON.stringify({
      id: data.id,
      participant_id: data.participant_id,
      name: data.name,
      event: data.competition_name,
      role: data.role
    }));

    const doc = new PDFDocument({
      size: 'A6',
      margin: 0
    });

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
       .text('EVENT PASS', 0, 20, {
         align: 'center',
         width: 297.64
       });

    doc.fontSize(16)
       .fillColor(darkOrange)
       .text(data.competition_name, 0, 50, {
         align: 'center',
         width: 297.64
       });

    // Role badge
    doc.rect(20, 90, 257.64, 30)
       .fill(darkOrange);
    
    doc.fontSize(14)
       .fillColor('#FFFFFF')
       .text(data.role, 0, 98, {
         align: 'center',
         width: 297.64
       });

    // Participant information section
    doc.rect(20, 130, 257.64, 100)
       .fill(lightOrange);

    // Participant information
    doc.fillColor('#000000')
       .fontSize(12)
       .text('Name:', 40, 140)
       .fontSize(14)
       .text(data.name, 40, 160, { width: 217.64 })
       .fontSize(12)
       .text('ID:', 40, 185)
       .text(data.participant_id, 40, 205);

    // QR Code section
    doc.rect(20, 240, 257.64, 150)
       .fill(lightBlue);

    // QR Code
    doc.image(qrCodeData, 98.82, 250, { width: 100 });

    // Scan instructions
    doc.fontSize(10)
       .fillColor(darkBlue)
       .text('Scan for verification', 0, 360, {
         align: 'center',
         width: 297.64
       });

    // Footer
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Present this pass at the event entrance', 0, 390, {
         align: 'center',
         width: 297.64
       });

    // Instead of writing to file, create a buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}