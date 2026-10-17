"use server";

import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters").max(50),
  description: z.string().trim().max(200).optional(),
});

export type GroupActionState = {
  success?: boolean;
  error?: string;
  groupId?: string;
};

/**
 * Creates a new travel group, generates a secure unguessable invite token,
 * and adds the creator as an ADMIN member inside a database transaction.
 */
export async function createGroupAction(
  _prevState: GroupActionState | null,
  formData: FormData
): Promise<GroupActionState> {
  let newGroupId: string;

  try {
    const user = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
    };

    const parsed = createGroupSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid group details" };
    }

    const { name, description } = parsed.data;

    // Generate a secure, unguessable 32-character hex token
    const inviteToken = crypto.randomBytes(16).toString("hex");

    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name,
          description: description || null,
          inviteToken,
          createdById: user.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      return group;
    });

    newGroupId = newGroup.id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create group";
    return { error: message };
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${newGroupId}`);
}

/**
 * Joins an existing group using the secure invite token.
 * Prevents duplicate memberships and enforces authorization.
 */
export async function joinGroupAction(inviteToken: string): Promise<{ success?: boolean; error?: string; groupId?: string }> {
  try {
    const user = await requireAuth();

    const group = await prisma.group.findUnique({
      where: { inviteToken },
    });

    if (!group) {
      return { error: "Invalid or expired invite link." };
    }

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id,
        },
      },
    });

    if (!existing) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "MEMBER",
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath(`/groups/${group.id}`);
    return { success: true, groupId: group.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to join group";
    return { error: message };
  }
}

/**
 * Creates a rich, realistic sample trip ("Goa Road Trip") with expenses and settlements.
 */
export async function seedSampleTripAction(): Promise<void> {
  let createdGroupId: string;

  try {
    const user = await requireAuth();

    // Ensure demo travel companions exist
    const demoCompanions = [
      { name: "Aarav Sharma", email: "aarav@tripsplit.local" },
      { name: "Diya Patel", email: "diya@tripsplit.local" },
      { name: "Kabir Mehta", email: "kabir@tripsplit.local" },
    ];

    const companionUsers = await Promise.all(
      demoCompanions.map(async (c) => {
        let u = await prisma.user.findUnique({ where: { email: c.email } });
        if (!u) {
          const bcrypt = await import("bcryptjs");
          const passwordHash = await bcrypt.hash("demo1234", 10);
          u = await prisma.user.create({
            data: { name: c.name, email: c.email, passwordHash },
          });
        }
        return u;
      })
    );

    const allMembers = [
      { id: user.id, name: user.name, role: "ADMIN" as const },
      { id: companionUsers[0].id, name: companionUsers[0].name, role: "MEMBER" as const },
      { id: companionUsers[1].id, name: companionUsers[1].name, role: "MEMBER" as const },
      { id: companionUsers[2].id, name: companionUsers[2].name, role: "MEMBER" as const },
    ];

    const inviteToken = crypto.randomBytes(16).toString("hex");

    const group = await prisma.group.create({
      data: {
        name: "Goa Beach Trip 2026",
        description: "Weekend beach villa, watersports, and seafood in North Goa",
        inviteToken,
        createdById: user.id,
        members: {
          create: allMembers.map((m) => ({
            userId: m.id,
            role: m.role,
          })),
        },
      },
    });

    createdGroupId = group.id;

    // 1. Villa Stay: ₹12,000 paid by Aarav, split equally (₹3,000 each = 300000 paise)
    await prisma.expense.create({
      data: {
        groupId: group.id,
        description: "Candolim Beachfront Villa (3 nights)",
        totalAmountPaise: 1200000,
        payerId: companionUsers[0].id,
        category: "STAY",
        splitType: "EQUAL",
        splits: {
          create: allMembers.map((m) => ({
            userId: m.id,
            amountPaise: 300000,
            shareValue: 1,
          })),
        },
      },
    });

    // 2. Watersports: ₹8,000 paid by current user, split equally (₹2,000 each = 200000 paise)
    await prisma.expense.create({
      data: {
        groupId: group.id,
        description: "Scuba Diving & Jet Skiing at Baga",
        totalAmountPaise: 800000,
        payerId: user.id,
        category: "ACTIVITIES",
        splitType: "EQUAL",
        splits: {
          create: allMembers.map((m) => ({
            userId: m.id,
            amountPaise: 200000,
            shareValue: 1,
          })),
        },
      },
    });

    // 3. Dinner: ₹5,000 paid by Diya, split EXACT (Diya: 1000, Aarav: 1500, Kabir: 1500, User: 1000)
    await prisma.expense.create({
      data: {
        groupId: group.id,
        description: "Seafood Feast at Fisherman's Wharf",
        totalAmountPaise: 500000,
        payerId: companionUsers[1].id,
        category: "FOOD",
        splitType: "EXACT",
        splits: {
          create: [
            { userId: companionUsers[1].id, amountPaise: 100000, shareValue: 1000 },
            { userId: companionUsers[0].id, amountPaise: 150000, shareValue: 1500 },
            { userId: companionUsers[2].id, amountPaise: 150000, shareValue: 1500 },
            { userId: user.id, amountPaise: 100000, shareValue: 1000 },
          ],
        },
      },
    });

    // 4. One settlement recorded: Kabir paid Aarav ₹2,000 (200000 paise)
    await prisma.settlement.create({
      data: {
        groupId: group.id,
        payerId: companionUsers[2].id,
        payeeId: companionUsers[0].id,
        amountPaise: 200000,
        note: "Settled part of villa stay via UPI",
      },
    });
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Failed to seed demo trip");
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${createdGroupId}`);
}
