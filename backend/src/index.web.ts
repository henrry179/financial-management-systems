import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.web' });

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS configuration for web development
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cursor Web Development Server is running',
    timestamp: new Date().toISOString(),
    environment: 'web-development'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Financial Management System API',
    version: '1.0.0',
    environment: 'web-development',
    endpoints: {
      health: '/health',
      login: '/api/auth/login',
      register: '/api/auth/register',
      dashboard: '/api/dashboard'
    }
  });
});

// Simple authentication endpoints for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple test authentication
  if (email === 'demo@example.com' && password === '123456') {
    res.json({
      success: true,
      user: {
        id: 1,
        email: 'demo@example.com',
        name: '演示用户'
      },
      token: 'demo-jwt-token-for-web-development',
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      message: '邮箱或密码错误'
    });
  }
});

// Dashboard data endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalIncome: 15000,
      totalExpense: 8500,
      balance: 6500,
      monthlyTransactions: 45,
      recentTransactions: [
        {
          id: 1,
          type: 'income',
          amount: 5000,
          category: '工资',
          description: '月工资',
          date: new Date().toISOString()
        },
        {
          id: 2,
          type: 'expense',
          amount: 1200,
          category: '住房',
          description: '房租',
          date: new Date().toISOString()
        }
      ]
    }
  });
});

// Transactions endpoint
app.get('/api/transactions', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: 'income',
        amount: 5000,
        category: '工资',
        description: '月工资',
        date: new Date().toISOString()
      },
      {
        id: 2,
        type: 'expense',
        amount: 1200,
        category: '住房',
        description: '房租',
        date: new Date().toISOString()
      },
      {
        id: 3,
        type: 'expense',
        amount: 800,
        category: '餐饮',
        description: '生活费',
        date: new Date().toISOString()
      }
    ]
  });
});

// Create transaction endpoint
app.post('/api/transactions', (req, res) => {
  const { type, amount, category, description } = req.body;
  
  res.json({
    success: true,
    data: {
      id: Date.now(),
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString()
    },
    message: '交易记录添加成功'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Cursor Web Development Server is running`);
  console.log(`📍 Server: http://${HOST}:${PORT}`);
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`📚 API Info: http://${HOST}:${PORT}/api/info`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
});

export default app;