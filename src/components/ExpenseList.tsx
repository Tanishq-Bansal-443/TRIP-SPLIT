"use client";

import { useState } from "react";
import { formatINR, SplitType } from "@/lib/calculations";
import { deleteExpenseAction } from "@/lib/expenses/actions";
import { ExpenseModal } from "./ExpenseModal";
import {
  Utensils,
  Car,
  Home,
  Compass,
  ShoppingBag,
  Film,
  Package,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Calendar,
  User,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
}

export interface ExpenseItem {
  id: string;
  groupId: string;
  description: string;
  totalAmountPaise: number;
  payerId: string;
  payer: {
    id: string;
    name: string;
  };
  date: string | Date;
  category: string;
  splitType: SplitType;
  splits: {
    id: string;
    userId: string;
    amountPaise: number;
    shareValue?: number | null;
    user: {
      id: string;
      name: string;
    };
  }[];
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  groupId: string;
  members: Member[];
  currentUserId: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FOOD: Utensils,
  TRANSPORT: Car,
  STAY: Home,
  ACTIVITIES: Compass,
  SHOPPING: ShoppingBag,
  ENTERTAINMENT: Film,
  GENERAL: Package,
};

export function ExpenseList({
  expenses,
  groupId,
  members,
  currentUserId,
}: ExpenseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (expenseId: string, desc: string) => {
    if (!confirm(`Are you sure you want to delete "${desc}"?`)) {
      return;
    }
    setDeletingId(expenseId);
    try {
      const res = await deleteExpenseAction(groupId, expenseId);
      if (res?.error) {
        alert(res.error);
      }
    } catch {
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <Package className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          No expenses recorded yet
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Add your first trip expense using the &ldquo;Add Expense&rdquo; button above to start
          tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const Icon = CATEGORY_ICONS[expense.category] || Package;
        const isExpanded = expandedId === expense.id;
        const isPayer = expense.payerId === currentUserId;
        const formattedDate = new Date(expense.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // User's specific share in this expense
        const userSplit = expense.splits.find((s) => s.userId === currentUserId);

        return (
          <div
            key={expense.id}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            {/* Header row */}
            <div
              onClick={() => toggleExpand(expense.id)}
              className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {expense.description}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      <User className="w-3 h-3 text-zinc-400" />
                      {isPayer ? "You paid" : `${expense.payer.name} paid`}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {formattedDate}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      {expense.splitType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <span className="block text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                    {formatINR(expense.totalAmountPaise)}
                  </span>
                  {userSplit && (
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                      Your share: {formatINR(userSplit.amountPaise)}
                    </span>
                  )}
                </div>
                <div className="text-zinc-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="mt-3 mb-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Split Breakdown ({expense.splits.length} participants)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {expense.splits.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {s.user.name} {s.userId === currentUserId ? "(You)" : ""}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {formatINR(s.amountPaise)}
                          </span>
                          {s.shareValue !== undefined && s.shareValue !== null && (
                            <span className="ml-1 text-[10px] text-zinc-400">
                              {expense.splitType === "PERCENTAGE" && `(${s.shareValue}%)`}
                              {expense.splitType === "SHARES" && `(${s.shareValue} shares)`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                  <ExpenseModal
                    groupId={groupId}
                    members={members}
                    currentUserId={currentUserId}
                    expenseToEdit={{
                      id: expense.id,
                      description: expense.description,
                      amountPaise: expense.totalAmountPaise,
                      payerId: expense.payerId,
                      date: typeof expense.date === "string" ? expense.date : expense.date.toISOString(),
                      category: expense.category,
                      splitType: expense.splitType,
                      splits: expense.splits.map((s) => ({
                        userId: s.userId,
                        amountPaise: s.amountPaise,
                        shareValue: s.shareValue,
                      })),
                    }}
                    triggerButton={
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    }
                  />

                  <button
                    onClick={() => handleDelete(expense.id, expense.description)}
                    disabled={deletingId === expense.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === expense.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
