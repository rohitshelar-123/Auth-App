import jwt from "jsonwebtoken";

const TOKEN_SECRET = process.env.TOKEN_SECRET ?? "dev-secret-change-me";

export function createAuthToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1d" });
}
