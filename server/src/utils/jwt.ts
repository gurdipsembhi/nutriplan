import jwt from "jsonwebtoken";

export function signToken(userId: string): string {
  const secret  = process.env.JWT_SECRET!;
  const expires = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign({ sub: userId }, secret, { expiresIn: expires } as jwt.SignOptions);
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
}
