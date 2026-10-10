import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

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
  app.listen(PORT, () => {
    console.log(`[SkillOS Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
