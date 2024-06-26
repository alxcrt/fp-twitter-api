import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { loginSchemaType } from "./schemas";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5 hour from now")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(data: loginSchemaType, userId: number) {
  // Verify credentials && get the user
  const user = { name: data.name, id: userId };

  // Create the session
  const expires = new Date(Date.now() + 60 * 60 * 5000); // 5 hours from now
  const session = await encrypt({ user, expires });

  // Save the session in a cookie for web clients
  cookies().set("session", session, { expires, httpOnly: true });

  // Also return the session (Bearer token) for clients that prefer handling tokens manually
  return session;
}

export async function logout() {
  // Destroy the session
  cookies().set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  // Try to get the session from a cookie first
  let token = cookies().get("session")?.value;

  // If no cookie, try to get the Bearer token from the Authorization header
  if (!token) {
    const authHeader = headers().get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7, authHeader.length); // Extract the token part
    }
  }

  // If no token found by this point, return null
  if (!token) return null;

  // Decrypt and return the session
  return await decrypt(token);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  // 1 hour from now
  parsed.expires = new Date(Date.now() + 60 * 60 * 5000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
