import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "tripsplit_session";
const SESSION_EXPIRATION = "30d";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "fallback-secret-at-least-32-chars-long-tripsplit-mvp!";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Creates and sets an encrypted HTTP-only JWT session cookie.
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
}

/**
 * Verifies session token from HTTP-only cookie and returns payload.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Returns current authenticated user record or null.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Enforces authentication. Throws error if user is unauthenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Please sign in to continue.");
  }
  return user;
}

/**
 * Authorizes user access to a specific group.
 * Ensures members can ONLY access groups they belong to.
 */
export async function requireGroupMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    include: {
      group: true,
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN: You are not a member of this group.");
  }

  return membership;
}

/**
 * Destroys session cookie on logout.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
