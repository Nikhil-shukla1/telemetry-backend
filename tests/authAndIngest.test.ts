import { describe, it, expect, vi } from 'vitest';
import { authenticateIngest } from '../src/middleware/auth.middleware.js';
import { env } from '../src/config/env.js';

describe('Auth Middleware & Ingestion Invariants Tests', () => {
  describe('authenticateIngest Middleware', () => {
    it('calls next() when valid Bearer token is provided', () => {
      const req: any = {
        headers: {
          authorization: `Bearer ${env.INGEST_API_TOKEN}`,
        },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      authenticateIngest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 Unauthorized when Authorization header is missing', () => {
      const req: any = { headers: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      authenticateIngest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 Unauthorized when Bearer token is invalid', () => {
      const req: any = {
        headers: {
          authorization: 'Bearer wrong_token_123',
        },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      authenticateIngest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized', message: 'Invalid API token' })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
