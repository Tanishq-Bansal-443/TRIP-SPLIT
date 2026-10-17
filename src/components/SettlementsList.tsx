"use client";

import { useState } from "react";
import { formatINR } from "@/lib/calculations";
import { deleteSettlementAction } from "@/lib/expenses/actions";
import { Handshake, Trash2, Calendar, ArrowRight } from "lucide-react";

export interface SettlementItem {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amountPaise: number;
  note?: string | null;
  date: string | Date;
  payer: {
    id: string;
    name: string;
  };
  payee: {
    id: string;
    name: string;
  };
}

interface SettlementsListProps {
  settlements: SettlementItem[];
  groupId: string;
  currentUserId: string;
}

export function SettlementsList({
  settlements,
  groupId,
  currentUserId,
}: SettlementsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recorded repayment?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteSettlementAction(groupId, id);
    } catch {
      alert("Failed to delete settlement.");
    } finally {
      setDeletingId(null);
    }
  };

  if (settlements.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <Handshake className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          No settlements recorded yet
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          When friends pay each other back directly, click &ldquo;Settle Up&rdquo; to record it
          here and keep balances in sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((s) => {
        const isPayer = s.payerId === currentUserId;
        const isPayee = s.payeeId === currentUserId;
        const formattedDate = new Date(s.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <div
            key={s.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {isPayer ? "You" : s.payer.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {isPayee ? "You" : s.payee.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {formattedDate}
                  </span>
                  {s.note && (
                    <>
                      <span>•</span>
                      <span className="italic truncate max-w-[200px] text-zinc-600 dark:text-zinc-400">
                        &ldquo;{s.note}&rdquo;
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatINR(s.amountPaise)}
              </span>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
                title="Delete repayment"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
