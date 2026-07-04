const PDFDocument = require('pdfkit');

/**
 * Generates an elegant school fee receipt PDF.
 * @param {object} payment Payment document
 * @param {object} parent Parent user metadata
 * @param {object} student Student user metadata
 * @returns {Promise<Buffer>} Generated PDF file buffer
 */
const generateReceiptPDF = (payment, parent, student) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Header section
    doc
      .fillColor('#1e3a8a')
      .fontSize(20)
      .text('ECOLE PRIVEE ZITOUNI', { align: 'center', underline: true })
      .fontSize(10)
      .fillColor('#4b5563')
      .text('Alger, Algérie', { align: 'center' })
      .text('Contact: contact@ecole-zitouni.dz | Tel: +213 (0) 23 45 67 89', { align: 'center' })
      .moveDown(2);

    // Document Title
    doc
      .fillColor('#0f172a')
      .fontSize(16)
      .text(`RECU DE PAIEMENT / PAYMENT RECEIPT`, { align: 'left' })
      .fontSize(10)
      .text(`Facture N°: ${payment._id.toString().toUpperCase()}`)
      .text(`Date de paiement: ${new Date(payment.paidAt || Date.now()).toLocaleDateString('fr-FR')}`)
      .moveDown(1.5);

    // Metadata grid (Parent & Student details)
    doc
      .fontSize(12)
      .fillColor('#1e3a8a')
      .text('Informations Client / Client Info', { underline: true })
      .fontSize(10)
      .fillColor('#1f2937')
      .text(`Parent: ${parent.firstName} ${parent.lastName}`)
      .text(`Téléphone: ${parent.phoneNumber || 'N/A'}`)
      .text(`Élève: ${student.firstName} ${student.lastName}`)
      .text(`N° Inscription: ${student.registrationNumber || 'N/A'}`)
      .moveDown(2);

    // Invoice breakdown table
    const tableTop = 290;
    doc
      .fontSize(10)
      .fillColor('#1f2937')
      .rect(50, tableTop, 500, 20)
      .fill('#f3f4f6')
      .stroke();

    doc
      .fillColor('#000')
      .text('Description / Service Type', 60, tableTop + 5)
      .text('Statut / Status', 300, tableTop + 5)
      .text('Montant / Amount', 450, tableTop + 5);

    // Line separator
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    const rowTop = tableTop + 25;
    doc
      .text(`Frais de scolarité / Transport / Restauration - ${payment.type}`, 60, rowTop)
      .text(`${payment.status}`, 300, rowTop)
      .text(`${payment.amount.toFixed(2)} DZD`, 450, rowTop);

    doc.moveTo(50, rowTop + 20).lineTo(550, rowTop + 20).stroke();

    // Total section
    const totalTop = rowTop + 40;
    doc
      .fontSize(12)
      .fillColor('#1e3a8a')
      .text('TOTAL PAYÉ:', 350, totalTop, { bold: true })
      .text(`${payment.amount.toFixed(2)} DZD`, 450, totalTop, { bold: true });

    // Footer signature
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text('Document généré électroniquement par la plateforme de gestion de l\'École Zitouni.', 50, 700, {
        align: 'center',
      });

    doc.end();
  });
};

module.exports = { generateReceiptPDF };
