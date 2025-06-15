require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDocument = require('./swagger/swagger.json');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const competitionRoutes = require('./routes/competitions');
const eventRoutes = require('./routes/events');
const inquiryRoutes = require('./routes/inquiry');
const razorpay = require('./Razorpay');

const app = express();
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.70/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Competition Management API',
      version: '1.0.0',
      description: 'API documentation for Competition Management System',
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

// const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/razorpay',razorpay );
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📚 API Documentation available at ${process.env.BASE_URL}/api-docs`);
  });
}

module.exports = app;