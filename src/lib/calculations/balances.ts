export interface MemberInfo {
  id: string;
  name: string;
  email?: string;
}

export interface ExpenseRecord {
  id: string;
  payerId: string;
  totalAmountPaise: number;
  splits: {
    userId: string;
    amountPaise: number;
  }[];
}

export interface SettlementRecord {
  id: string;
  payerId: string;
  payeeId: string;
  amountPaise: number;
  date?: Date;
  note?: string | null;
}

export interface MemberBalance {
  member: MemberInfo;
  netBalancePaise: number; // positive = owed money (+), negative = owes money (-)
  totalPaidPaise: number; // Total out-of-pocket spent on expenses
  totalOwedPaise: number; // Total consumed share across expenses
  totalSettledPaidPaise: number; // Total repayments paid
  totalSettledReceivedPaise: number; // Total repayments received
}

export interface GroupBalanceSummary {
  memberBalances: Record<string, MemberBalance>;
  totalGroupExpenditurePaise: number;
  sumOfNetBalancesPaise: number;
  isZeroSumInvariantMaintained: boolean;
}

/**
 * Calculates net balances for all group members from expenses and settlements.
 *
 * Invariant: Sum of all member net balances must strictly equal zero (0 paise).
 */
export function calculateGroupBalances(
  members: MemberInfo[],
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[]
): GroupBalanceSummary {
  const memberMap = new Map<string, MemberInfo>();
  const memberBalances: Record<string, MemberBalance> = {};

  for (const m of members) {
    memberMap.set(m.id, m);
    memberBalances[m.id] = {
      member: m,
      netBalancePaise: 0,
      totalPaidPaise: 0,
      totalOwedPaise: 0,
      totalSettledPaidPaise: 0,
      totalSettledReceivedPaise: 0,
    };
  }

  let totalGroupExpenditurePaise = 0;

  // Process all expenses
  for (const exp of expenses) {
    totalGroupExpenditurePaise += exp.totalAmountPaise;

    // Credit payer
    if (memberBalances[exp.payerId]) {
      memberBalances[exp.payerId].netBalancePaise += exp.totalAmountPaise;
      memberBalances[exp.payerId].totalPaidPaise += exp.totalAmountPaise;
    }

    // Debit split participants
    for (const split of exp.splits) {
      if (memberBalances[split.userId]) {
        memberBalances[split.userId].netBalancePaise -= split.amountPaise;
        memberBalances[split.userId].totalOwedPaise += split.amountPaise;
      }
    }
  }

  // Process recorded settlements (repayments between members)
  // Payer gives money to payee:
  // - Payer's balance increases by settlement amount (resolving their negative debt)
  // - Payee's balance decreases by settlement amount (resolving their positive credit)
  for (const set of settlements) {
    if (memberBalances[set.payerId]) {
      memberBalances[set.payerId].netBalancePaise += set.amountPaise;
      memberBalances[set.payerId].totalSettledPaidPaise += set.amountPaise;
    }
    if (memberBalances[set.payeeId]) {
      memberBalances[set.payeeId].netBalancePaise -= set.amountPaise;
      memberBalances[set.payeeId].totalSettledReceivedPaise += set.amountPaise;
    }
  }

  // Verify zero-sum invariant
  let sumOfNetBalancesPaise = 0;
  for (const b of Object.values(memberBalances)) {
    sumOfNetBalancesPaise += b.netBalancePaise;
  }

  const isZeroSumInvariantMaintained = sumOfNetBalancesPaise === 0;

  return {
    memberBalances,
    totalGroupExpenditurePaise,
    sumOfNetBalancesPaise,
    isZeroSumInvariantMaintained,
  };
}
