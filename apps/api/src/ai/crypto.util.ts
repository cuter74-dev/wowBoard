import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

/**
 * AES-256-GCM encryption for API keys at rest.
 * Key comes from AI_ENCRYPTION_KEY (64 hex chars = 32 bytes).
 * Output format: "ivB64:tagB64:ctB64".
 */
function getKey(): Buffer {
  const hex = process.env.AI_ENCRYPTION_KEY ?? '';
  if (hex.length !== 64) {
    throw new Error(
      'AI_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Set it in apps/api/.env.',
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plain: string): string {
  if (!plain) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

export function decrypt(payload: string): string {
  if (!payload) return '';
  const [ivB64, tagB64, ctB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !ctB64) return '';
  const decipher = createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]);
  return pt.toString('utf8');
}
