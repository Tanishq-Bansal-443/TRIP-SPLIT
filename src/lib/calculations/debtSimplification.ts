import { MemberInfo } from "./balances";

export interface SuggestedSettlement {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amountPaise: number;
}

export interface SimplifiedDebtResult {
  suggestedSettlements: SuggestedSettlement[];
  totalSettlementVolumePaise: number;
  transactionCount: number;
}

/**
 * Debt Simplification Algorithm (Greedy Minimum Cash Flow):
 * Minimizes the total number of peer-to-peer repayments required to balance the group.
 *
 * For example:
 * If Alice owes Bob ₹500, and Bob owes Charlie ₹500:
 * Unsimplified: Alice -> Bob (₹500), Bob -> Charlie (₹500) [2 transactions]
 * Simplified: Alice -> Charlie (₹500) [1 transaction, Bob is completely bypassed]
 */
export function simplifyDebts(
  memberBalances: Record<
    string,
    {
      member: MemberInfo;
      netBalancePaise: number;
    }
  >
): SimplifiedDebtResult {
  interface ParticipantNode {
    userId: string;
    userName: string;
    amount: number; // positive for creditor, positive magnitude for debtor
  }

  const debtors: ParticipantNode[] = [];
  const creditors: ParticipantNode[] = [];

  for (const b of Object.values(memberBalances)) {
    if (b.netBalancePaise < 0) {
      debtors.push({
        userId: b.member.id,
        userName: b.member.name,
        amount: Math.abs(b.netBalancePaise),
      });
    } else if (b.netBalancePaise > 0) {
      creditors.push({
        userId: b.member.id,
        userName: b.member.name,
        amount: b.netBalancePaise,
      });
    }
  }

  const suggestedSettlements: SuggestedSettlement[] = [];
  let totalSettlementVolumePaise = 0;

  // Process while both debtors and creditors exist
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount to settle largest amounts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      suggestedSettlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amountPaise: settleAmount,
      });
      totalSettlementVolumePaise += settleAmount;
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) {
      debtors.shift();
    }
    if (creditor.amount === 0) {
      creditors.shift();
    }
  }

  return {
    suggestedSettlements,
    totalSettlementVolumePaise,
    transactionCount: suggestedSettlements.length,
  };
}
