import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import chaptersRouter from './routes/chapters';
import topicsRouter from './routes/topics';
import questionsRouter from './routes/questions';
import answersRouter from './routes/answers';
import quizRouter from './routes/quiz';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy is required when behind Nginx to get correct client IP
app.set('trust proxy', 1);

// Global Rate Limiter: Max 200 requests per 15 mins
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Limiter for Quiz Starts: Max 10 per minute
// Prevents database write-saturation from a single user
const quizStartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many quiz sessions started. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors());
app.use(express.json());
app.use('/api', globalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Quiz API is running!'
  });
});

// API Routes
app.use('/api/chapters', chaptersRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/quiz/start', quizStartLimiter); // Apply stricter limit to quiz starts
app.use('/api/quiz', quizRouter);
app.use('/api/auth', authRouter);

// Serve static files from the frontend build
// In Docker, it's at /app/frontend/dist. Locally, it's at ../../frontend/dist
const frontendPath = path.join(process.cwd(), '../frontend/dist');
const productionFrontendPath = path.join(process.cwd(), 'frontend/dist');

app.use(express.static(fs.existsSync(productionFrontendPath) ? productionFrontendPath : frontendPath));

// Handle client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexFile = fs.existsSync(productionFrontendPath) 
    ? path.join(productionFrontendPath, 'index.html')
    : path.join(frontendPath, 'index.html');
  res.sendFile(indexFile);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quiz App running on http://localhost:${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

export default app;
