// HMAC signature verification for webhooks
import { Logger } from './logger.ts';

export async function generateSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  logger?: Logger
): Promise<boolean> {
  try {
    const expectedSignature = await generateSignature(payload, secret);
    const isValid = signature === expectedSignature;
    
    if (!isValid && logger) {
      logger.warn('Invalid signature', {
        receivedSignature: signature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...',
      });
    }
    
    return isValid;
  } catch (error) {
    if (logger) {
      logger.error('Signature verification error', error);
    }
    return false;
  }
}

export function extractSignature(
  req: Request,
  headerName: string = 'x-signature'
): string | null {
  return req.headers.get(headerName);
}

export async function verifyWebhookRequest(
  req: Request,
  secret: string,
  logger?: Logger
): Promise<{ valid: boolean; payload?: string }> {
  const signature = extractSignature(req);
  
  if (!signature) {
    if (logger) {
      logger.warn('Missing signature header');
    }
    return { valid: false };
  }

  const payload = await req.text();
  const valid = await verifySignature(payload, signature, secret, logger);

  return { valid, payload };
}
