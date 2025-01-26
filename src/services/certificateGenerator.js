const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  static async generateCertificate(data) {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    const filePath = path.join(__dirname, `../public/certificates/${data.id}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    // Add certificate content
    doc.font('Helvetica-Bold')
       .fontSize(30)
       .text('Certificate of Participation', 0, 100, { align: 'center' });

    doc.fontSize(20)
       .text(`This is to certify that`, 0, 180, { align: 'center' });

    doc.fontSize(25)
       .text(data.name, 0, 220, { align: 'center' });

    doc.fontSize(20)
       .text(`has successfully participated in`, 0, 260, { align: 'center' });

    doc.fontSize(25)
       .text(data.competition_name, 0, 300, { align: 'center' });

    doc.fontSize(15)
       .text(`Date: ${new Date().toLocaleDateString()}`, 0, 400, { align: 'center' });

    doc.end();
    return `/certificates/${data.id}.pdf`;
  }
}

module.exports = CertificateGenerator;