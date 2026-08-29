import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function authenticateIngest(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing Authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid Authorization header format. Expected Bearer <token>' });
    return;
  }

  const token = parts[1];
  if (token !== env.INGEST_API_TOKEN) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid API token' });
    return;
  }

  next();
}
