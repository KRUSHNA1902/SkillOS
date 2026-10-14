import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import tasksRoutes from './routes/tasks.js';
import tagsRoutes from './routes/tags.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security Headers: Protection against clickjacking, sniffing, and header exposure
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'https://skillos.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      origin.endsWith('.vercel.app') ||
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

// Task routes
app.use('/api/tasks', tasksRoutes);

// Tag routes
app.use('/api/tags', tagsRoutes);

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

// Start server only if directly executed outside serverless environments
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillOS Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
