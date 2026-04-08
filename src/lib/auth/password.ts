/**
 * Pragya Pravah — Password Hashing (bcrypt)
 *
 * All passwords are bcrypt-hashed with cost factor 12 before storage.
 * This module is server-only — never import in client code.
 */
import "server-only";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password. Throws if password is empty.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns true if they match, false otherwise.
 * Constant-time comparison via bcrypt.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
}
