/**
 * AES-256-GCM encryption/decryption for API key vault.
 * The master key is derived from a user passphrase using PBKDF2.
 * All encrypted values are stored as: salt:iv:authTag:ciphertext (hex-encoded, colon-separated)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits (recommended for GCM)
const SALT_LENGTH = 16;
const ITERATIONS = 100_000;
const DIGEST = 'sha256';

/**
 * Derives a 256-bit key from a passphrase + salt using PBKDF2.
 */
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

/**
 * Encrypts a plaintext string with the given passphrase.
 * Returns a compact string: salt:iv:tag:ciphertext (all hex).
 */
export function encrypt(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a previously encrypted string.
 * Throws if the passphrase is wrong or data is tampered.
 */
export function decrypt(encryptedStr: string, passphrase: string): string {
  const parts = encryptedStr.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted format');

  const [saltHex, ivHex, tagHex, ciphertextHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Masks an API key for display: shows first 4 and last 4 chars.
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}${'•'.repeat(Math.max(key.length - 8, 4))}${key.slice(-4)}`;
}
