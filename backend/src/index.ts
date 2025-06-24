import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import reportRoutes from './routes/reports';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { validateAuth } from './middleware/auth';
import { urlSanitizer, validateRequestPath } from './middleware/urlSanitizer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

// Middleware (order matters!)
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
}));
app.use(compression());

// URL sanitization middleware - must be applied early
app.use(validateRequestPath);
app.use(urlSanitizer);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, validateAuth, userRoutes);
app.use(`${API_PREFIX}/accounts`, validateAuth, accountRoutes);
app.use(`${API_PREFIX}/transactions`, validateAuth, transactionRoutes);
app.use(`${API_PREFIX}/categories`, validateAuth, categoryRoutes);
app.use(`${API_PREFIX}/budgets`, validateAuth, budgetRoutes);
app.use(`${API_PREFIX}/reports`, validateAuth, reportRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}/docs`, (req, res) => {
  res.json({
    title: 'Financial Management System API',
    version: '1.0.0',
    description: 'RESTful API for financial management system',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      accounts: `${API_PREFIX}/accounts`,
      transactions: `${API_PREFIX}/transactions`,
      categories: `${API_PREFIX}/categories`,
      budgets: `${API_PREFIX}/budgets`,
      reports: `${API_PREFIX}/reports`,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 API documentation: http://localhost:${PORT}${API_PREFIX}/docs`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
});

export default app; 