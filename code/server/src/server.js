import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ 
  origin: function(origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use('/api/auth', authRoutes);

// AI & Gemini routes
app.use('/api/ai', aiRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillOS Backend API',
    timestamp: new Date().toISOString()
  });
});

// App Info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'SkillOS API',
    version: '1.0.0',
    description: 'Personal Learning & Progress Management Platform API'
  });
});

// Start server only if directly executed
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillOS Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
