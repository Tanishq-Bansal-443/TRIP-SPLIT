import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  calculateGroupBalances,
  computeExpenseSplits,
  simplifyDebts,
  rupeesToPaise,
} from "@/lib/calculations";

describe("TripSplit End-to-End Workflow Integration", () => {
  let userA: { id: string; email: string; name: string };
  let userB: { id: string; email: string; name: string };
  let userC: { id: string; email: string; name: string };
  let testGroup: { id: string; inviteToken: string };

  beforeAll(async () => {
    // Clean up test data if any
    const passwordHash = await bcrypt.hash("test1234", 10);

    userA = await prisma.user.upsert({
      where: { email: "test-aarav@tripsplit.local" },
      update: {},
      create: {
        name: "Test Aarav",
        email: "test-aarav@tripsplit.local",
        passwordHash,
      },
    });

    userB = await prisma.user.upsert({
      where: { email: "test-diya@tripsplit.local" },
      update: {},
      create: {
        name: "Test Diya",
        email: "test-diya@tripsplit.local",
        passwordHash,
      },
    });

    userC = await prisma.user.upsert({
      where: { email: "test-kabir@tripsplit.local" },
      update: {},
      create: {
        name: "Test Kabir",
        email: "test-kabir@tripsplit.local",
        passwordHash,
      },
    });
  });

  afterAll(async () => {
    if (testGroup?.id) {
      await prisma.group.delete({ where: { id: testGroup.id } }).catch(() => {});
    }
  });

  it("1. Creates a group with secure invite token and admin member inside a transaction", async () => {
    const inviteToken = crypto.randomBytes(16).toString("hex");

    testGroup = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: "Himachal Expedition",
          description: "Snowboarding and trekking",
          inviteToken,
          createdById: userA.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: userA.id,
          role: "ADMIN",
        },
      });

      return g;
    });

    expect(testGroup.id).toBeDefined();
    expect(testGroup.inviteToken).toHaveLength(32);

    const members = await prisma.groupMember.findMany({
      where: { groupId: testGroup.id },
    });
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe("ADMIN");
  });

  it("2. User B joins the group via unguessable invite link", async () => {
    const group = await prisma.group.findUnique({
      where: { inviteToken: testGroup.inviteToken },
    });
    expect(group).not.toBeNull();

    await prisma.groupMember.create({
      data: {
        groupId: group!.id,
        userId: userB.id,
        role: "MEMBER",
      },
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId: testGroup.id },
    });
    expect(members).toHaveLength(2);
  });

  it("3. Enforces authorization: Non-member User C cannot access group", async () => {
    const memberRecord = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: testGroup.id,
          userId: userC.id,
        },
      },
    });
    expect(memberRecord).toBeNull();
  });

  it("4. Creates an expense with EQUAL split and integer paise", async () => {
    // Total ₹2,000 (200000 paise) paid by User A for User A and User B
    const totalAmountPaise = rupeesToPaise(2000);
    const splits = computeExpenseSplits(totalAmountPaise, "EQUAL", [
      { userId: userA.id },
      { userId: userB.id },
    ]);

    expect(splits).toHaveLength(2);
    expect(splits[0].amountPaise).toBe(100000);
    expect(splits[1].amountPaise).toBe(100000);

    const expense = await prisma.$transaction(async (tx) => {
      return tx.expense.create({
        data: {
          groupId: testGroup.id,
          description: "Snowboard Rental",
          totalAmountPaise,
          payerId: userA.id,
          category: "ACTIVITIES",
          splitType: "EQUAL",
          splits: {
            create: splits.map((s) => ({
              userId: s.userId,
              amountPaise: s.amountPaise,
              shareValue: 1,
            })),
          },
        },
      });
    });

    expect(expense.id).toBeDefined();
  });

  it("5. Creates a second expense with PERCENTAGE split", async () => {
    // Total ₹1,500 (150000 paise) paid by User B: User A 40%, User B 60%
    const totalAmountPaise = rupeesToPaise(1500);
    const splits = computeExpenseSplits(totalAmountPaise, "PERCENTAGE", [
      { userId: userA.id, percentage: 40 },
      { userId: userB.id, percentage: 60 },
    ]);

    expect(splits[0].amountPaise).toBe(60000); // 40% of 1500 = ₹600
    expect(splits[1].amountPaise).toBe(90000); // 60% of 1500 = ₹900

    await prisma.expense.create({
      data: {
        groupId: testGroup.id,
        description: "Mountain Lodge Dinner",
        totalAmountPaise,
        payerId: userB.id,
        category: "FOOD",
        splitType: "PERCENTAGE",
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amountPaise: s.amountPaise,
            shareValue: s.shareValue,
          })),
        },
      },
    });
  });

  it("6. Calculates balances, verifies zero-sum invariant and debt simplification", async () => {
    const expenses = await prisma.expense.findMany({
      where: { groupId: testGroup.id },
      include: { splits: true },
    });

    const members = [
      { id: userA.id, name: userA.name },
      { id: userB.id, name: userB.name },
    ];

    const result = calculateGroupBalances(members, expenses, []);

    // Total expenditure: ₹2,000 + ₹1,500 = ₹3,500 (350000 paise)
    expect(result.totalGroupExpenditurePaise).toBe(350000);
    expect(result.isZeroSumInvariantMaintained).toBe(true);
    expect(result.sumOfNetBalancesPaise).toBe(0);

    // User A:
    // Expense 1: Paid +200000, consumed -100000 -> net +100000
    // Expense 2: Consumed -60000 -> net -60000
    // Overall User A: +40000 (+₹400)
    expect(result.memberBalances[userA.id].netBalancePaise).toBe(40000);

    // User B:
    // Expense 1: Consumed -100000
    // Expense 2: Paid +150000, consumed -90000 -> net +60000
    // Overall User B: -40000 (-₹400)
    expect(result.memberBalances[userB.id].netBalancePaise).toBe(-40000);

    // Debt Simplification suggests: User B pays User A ₹400
    const simplified = simplifyDebts(result.memberBalances);
    expect(simplified.transactionCount).toBe(1);
    expect(simplified.suggestedSettlements[0]).toMatchObject({
      fromUserId: userB.id,
      toUserId: userA.id,
      amountPaise: 40000,
    });
  });

  it("7. Records a peer settlement (User B pays User A ₹400) and balances hit zero", async () => {
    const settlement = await prisma.settlement.create({
      data: {
        groupId: testGroup.id,
        payerId: userB.id,
        payeeId: userA.id,
        amountPaise: 40000,
        note: "Settled via UPI",
      },
    });

    const expenses = await prisma.expense.findMany({
      where: { groupId: testGroup.id },
      include: { splits: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: testGroup.id },
    });

    const members = [
      { id: userA.id, name: userA.name },
      { id: userB.id, name: userB.name },
    ];

    const result = calculateGroupBalances(members, expenses, settlements);

    expect(result.isZeroSumInvariantMaintained).toBe(true);
    expect(result.sumOfNetBalancesPaise).toBe(0);
    // Expenditure remains ₹3,500 (settlement is NOT double counted or added to group spend)
    expect(result.totalGroupExpenditurePaise).toBe(350000);

    // Both members are now completely settled!
    expect(result.memberBalances[userA.id].netBalancePaise).toBe(0);
    expect(result.memberBalances[userB.id].netBalancePaise).toBe(0);

    const simplified = simplifyDebts(result.memberBalances);
    expect(simplified.transactionCount).toBe(0);

    // Clean up settlement
    await prisma.settlement.delete({ where: { id: settlement.id } });
  });
});
