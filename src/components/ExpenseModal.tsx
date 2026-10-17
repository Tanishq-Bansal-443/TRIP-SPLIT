"use client";

import { useState } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/lib/expenses/actions";
import { SplitType } from "@/lib/calculations";
import {
  Plus,
  Edit2,
  X,
  IndianRupee,
  Calendar,
  Utensils,
  Car,
  Home,
  Compass,
  ShoppingBag,
  Film,
  Package,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface ExpenseModalProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  expenseToEdit?: {
    id: string;
    description: string;
    amountPaise: number;
    payerId: string;
    date: string;
    category: string;
    splitType: SplitType;
    splits: {
      userId: string;
      amountPaise: number;
      shareValue?: number | null;
    }[];
  };
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: "FOOD", label: "Food & Drinks", icon: Utensils },
  { id: "TRANSPORT", label: "Transport", icon: Car },
  { id: "STAY", label: "Accommodation", icon: Home },
  { id: "ACTIVITIES", label: "Activities", icon: Compass },
  { id: "SHOPPING", label: "Shopping", icon: ShoppingBag },
  { id: "ENTERTAINMENT", label: "Entertainment", icon: Film },
  { id: "GENERAL", label: "General", icon: Package },
];

export function ExpenseModal({
  groupId,
  members,
  currentUserId,
  expenseToEdit,
  triggerButton,
  onSuccess,
}: ExpenseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!expenseToEdit;

  // Form states
  const [description, setDescription] = useState(expenseToEdit?.description || "");
  const [amountRupees, setAmountRupees] = useState<string>(
    expenseToEdit ? (expenseToEdit.amountPaise / 100).toString() : ""
  );
  const [payerId, setPayerId] = useState(expenseToEdit?.payerId || currentUserId);
  const [date, setDate] = useState(
    expenseToEdit
      ? new Date(expenseToEdit.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState(expenseToEdit?.category || "FOOD");
  const [splitType, setSplitType] = useState<SplitType>(
    expenseToEdit?.splitType || "EQUAL"
  );

  // Participant allocations
  // For EQUAL: set of selected userIds
  const [equalParticipants, setEqualParticipants] = useState<string[]>(
    expenseToEdit
      ? expenseToEdit.splits.map((s) => s.userId)
      : members.map((m) => m.id)
  );

  // For EXACT: Record<userId, rupeesString>
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (expenseToEdit && expenseToEdit.splitType === "EXACT") {
      expenseToEdit.splits.forEach((s) => {
        map[s.userId] = (s.amountPaise / 100).toString();
      });
    }
    return map;
  });

  // For PERCENTAGE: Record<userId, percentageString>
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (expenseToEdit && expenseToEdit.splitType === "PERCENTAGE") {
      expenseToEdit.splits.forEach((s) => {
        map[s.userId] = (s.shareValue ?? 0).toString();
      });
    } else {
      const even = (100 / members.length).toFixed(1);
      members.forEach((m) => {
        map[m.id] = even;
      });
    }
    return map;
  });

  // For SHARES: Record<userId, sharesString>
  const [shares, setShares] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (expenseToEdit && expenseToEdit.splitType === "SHARES") {
      expenseToEdit.splits.forEach((s) => {
        map[s.userId] = (s.shareValue ?? 1).toString();
      });
    } else {
      members.forEach((m) => {
        map[m.id] = "1";
      });
    }
    return map;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculations for live validation
  const parsedAmount = parseFloat(amountRupees) || 0;

  // Exact validation
  const exactSum = Object.values(exactAmounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );
  const exactDiff = parsedAmount - exactSum;

  // Percentage validation
  const percentageSum = Object.values(percentages).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  // Shares validation
  const totalShares = Object.values(shares).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedAmount <= 0) {
      setError("Please enter a valid expense amount greater than 0.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    // Build participants array based on splitType
    let participantsPayload: {
      userId: string;
      exactAmountRupees?: number;
      percentage?: number;
      shares?: number;
    }[] = [];

    if (splitType === "EQUAL") {
      if (equalParticipants.length === 0) {
        setError("Please select at least one participant to split with.");
        return;
      }
      participantsPayload = equalParticipants.map((userId) => ({ userId }));
    } else if (splitType === "EXACT") {
      if (Math.abs(exactDiff) > 0.01) {
        setError(
          `Exact amounts do not add up to ₹${parsedAmount.toFixed(2)}. Difference: ${exactDiff > 0 ? "+" : ""}${exactDiff.toFixed(2)}`
        );
        return;
      }
      participantsPayload = Object.entries(exactAmounts)
        .map(([userId, val]) => ({
          userId,
          exactAmountRupees: parseFloat(val) || 0,
        }))
        .filter((p) => (p.exactAmountRupees ?? 0) > 0);
    } else if (splitType === "PERCENTAGE") {
      if (Math.abs(percentageSum - 100) > 0.05) {
        setError(`Percentages must sum to 100%. Current sum: ${percentageSum.toFixed(1)}%`);
        return;
      }
      participantsPayload = Object.entries(percentages)
        .map(([userId, val]) => ({
          userId,
          percentage: parseFloat(val) || 0,
        }))
        .filter((p) => (p.percentage ?? 0) > 0);
    } else if (splitType === "SHARES") {
      if (totalShares <= 0) {
        setError("Total shares must be greater than 0.");
        return;
      }
      participantsPayload = Object.entries(shares)
        .map(([userId, val]) => ({
          userId,
          shares: parseFloat(val) || 0,
        }))
        .filter((p) => (p.shares ?? 0) > 0);
    }

    setLoading(true);

    try {
      if (isEditing && expenseToEdit) {
        const res = await updateExpenseAction(expenseToEdit.id, {
          groupId,
          description: description.trim(),
          amountRupees: parsedAmount,
          payerId,
          date,
          category,
          splitType,
          participants: participantsPayload,
        });

        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
      } else {
        const res = await createExpenseAction({
          groupId,
          description: description.trim(),
          amountRupees: parsedAmount,
          payerId,
          date,
          category,
          splitType,
          participants: participantsPayload,
        });

        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
      }

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch {
      setError("An unexpected error occurred. Please check values and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  {isEditing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {isEditing ? "Edit Trip Expense" : "Record New Expense"}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Split with exact paise precision in INR
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}

              {/* Amount and Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Amount (INR ₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-semibold placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Scuba diving, Dinner, Fuel"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                  />
                </div>
              </div>

              {/* Payer and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Paid By *
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.id === currentUserId ? "(You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Mode Selector */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Split Mode
                  </label>
                  <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                    {(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as SplitType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSplitType(type)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          splitType === type
                            ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {type === "EQUAL" && "Equal (=)"}
                        {type === "EXACT" && "Exact (₹)"}
                        {type === "PERCENTAGE" && "Percent (%)"}
                        {type === "SHARES" && "Shares (x:y)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Configuration Area */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                  {/* Mode: EQUAL */}
                  {splitType === "EQUAL" && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-3">
                        Split equally among checked friends. Any leftover paise are distributed
                        fairly.
                      </p>
                      <div className="space-y-2">
                        {members.map((m) => {
                          const isChecked = equalParticipants.includes(m.id);
                          const perPerson =
                            equalParticipants.length > 0 && parsedAmount > 0
                              ? (parsedAmount / equalParticipants.length).toFixed(2)
                              : "0.00";

                          return (
                            <label
                              key={m.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEqualParticipants([...equalParticipants, m.id]);
                                    } else {
                                      setEqualParticipants(
                                        equalParticipants.filter((id) => id !== m.id)
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                  {m.name} {m.id === currentUserId ? "(You)" : ""}
                                </span>
                              </div>
                              {isChecked && (
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  ₹{perPerson}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode: EXACT */}
                  {splitType === "EXACT" && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-500">
                          Enter exact rupee amounts for each friend.
                        </span>
                        <span
                          className={`font-semibold ${
                            Math.abs(exactDiff) < 0.01
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          Remaining: ₹{exactDiff.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                          >
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">
                              {m.name} {m.id === currentUserId ? "(You)" : ""}
                            </span>
                            <div className="relative w-32">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={exactAmounts[m.id] || ""}
                                onChange={(e) =>
                                  setExactAmounts({
                                    ...exactAmounts,
                                    [m.id]: e.target.value,
                                  })
                                }
                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-right text-sm font-medium text-zinc-900 dark:text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode: PERCENTAGE */}
                  {splitType === "PERCENTAGE" && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-500">
                          Enter percentages (must total 100%).
                        </span>
                        <span
                          className={`font-semibold ${
                            Math.abs(percentageSum - 100) < 0.05
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          Total: {percentageSum.toFixed(1)}% / 100%
                        </span>
                      </div>
                      <div className="space-y-2">
                        {members.map((m) => {
                          const pct = parseFloat(percentages[m.id] || "0") || 0;
                          const calculatedRs = ((parsedAmount * pct) / 100).toFixed(2);
                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                            >
                              <div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white block">
                                  {m.name} {m.id === currentUserId ? "(You)" : ""}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  ≈ ₹{calculatedRs}
                                </span>
                              </div>
                              <div className="relative w-28">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={percentages[m.id] || ""}
                                  onChange={(e) =>
                                    setPercentages({
                                      ...percentages,
                                      [m.id]: e.target.value,
                                    })
                                  }
                                  className="w-full pr-6 pl-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-right text-sm font-medium text-zinc-900 dark:text-white"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                  %
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode: SHARES */}
                  {splitType === "SHARES" && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-500">
                          Allocate proportional shares (e.g. 1 share, 2 shares).
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Total Shares: {totalShares}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {members.map((m) => {
                          const userShares = parseFloat(shares[m.id] || "0") || 0;
                          const calculatedRs =
                            totalShares > 0
                              ? ((parsedAmount * userShares) / totalShares).toFixed(2)
                              : "0.00";
                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                            >
                              <div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white block">
                                  {m.name} {m.id === currentUserId ? "(You)" : ""}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  ≈ ₹{calculatedRs}
                                </span>
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  placeholder="1"
                                  value={shares[m.id] || ""}
                                  onChange={(e) =>
                                    setShares({
                                      ...shares,
                                      [m.id]: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-right text-sm font-medium text-zinc-900 dark:text-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : isEditing
                    ? "Update Expense"
                    : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
