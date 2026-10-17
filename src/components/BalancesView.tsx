"use client";

import { useState } from "react";
import { formatINR } from "@/lib/calculations";
import { MemberBalance } from "@/lib/calculations/balances";
import { SuggestedSettlement } from "@/lib/calculations/debtSimplification";
import { SettleUpModal } from "./SettleUpModal";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Handshake,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface BalancesViewProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  memberBalances: Record<string, MemberBalance>;
  suggestedSettlements: SuggestedSettlement[];
  isZeroSumInvariantMaintained: boolean;
}

export function BalancesView({
  groupId,
  members,
  currentUserId,
  memberBalances,
  suggestedSettlements,
  isZeroSumInvariantMaintained,
}: BalancesViewProps) {
  // Settle up modal prefill state
  const [selectedSettlement, setSelectedSettlement] = useState<SuggestedSettlement | null>(null);

  return (
    <div className="space-y-8">
      {/* Zero Sum Invariant Badge */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold">Zero-Sum Balance Invariant</h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              All member credits and debts sum strictly to ₹0.00 across the group.
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isZeroSumInvariantMaintained
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
          }`}
        >
          {isZeroSumInvariantMaintained ? "Verified ✓" : "Discrepancy Detected"}
        </span>
      </div>

      {/* Suggested Settlements (Debt Simplification) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Suggested Repayments
              </h3>
              <p className="text-xs text-zinc-500">
                Optimized via debt simplification to minimize total transfers
              </p>
            </div>
          </div>
        </div>

        {suggestedSettlements.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              All settled up!
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              No outstanding debts or repayments remain in this group.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedSettlements.map((s, idx) => {
              const isFromCurrentUser = s.fromUserId === currentUserId;
              const isToCurrentUser = s.toUserId === currentUserId;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isFromCurrentUser
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                      : isToCurrentUser
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span
                        className={`font-bold ${
                          isFromCurrentUser
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {isFromCurrentUser ? "You" : s.fromUserName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span
                        className={`font-bold ${
                          isToCurrentUser
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {isToCurrentUser ? "You" : s.toUserName}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>pays</span>
                      <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                        {formatINR(s.amountPaise)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSettlement(s)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/20 transition-all hover:scale-105"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    Settle This
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances Table */}
      <div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
          Member Net Balances
        </h3>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Share Consumed</th>
                  <th className="py-3 px-4 text-right">Settled (Paid / Recv)</th>
                  <th className="py-3 px-4 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {Object.values(memberBalances).map((b) => {
                  const isUser = b.member.id === currentUserId;
                  const isPositive = b.netBalancePaise > 0;
                  const isNegative = b.netBalancePaise < 0;

                  return (
                    <tr
                      key={b.member.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                        isUser ? "bg-emerald-50/20 dark:bg-emerald-950/10 font-medium" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                            {b.member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {b.member.name} {isUser ? "(You)" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        {formatINR(b.totalPaidPaise)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        {formatINR(b.totalOwedPaise)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-zinc-500">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{formatINR(b.totalSettledPaidPaise)}
                        </span>
                        {" / "}
                        <span className="text-zinc-400">
                          -{formatINR(b.totalSettledReceivedPaise)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isNegative
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
                          {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
                          {formatINR(b.netBalancePaise, { showSign: true })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Prefilled Settle Up Modal */}
      {selectedSettlement && (
        <SettleUpModal
          key={`${selectedSettlement.fromUserId}-${selectedSettlement.toUserId}-${selectedSettlement.amountPaise}`}
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          initialPayerId={selectedSettlement.fromUserId}
          initialPayeeId={selectedSettlement.toUserId}
          initialAmountRupees={selectedSettlement.amountPaise / 100}
          isOpenControlled={true}
          onCloseControlled={() => setSelectedSettlement(null)}
        />
      )}
    </div>
  );
}
