import crypto from 'crypto';

export function canonicalize(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);

  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

export function generateMessageHash(ident: string, timestamp: Date | number | string, rawPayload: Record<string, any>): string {
  const tsMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  const canonicalStr = JSON.stringify(canonicalize(rawPayload));
  return crypto.createHash('sha256').update(`${ident}:${tsMs}:${canonicalStr}`).digest('hex');
}
