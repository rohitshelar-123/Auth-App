import crypto from "crypto";

const KEY_LENGTH = 32;

export function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  const parts = storedPassword.split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return Promise.resolve(false);
  }

  const [, salt, hashedPassword] = parts;

  if (!salt || !hashedPassword) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      const expected = Buffer.from(hashedPassword, "hex");
      const actual = Buffer.from(derivedKey);

      resolve(
        expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
      );
    });
  });
}
