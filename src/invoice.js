/**
 * Invoice service with mock OCR for demo.
 * In production, integrate with Tesseract or cloud OCR API.
 */
class InvoiceService {
  constructor(store) {
    this.store = store;
  }

  uploadInvoice({ projectId, fileName, fileBuffer, transactionId }) {
    if (!projectId || !fileName) throw new Error('ProjectId and fileName are required');
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');

    // Mock OCR extraction
    const extracted = this._mockOCR(fileName, fileBuffer);

    return this.store.createInvoice({
      projectId,
      transactionId: transactionId || null,
      fileName,
      amount: extracted.amount,
      date: extracted.date,
      invoiceNumber: extracted.invoiceNumber,
      ocrData: extracted
    });
  }

  listInvoices(projectId) {
    return this.store.listInvoicesByProject(projectId);
  }

  _mockOCR(fileName, fileBuffer) {
    // Simulate OCR by generating plausible values from filename
    const hash = fileName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const amount = ((hash % 5000) + 100).toFixed(2);
    const invoiceNumber = `INV-${hash % 10000}`;
    const date = new Date(Date.now() - (hash % 30) * 86400000).toISOString().split('T')[0];
    return { amount: parseFloat(amount), invoiceNumber, date, confidence: 0.92 };
  }
}

module.exports = { InvoiceService };
