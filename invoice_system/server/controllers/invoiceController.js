// Mock data for testing
const mockInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-001',
    amount: 150.00,
    status: 'PENDING',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    customerName: 'John Doe',
    customerEmail: 'john@example.com'
  },
  {
    id: 2,
    invoiceNumber: 'INV-002',
    amount: 250.00,
    status: 'PAID',
    createdAt: '2024-03-19T15:30:00Z',
    updatedAt: '2024-03-20T09:15:00Z',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com'
  }
];

const invoiceController = {
  async getInvoices() {
    // Return mock data for now
    return mockInvoices;
  },

  async getInvoiceById(id) {
    const invoice = mockInvoices.find(inv => inv.id === parseInt(id));
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  },

  async createInvoice(invoiceData) {
    const newInvoice = {
      id: mockInvoices.length + 1,
      invoiceNumber: `INV-${String(mockInvoices.length + 1).padStart(3, '0')}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async updateInvoiceStatus(id, status) {
    const invoice = mockInvoices.find(inv => inv.id === parseInt(id));
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    invoice.status = status;
    invoice.updatedAt = new Date().toISOString();
    return invoice;
  },

  async deleteInvoice(id) {
    const index = mockInvoices.findIndex(inv => inv.id === parseInt(id));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    mockInvoices.splice(index, 1);
  }
};

module.exports = invoiceController; 