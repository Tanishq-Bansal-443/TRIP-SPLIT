"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, destroySession } from "./session";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = {
  success?: boolean;
  error?: string;
};

export async function registerAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to register";
    return { error: message };
  }

  const redirectUrl = formData.get("redirect")?.toString();
  redirect(redirectUrl || "/dashboard");
}

export async function loginAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in";
    return { error: message };
  }

  const redirectUrl = formData.get("redirect")?.toString();
  redirect(redirectUrl || "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/**
 * Creates or logs in a demo user for testing multi-member interactions seamlessly.
 */
export async function quickDemoLoginAction(userType: "aarav" | "diya" | "kabir"): Promise<void> {
  const demoUsers = {
    aarav: { name: "Aarav Sharma", email: "aarav@tripsplit.local" },
    diya: { name: "Diya Patel", email: "diya@tripsplit.local" },
    kabir: { name: "Kabir Mehta", email: "kabir@tripsplit.local" },
  };

  const selected = demoUsers[userType];
  let user = await prisma.user.findUnique({
    where: { email: selected.email },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    user = await prisma.user.create({
      data: {
        name: selected.name,
        email: selected.email,
        passwordHash,
      },
    });
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  redirect("/dashboard");
}
