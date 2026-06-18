import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { ENV } from '../config';

export const securityHeaders = helmet({
  contentSecurityPolicy: ENV === 'production'
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
});

/** Reject unexpected content types on mutation endpoints. */
export function requireJsonContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }
  }
  next();
}
