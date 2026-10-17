import { describe, it, expect } from "vitest";
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  calculateEqualSplits,
  calculateExactSplits,
  calculatePercentageSplits,
  calculateSharesSplits,
  computeExpenseSplits,
  calculateGroupBalances,
  simplifyDebts,
} from "../index";

describe("Currency & Paise Utilities", () => {
  it("converts rupees to paise accurately without float artifacts", () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise("543.21")).toBe(54321);
    expect(rupeesToPaise("0.05")).toBe(5);
    expect(rupeesToPaise(0)).toBe(0);
  });

  it("converts paise back to rupees", () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(1999)).toBe(19.99);
    expect(paiseToRupees(5)).toBe(0.05);
  });

  it("formats INR correctly with Indian numbering system and currency symbol", () => {
    expect(formatINR(12345678)).toBe("₹1,23,456.78");
    expect(formatINR(-50000)).toBe("-₹500.00");
    expect(formatINR(50000, { showSign: true })).toBe("+₹500.00");
    expect(formatINR(0)).toBe("₹0.00");
  });
});

describe("Split Calculations & Remainder Allocation", () => {
  it("allocates equal splits evenly when divisible", () => {
    const splits = calculateEqualSplits(3000, ["u1", "u2", "u3"]);
    expect(splits).toHaveLength(3);
    expect(splits.every((s) => s.amountPaise === 1000)).toBe(true);
    expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(3000);
  });

  it("allocates remainder paise fairly in equal splits (e.g. ₹100 split 3 ways)", () => {
    // ₹100 = 10000 paise. 10000 / 3 = 3333 with remainder 1.
    const splits = calculateEqualSplits(10000, ["u1", "u2", "u3"]);
    expect(splits[0].amountPaise).toBe(3334);
    expect(splits[1].amountPaise).toBe(3333);
    expect(splits[2].amountPaise).toBe(3333);
    expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(10000);
  });

  it("allocates exact splits and validates exact total match", () => {
    const allocations = [
      { userId: "u1", amountPaise: 4000 },
      { userId: "u2", amountPaise: 6000 },
    ];
    const splits = calculateExactSplits(10000, allocations);
    expect(splits).toEqual([
      { userId: "u1", amountPaise: 4000, shareValue: 40 },
      { userId: "u2", amountPaise: 6000, shareValue: 60 },
    ]);
  });

  it("throws error when exact split sum does not match total amount", () => {
    const allocations = [
      { userId: "u1", amountPaise: 4000 },
      { userId: "u2", amountPaise: 5000 },
    ];
    expect(() => calculateExactSplits(10000, allocations)).toThrowError(
      /Exact split total does not match/
    );
  });

  it("allocates percentage splits with largest-remainder rounding", () => {
    // Split ₹100 (10000 paise) by 33.33%, 33.33%, 33.34%
    const splits = calculatePercentageSplits(10000, [
      { userId: "u1", percentage: 33.33 },
      { userId: "u2", percentage: 33.33 },
      { userId: "u3", percentage: 33.34 },
    ]);
    const total = splits.reduce((acc, s) => acc + s.amountPaise, 0);
    expect(total).toBe(10000);
  });

  it("handles percentages slightly above 100 within tolerance without overflow", () => {
    // ₹1000 with 50.02% + 50.02% = 100.04% (diff <= 0.05)
    const splits = computeExpenseSplits(100000, "PERCENTAGE", [
      { userId: "u1", percentage: 50.02 },
      { userId: "u2", percentage: 50.02 },
    ]);
    expect(splits).toHaveLength(2);
    expect(splits[0].amountPaise + splits[1].amountPaise).toBe(100000);
  });

  it("throws error when percentages do not sum to 100", () => {
    expect(() =>
      calculatePercentageSplits(10000, [
        { userId: "u1", percentage: 50 },
        { userId: "u2", percentage: 40 },
      ])
    ).toThrowError(/Percentages must sum to 100%/);
  });

  it("allocates share-based splits correctly", () => {
    // 10000 paise split 1 : 2 : 1 (total 4 shares -> 2500, 5000, 2500)
    const splits = calculateSharesSplits(10000, [
      { userId: "u1", shares: 1 },
      { userId: "u2", shares: 2 },
      { userId: "u3", shares: 1 },
    ]);
    expect(splits[0].amountPaise).toBe(2500);
    expect(splits[1].amountPaise).toBe(5000);
    expect(splits[2].amountPaise).toBe(2500);
    expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(10000);
  });

  it("master split dispatcher validates output invariants", () => {
    const splits = computeExpenseSplits(5000, "EQUAL", [
      { userId: "a" },
      { userId: "b" },
    ]);
    expect(splits).toHaveLength(2);
    expect(splits[0].amountPaise + splits[1].amountPaise).toBe(5000);
  });
});

describe("Group Balances & Zero-Sum Invariant", () => {
  const members = [
    { id: "u1", name: "Aarav" },
    { id: "u2", name: "Diya" },
    { id: "u3", name: "Kabir" },
  ];

  it("calculates net balances for a single expense and maintains sum === 0", () => {
    // Aarav paid ₹300 (30000 paise) for dinner, split equally between Aarav, Diya, and Kabir
    const expenses = [
      {
        id: "exp-1",
        payerId: "u1",
        totalAmountPaise: 30000,
        splits: [
          { userId: "u1", amountPaise: 10000 },
          { userId: "u2", amountPaise: 10000 },
          { userId: "u3", amountPaise: 10000 },
        ],
      },
    ];

    const result = calculateGroupBalances(members, expenses, []);

    expect(result.isZeroSumInvariantMaintained).toBe(true);
    expect(result.sumOfNetBalancesPaise).toBe(0);
    expect(result.totalGroupExpenditurePaise).toBe(30000);

    // Aarav paid 30000, consumed 10000 -> net +20000 (+₹200)
    expect(result.memberBalances["u1"].netBalancePaise).toBe(20000);
    // Diya consumed 10000 -> net -10000 (-₹100)
    expect(result.memberBalances["u2"].netBalancePaise).toBe(-10000);
    // Kabir consumed 10000 -> net -10000 (-₹100)
    expect(result.memberBalances["u3"].netBalancePaise).toBe(-10000);
  });

  it("accurately handles settlements without double-counting or altering total group spend", () => {
    const expenses = [
      {
        id: "exp-1",
        payerId: "u1",
        totalAmountPaise: 30000,
        splits: [
          { userId: "u1", amountPaise: 10000 },
          { userId: "u2", amountPaise: 10000 },
          { userId: "u3", amountPaise: 10000 },
        ],
      },
    ];

    // Diya pays Aarav ₹100 (10000 paise) to settle her debt
    const settlements = [
      {
        id: "set-1",
        payerId: "u2",
        payeeId: "u1",
        amountPaise: 10000,
      },
    ];

    const result = calculateGroupBalances(members, expenses, settlements);

    expect(result.isZeroSumInvariantMaintained).toBe(true);
    expect(result.sumOfNetBalancesPaise).toBe(0);
    // Group expenditure remains ₹300 (settlement is NOT an expense)
    expect(result.totalGroupExpenditurePaise).toBe(30000);

    // Diya settled her debt: -10000 + 10000 = 0
    expect(result.memberBalances["u2"].netBalancePaise).toBe(0);
    // Aarav received ₹100: +20000 - 10000 = +10000
    expect(result.memberBalances["u1"].netBalancePaise).toBe(10000);
    // Kabir still owes ₹100
    expect(result.memberBalances["u3"].netBalancePaise).toBe(-10000);
  });
});

describe("Debt Simplification Algorithm", () => {
  it("simplifies transitive debts (A owes B, B owes C -> A owes C)", () => {
    // Balances:
    // A: -5000 (owes ₹50)
    // B: 0 (balanced)
    // C: +5000 (owed ₹50)
    const balances = {
      uA: { member: { id: "uA", name: "Alice" }, netBalancePaise: -5000 },
      uB: { member: { id: "uB", name: "Bob" }, netBalancePaise: 0 },
      uC: { member: { id: "uC", name: "Charlie" }, netBalancePaise: 5000 },
    };

    const result = simplifyDebts(balances);

    // Expected: Alice directly pays Charlie ₹50 in 1 single transaction
    expect(result.transactionCount).toBe(1);
    expect(result.suggestedSettlements).toEqual([
      {
        fromUserId: "uA",
        fromUserName: "Alice",
        toUserId: "uC",
        toUserName: "Charlie",
        amountPaise: 5000,
      },
    ]);
  });

  it("simplifies complex multi-party debts with minimal transactions", () => {
    const balances = {
      u1: { member: { id: "u1", name: "User 1" }, netBalancePaise: -3000 },
      u2: { member: { id: "u2", name: "User 2" }, netBalancePaise: -2000 },
      u3: { member: { id: "u3", name: "User 3" }, netBalancePaise: 1000 },
      u4: { member: { id: "u4", name: "User 4" }, netBalancePaise: 4000 },
    };

    const result = simplifyDebts(balances);

    // Debts: u1: 3000, u2: 2000. Credits: u4: 4000, u3: 1000.
    // Total debt volume = 5000 paise.
    expect(result.totalSettlementVolumePaise).toBe(5000);
    // Should resolve in at most 3 transactions
    expect(result.transactionCount).toBeLessThanOrEqual(3);

    // Verify all transactions sum to creditors' and debtors' balance
    let debtorTotal = 0;
    let creditorTotal = 0;
    for (const s of result.suggestedSettlements) {
      if (s.fromUserId === "u1" || s.fromUserId === "u2") debtorTotal += s.amountPaise;
      if (s.toUserId === "u3" || s.toUserId === "u4") creditorTotal += s.amountPaise;
    }
    expect(debtorTotal).toBe(5000);
    expect(creditorTotal).toBe(5000);
  });

  it("returns zero suggestions when all balances are settled", () => {
    const balances = {
      u1: { member: { id: "u1", name: "User 1" }, netBalancePaise: 0 },
      u2: { member: { id: "u2", name: "User 2" }, netBalancePaise: 0 },
    };
    const result = simplifyDebts(balances);
    expect(result.suggestedSettlements).toHaveLength(0);
    expect(result.transactionCount).toBe(0);
  });
});
