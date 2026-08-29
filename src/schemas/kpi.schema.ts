import { z } from 'zod';

export const kpiQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    to: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from).getTime() <= new Date(data.to).getTime();
      }
      return true;
    },
    {
      message: "'from' timestamp must be less than or equal to 'to' timestamp",
      path: ['from'],
    }
  );

export type KpiQueryInput = z.infer<typeof kpiQuerySchema>;
