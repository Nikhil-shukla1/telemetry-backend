import { z } from 'zod';

export const ingestBatchSchema = z.array(z.record(z.string(), z.any())).min(0);
