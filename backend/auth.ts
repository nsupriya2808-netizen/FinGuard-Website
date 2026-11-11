import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import type { User } from './types.ts';

const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = 'sha512';

/**
 * Hashes a plain-text password using crypto.pbkdf2Sync with a random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Validates a plain password against the stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash) return false;
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    const testBuf = Buffer.from(testHash, 'hex');
    const origBuf = Buffer.from(originalHash, 'hex');
    if (testBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(testBuf, origBuf);
  } catch {
    return false;
  }
}

/**
 * Dynamically resolves the HMAC secret from Render environment variables
 */
export function getTokenSecret(): string {
  const secret = process.env.SESSION_SECRET || 'finguard-capstone-default-secret';
  return secret.trim().replace(/^["']|["']$/g, '');
}

/**
 * Generates a simple base64 HMAC signed token for session state
 */
export function generateAuthToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    issuedAt: Date.now(),
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(str).digest('hex');
  return Buffer.from(`${str}###${signature}`).toString('base64');
}

/**
 * Decodes and verifies token
 */
export function verifyAuthToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const [jsonStr, signature] = raw.split('###');
    if (!jsonStr || !signature) return null;
    const expected = crypto.createHmac('sha256', getTokenSecret()).update(jsonStr).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
