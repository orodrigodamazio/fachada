import { scrypt as scryptCb, randomBytes, timingSafeEqual, type ScryptOptions } from "node:crypto";

const KEYLEN = 64;
const COST = 16384; // N=2^14

function scryptAsync(password: string, salt: string, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEYLEN, { N: COST });
  return `scrypt$${COST}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const salt = parts[2];
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isFinite(cost) || !salt || expected.length !== KEYLEN) return false;
  const derived = await scryptAsync(password, salt, KEYLEN, { N: cost });
  return timingSafeEqual(expected, derived);
}
