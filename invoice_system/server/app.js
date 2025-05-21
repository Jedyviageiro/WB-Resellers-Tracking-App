const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const path = require('path');

const app = express();

// Configuração CORS mais detalhada
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:4200'], // Allow both React and Angular frontends
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-API-Key'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);

// Serve static files with proper MIME type for PDFs
app.use('/invoices', express.static(path.join(__dirname, 'invoices'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename=${path.split('/').pop()}`);
      res.set('Cache-Control', 'no-cache');
      res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for PDF downloads
    }
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for http://localhost:3001 and http://localhost:4200`);
}); 