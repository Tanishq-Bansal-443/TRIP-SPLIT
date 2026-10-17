export type SplitType = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export interface ParticipantAllocation {
  userId: string;
  exactAmountPaise?: number; // for EXACT
  percentage?: number; // for PERCENTAGE (0-100)
  shares?: number; // for SHARES (>0)
}

export interface CalculatedSplit {
  userId: string;
  amountPaise: number;
  shareValue?: number;
}

/**
 * Calculates equal splits among participants.
 * When totalAmountPaise is not evenly divisible by N, remainder paise (total % N)
 * are distributed 1 paisa each to the first `remainder` participants, guaranteeing
 * that the sum of splits equals totalAmountPaise exactly.
 */
export function calculateEqualSplits(
  totalAmountPaise: number,
  userIds: string[]
): CalculatedSplit[] {
  if (userIds.length === 0) {
    throw new Error("Cannot split expense with zero participants.");
  }
  if (totalAmountPaise <= 0) {
    throw new Error("Total expense amount must be greater than zero.");
  }

  const n = userIds.length;
  const baseSplit = Math.floor(totalAmountPaise / n);
  const remainder = totalAmountPaise % n;

  return userIds.map((userId, index) => ({
    userId,
    amountPaise: baseSplit + (index < remainder ? 1 : 0),
    shareValue: 1,
  }));
}

/**
 * Validates and returns exact splits.
 * Checks that the sum of exact amounts equals totalAmountPaise exactly.
 */
export function calculateExactSplits(
  totalAmountPaise: number,
  allocations: { userId: string; amountPaise: number }[]
): CalculatedSplit[] {
  if (allocations.length === 0) {
    throw new Error("Cannot split expense with zero participants.");
  }
  if (totalAmountPaise <= 0) {
    throw new Error("Total expense amount must be greater than zero.");
  }

  let runningSum = 0;
  for (const item of allocations) {
    if (!Number.isInteger(item.amountPaise)) {
      throw new Error(`Amount must be an integer paise for user ${item.userId}`);
    }
    if (item.amountPaise < 0) {
      throw new Error(`Negative amount not allowed for user ${item.userId}`);
    }
    runningSum += item.amountPaise;
  }

  if (runningSum !== totalAmountPaise) {
    const diff = (totalAmountPaise - runningSum) / 100;
    throw new Error(
      `Exact split total does not match expense amount. Difference: ${diff > 0 ? "+" : ""}${diff} INR`
    );
  }

  return allocations.map((a) => ({
    userId: a.userId,
    amountPaise: a.amountPaise,
    shareValue: a.amountPaise / 100,
  }));
}

/**
 * Calculates splits by percentage.
 * Validates that percentages sum to 100 (allowing tiny float tolerance of 0.01).
 * Uses largest-remainder method (Hare-Niemeyer) to allocate rounding paise
 * fairly so sum of split amounts strictly equals totalAmountPaise.
 */
export function calculatePercentageSplits(
  totalAmountPaise: number,
  allocations: { userId: string; percentage: number }[]
): CalculatedSplit[] {
  if (allocations.length === 0) {
    throw new Error("Cannot split expense with zero participants.");
  }
  if (totalAmountPaise <= 0) {
    throw new Error("Total expense amount must be greater than zero.");
  }

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.05) {
    throw new Error(
      `Percentages must sum to 100%. Current sum: ${totalPercentage.toFixed(2)}%`
    );
  }

  // Calculate base paise and fractional remainders using totalPercentage for exact proportionality
  const rawSplits = allocations.map((a) => {
    if (a.percentage < 0) {
      throw new Error(`Percentage cannot be negative for user ${a.userId}`);
    }
    const rawPaise = (totalAmountPaise * a.percentage) / totalPercentage;
    const basePaise = Math.floor(rawPaise);
    const fraction = rawPaise - basePaise;
    return {
      userId: a.userId,
      basePaise,
      fraction,
      percentage: a.percentage,
    };
  });

  const baseSum = rawSplits.reduce((acc, curr) => acc + curr.basePaise, 0);
  const remainderPaise = totalAmountPaise - baseSum;

  // Sort indices by largest fraction first to distribute remainder paise
  const indicesSortedByFraction = rawSplits
    .map((item, index) => ({ index, fraction: item.fraction }))
    .sort((a, b) => b.fraction - a.fraction);

  const results: CalculatedSplit[] = rawSplits.map((item) => ({
    userId: item.userId,
    amountPaise: item.basePaise,
    shareValue: item.percentage,
  }));

  for (let i = 0; i < remainderPaise; i++) {
    const targetIdx = indicesSortedByFraction[i % indicesSortedByFraction.length].index;
    results[targetIdx].amountPaise += 1;
  }

  return results;
}

/**
 * Calculates splits by shares/ratio (e.g. 1 share, 2 shares, etc.).
 * Uses largest-remainder method so sum of split amounts strictly equals totalAmountPaise.
 */
export function calculateSharesSplits(
  totalAmountPaise: number,
  allocations: { userId: string; shares: number }[]
): CalculatedSplit[] {
  if (allocations.length === 0) {
    throw new Error("Cannot split expense with zero participants.");
  }
  if (totalAmountPaise <= 0) {
    throw new Error("Total expense amount must be greater than zero.");
  }

  const totalShares = allocations.reduce((sum, a) => {
    if (a.shares < 0) {
      throw new Error(`Shares cannot be negative for user ${a.userId}`);
    }
    return sum + a.shares;
  }, 0);

  if (totalShares <= 0) {
    throw new Error("Total shares must be greater than zero.");
  }

  const rawSplits = allocations.map((a) => {
    const rawPaise = (totalAmountPaise * a.shares) / totalShares;
    const basePaise = Math.floor(rawPaise);
    const fraction = rawPaise - basePaise;
    return {
      userId: a.userId,
      basePaise,
      fraction,
      shares: a.shares,
    };
  });

  const baseSum = rawSplits.reduce((acc, curr) => acc + curr.basePaise, 0);
  const remainderPaise = totalAmountPaise - baseSum;

  const indicesSortedByFraction = rawSplits
    .map((item, index) => ({ index, fraction: item.fraction }))
    .sort((a, b) => b.fraction - a.fraction);

  const results: CalculatedSplit[] = rawSplits.map((item) => ({
    userId: item.userId,
    amountPaise: item.basePaise,
    shareValue: item.shares,
  }));

  for (let i = 0; i < remainderPaise; i++) {
    const targetIdx = indicesSortedByFraction[i % indicesSortedByFraction.length].index;
    results[targetIdx].amountPaise += 1;
  }

  return results;
}

/**
 * Master split calculation dispatcher.
 */
export function computeExpenseSplits(
  totalAmountPaise: number,
  splitType: SplitType,
  participants: ParticipantAllocation[]
): CalculatedSplit[] {
  if (participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  let splits: CalculatedSplit[];

  switch (splitType) {
    case "EQUAL":
      splits = calculateEqualSplits(
        totalAmountPaise,
        participants.map((p) => p.userId)
      );
      break;

    case "EXACT":
      splits = calculateExactSplits(
        totalAmountPaise,
        participants.map((p) => ({
          userId: p.userId,
          amountPaise: p.exactAmountPaise ?? 0,
        }))
      );
      break;

    case "PERCENTAGE":
      splits = calculatePercentageSplits(
        totalAmountPaise,
        participants.map((p) => ({
          userId: p.userId,
          percentage: p.percentage ?? 0,
        }))
      );
      break;

    case "SHARES":
      splits = calculateSharesSplits(
        totalAmountPaise,
        participants.map((p) => ({
          userId: p.userId,
          shares: p.shares ?? 1,
        }))
      );
      break;

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }

  // Final invariant check: sum of split amountPaise must equal totalAmountPaise
  const calculatedTotal = splits.reduce((acc, s) => acc + s.amountPaise, 0);
  if (calculatedTotal !== totalAmountPaise) {
    throw new Error(
      `Split calculation error: calculated total ${calculatedTotal} does not match expense total ${totalAmountPaise}`
    );
  }

  return splits;
}
