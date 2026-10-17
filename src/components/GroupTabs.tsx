"use client";

import { useState } from "react";
import { ExpenseList, ExpenseItem } from "./ExpenseList";
import { BalancesView } from "./BalancesView";
import { SettlementsList, SettlementItem } from "./SettlementsList";
import { MemberBalance } from "@/lib/calculations/balances";
import { SuggestedSettlement } from "@/lib/calculations/debtSimplification";
import { Receipt, Scale, Handshake } from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface GroupTabsProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  expenses: ExpenseItem[];
  settlements: SettlementItem[];
  memberBalances: Record<string, MemberBalance>;
  suggestedSettlements: SuggestedSettlement[];
  isZeroSumInvariantMaintained: boolean;
}

export function GroupTabs({
  groupId,
  members,
  currentUserId,
  expenses,
  settlements,
  memberBalances,
  suggestedSettlements,
  isZeroSumInvariantMaintained,
}: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "settlements">(
    "expenses"
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "expenses"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("balances")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "balances"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balances & Debts</span>
          {suggestedSettlements.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
              {suggestedSettlements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("settlements")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "settlements"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Settlements Log</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {settlements.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "expenses" && (
          <ExpenseList
            expenses={expenses}
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "balances" && (
          <BalancesView
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            memberBalances={memberBalances}
            suggestedSettlements={suggestedSettlements}
            isZeroSumInvariantMaintained={isZeroSumInvariantMaintained}
          />
        )}

        {activeTab === "settlements" && (
          <SettlementsList
            settlements={settlements}
            groupId={groupId}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
