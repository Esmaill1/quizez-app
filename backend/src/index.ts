import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import chaptersRouter from './routes/chapters';
import topicsRouter from './routes/topics';
import questionsRouter from './routes/questions';
import answersRouter from './routes/answers';
import quizRouter from './routes/quiz';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/quiz', quizRouter);

// Serve static files from the frontend build
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
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
