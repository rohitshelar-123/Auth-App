import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtUserPayload = {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
};

const TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'dev-secret-change-me';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET) as JwtUserPayload;
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
