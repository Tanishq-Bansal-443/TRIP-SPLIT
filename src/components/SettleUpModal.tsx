"use client";

import { useState } from "react";
import { recordSettlementAction } from "@/lib/expenses/actions";
import { Handshake, X, IndianRupee, Calendar } from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface SettleUpModalProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  initialPayerId?: string;
  initialPayeeId?: string;
  initialAmountRupees?: number;
  triggerButton?: React.ReactNode;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
}

export function SettleUpModal({
  groupId,
  members,
  currentUserId,
  initialPayerId,
  initialPayeeId,
  initialAmountRupees,
  triggerButton,
  isOpenControlled,
  onCloseControlled,
}: SettleUpModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;

  const handleClose = () => {
    if (onCloseControlled) {
      onCloseControlled();
    } else {
      setInternalOpen(false);
    }
  };

  const defaultPayer =
    initialPayerId || (members.find((m) => m.id === currentUserId)?.id ?? members[0]?.id);
  const defaultPayee =
    initialPayeeId || members.find((m) => m.id !== defaultPayer)?.id || members[0]?.id;

  const [payerId, setPayerId] = useState(defaultPayer);
  const [payeeId, setPayeeId] = useState(defaultPayee);
  const [amountRupees, setAmountRupees] = useState(
    initialAmountRupees !== undefined ? initialAmountRupees.toString() : ""
  );
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid settlement amount greater than 0.");
      return;
    }

    if (payerId === payeeId) {
      setError("The paying member and receiving member must be different.");
      return;
    }

    setLoading(true);

    try {
      const res = await recordSettlementAction({
        groupId,
        payerId,
        payeeId,
        amountRupees: parsedAmount,
        note: note.trim() || undefined,
        date,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      handleClose();
      setAmountRupees("");
      setNote("");
    } catch {
      setError("Failed to record settlement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setInternalOpen(true)}>{triggerButton}</div>
      ) : (
        <button
          onClick={() => setInternalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Handshake className="w-4 h-4 text-emerald-600" />
          Settle Up
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Record Repayment
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Settle debt between two friends
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Who Paid? (Payer)
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
                  Who Received? (Recipient)
                </label>
                <select
                  value={payeeId}
                  onChange={(e) => setPayeeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.id === currentUserId ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                    />
                  </div>
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
                      className="w-full pl-10 pr-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Paid via GPay / UPI, Cash"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
