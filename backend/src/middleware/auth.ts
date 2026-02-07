import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';

// Middleware to protect admin routes
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Check for JWT token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        (req as any).user = decoded;
        return next();
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Login required' });
};

// Middleware/Helper to validate student session ownership
// This assumes the student session ID is passed in the header 'x-student-session'
export const getStudentSessionId = (req: Request): string | null => {
  const sessionId = req.headers['x-student-session'];
  if (!sessionId || Array.isArray(sessionId)) {
    return null;
  }
  return sessionId;
};

export const requireStudentSession = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = getStudentSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: Missing Student Session ID' });
  }
  next();
};
