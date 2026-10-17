"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requireGroupMembership } from "@/lib/auth/session";
import {
  computeExpenseSplits,
  rupeesToPaise,
  SplitType,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

const expenseCategoryEnum = z.enum([
  "FOOD",
  "TRANSPORT",
  "STAY",
  "ACTIVITIES",
  "SHOPPING",
  "ENTERTAINMENT",
  "GENERAL",
]);

const splitTypeEnum = z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]);

const participantSplitSchema = z.object({
  userId: z.string().min(1),
  exactAmountRupees: z.number().optional(),
  percentage: z.number().optional(),
  shares: z.number().optional(),
});

const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  description: z.string().trim().min(1, "Description is required").max(100),
  amountRupees: z.number().positive("Amount must be greater than zero"),
  payerId: z.string().min(1, "Payer is required"),
  date: z.string().optional(),
  category: expenseCategoryEnum.default("GENERAL"),
  splitType: splitTypeEnum.default("EQUAL"),
  participants: z.array(participantSplitSchema).min(1, "At least one participant required"),
});

export type ActionResponse = {
  success?: boolean;
  error?: string;
  id?: string;
};

/**
 * Creates an expense with split allocations inside a database transaction.
 * Validates authorization and ensures split amounts sum to totalAmountPaise strictly.
 */
export async function createExpenseAction(input: {
  groupId: string;
  description: string;
  amountRupees: number;
  payerId: string;
  date?: string;
  category: string;
  splitType: SplitType;
  participants: {
    userId: string;
    exactAmountRupees?: number;
    percentage?: number;
    shares?: number;
  }[];
}): Promise<ActionResponse> {
  try {
    const user = await requireAuth();
    await requireGroupMembership(input.groupId, user.id);

    const parsed = createExpenseSchema.parse(input);
    const totalAmountPaise = rupeesToPaise(parsed.amountRupees);

    // Calculate splits with integer paise and remainder distribution
    const splitAllocations = parsed.participants.map((p) => ({
      userId: p.userId,
      exactAmountPaise: p.exactAmountRupees !== undefined ? rupeesToPaise(p.exactAmountRupees) : undefined,
      percentage: p.percentage,
      shares: p.shares,
    }));

    const computedSplits = computeExpenseSplits(
      totalAmountPaise,
      parsed.splitType,
      splitAllocations
    );

    const expenseDate = parsed.date ? new Date(parsed.date) : new Date();

    const createdExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId: parsed.groupId,
          description: parsed.description,
          totalAmountPaise,
          payerId: parsed.payerId,
          date: expenseDate,
          category: parsed.category,
          splitType: parsed.splitType,
          splits: {
            create: computedSplits.map((s) => ({
              userId: s.userId,
              amountPaise: s.amountPaise,
              shareValue: s.shareValue,
            })),
          },
        },
      });

      return expense;
    });

    revalidatePath(`/groups/${input.groupId}`);
    return { success: true, id: createdExpense.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record expense";
    return { error: message };
  }
}

/**
 * Updates an expense and replaces its splits within a database transaction.
 * Enforces group membership and strict split totals.
 */
export async function updateExpenseAction(
  expenseId: string,
  input: {
    groupId: string;
    description: string;
    amountRupees: number;
    payerId: string;
    date?: string;
    category: string;
    splitType: SplitType;
    participants: {
      userId: string;
      exactAmountRupees?: number;
      percentage?: number;
      shares?: number;
    }[];
  }
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();
    await requireGroupMembership(input.groupId, user.id);

    // Verify expense exists and belongs to the specified group
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!existing || existing.groupId !== input.groupId) {
      return { error: "Expense not found or does not belong to group." };
    }

    const parsed = createExpenseSchema.parse(input);
    const totalAmountPaise = rupeesToPaise(parsed.amountRupees);

    const splitAllocations = parsed.participants.map((p) => ({
      userId: p.userId,
      exactAmountPaise: p.exactAmountRupees !== undefined ? rupeesToPaise(p.exactAmountRupees) : undefined,
      percentage: p.percentage,
      shares: p.shares,
    }));

    const computedSplits = computeExpenseSplits(
      totalAmountPaise,
      parsed.splitType,
      splitAllocations
    );

    const expenseDate = parsed.date ? new Date(parsed.date) : new Date();

    await prisma.$transaction(async (tx) => {
      // Delete existing splits
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      // Update expense and re-create splits
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: parsed.description,
          totalAmountPaise,
          payerId: parsed.payerId,
          date: expenseDate,
          category: parsed.category,
          splitType: parsed.splitType,
          splits: {
            create: computedSplits.map((s) => ({
              userId: s.userId,
              amountPaise: s.amountPaise,
              shareValue: s.shareValue,
            })),
          },
        },
      });
    });

    revalidatePath(`/groups/${input.groupId}`);
    return { success: true, id: expenseId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update expense";
    return { error: message };
  }
}

/**
 * Deletes an expense.
 * Cascades delete to splits and checks membership.
 */
export async function deleteExpenseAction(
  groupId: string,
  expenseId: string
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();
    await requireGroupMembership(groupId, user.id);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.groupId !== groupId) {
      return { error: "Expense not found." };
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete expense";
    return { error: message };
  }
}

const settlementSchema = z.object({
  groupId: z.string().min(1),
  payerId: z.string().min(1, "Paying member is required"),
  payeeId: z.string().min(1, "Recipient member is required"),
  amountRupees: z.number().positive("Settlement amount must be positive"),
  note: z.string().max(100).optional(),
  date: z.string().optional(),
});

/**
 * Records a direct peer-to-peer repayment settlement between two group members.
 */
export async function recordSettlementAction(input: {
  groupId: string;
  payerId: string;
  payeeId: string;
  amountRupees: number;
  note?: string;
  date?: string;
}): Promise<ActionResponse> {
  try {
    const user = await requireAuth();
    await requireGroupMembership(input.groupId, user.id);

    const parsed = settlementSchema.parse(input);
    if (parsed.payerId === parsed.payeeId) {
      return { error: "Payer and recipient cannot be the same member." };
    }

    const amountPaise = rupeesToPaise(parsed.amountRupees);
    const settlementDate = parsed.date ? new Date(parsed.date) : new Date();

    const settlement = await prisma.settlement.create({
      data: {
        groupId: parsed.groupId,
        payerId: parsed.payerId,
        payeeId: parsed.payeeId,
        amountPaise,
        note: parsed.note || null,
        date: settlementDate,
      },
    });

    revalidatePath(`/groups/${input.groupId}`);
    return { success: true, id: settlement.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record settlement";
    return { error: message };
  }
}

/**
 * Deletes a recorded settlement in case of error.
 */
export async function deleteSettlementAction(
  groupId: string,
  settlementId: string
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();
    await requireGroupMembership(groupId, user.id);

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement || settlement.groupId !== groupId) {
      return { error: "Settlement record not found." };
    }

    await prisma.settlement.delete({
      where: { id: settlementId },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete settlement";
    return { error: message };
  }
}
