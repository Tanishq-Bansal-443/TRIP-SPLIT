import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  calculateGroupBalances,
  simplifyDebts,
  formatINR,
} from "@/lib/calculations";
import { ExpenseModal } from "@/components/ExpenseModal";
import { SettleUpModal } from "@/components/SettleUpModal";
import { InviteLinkButton } from "@/components/InviteLinkButton";
import { GroupTabs } from "@/components/GroupTabs";
import { ExpenseItem } from "@/components/ExpenseList";
import { SettlementItem } from "@/components/SettlementsList";
import {
  ArrowLeft,
  IndianRupee,
  Scale,
  Wallet,
} from "lucide-react";

interface GroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id: groupId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/groups/${groupId}`)}`);
  }

  // Check group membership authorization
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xl">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            You are not an authorized member of this trip group. Ask an existing member for an
            invite link to join.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Fetch group data
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        include: {
          payer: { select: { id: true, name: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      },
      settlements: {
        include: {
          payer: { select: { id: true, name: true } },
          payee: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Format members for calculation engine
  const membersList = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  // Calculate balances & debt simplification
  const balanceSummary = calculateGroupBalances(
    membersList,
    group.expenses,
    group.settlements
  );

  const simplifiedDebt = simplifyDebts(balanceSummary.memberBalances);
  const currentUserBalance =
    balanceSummary.memberBalances[user.id]?.netBalancePaise || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white font-semibold">
          {group.name}
        </span>
      </div>

      {/* Group Header Banner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {group.name}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {group.members.length} friends
            </span>
          </div>

          {group.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {group.description}
            </p>
          )}

          {/* Members chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-400 font-medium">Crew:</span>
            {group.members.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[9px]">
                  {m.user.name.slice(0, 1).toUpperCase()}
                </span>
                {m.user.name} {m.userId === user.id ? "(You)" : ""}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <InviteLinkButton
            inviteToken={group.inviteToken}
            groupName={group.name}
          />
          <SettleUpModal
            groupId={group.id}
            members={membersList}
            currentUserId={user.id}
          />
          <ExpenseModal
            groupId={group.id}
            members={membersList}
            currentUserId={user.id}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Spend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Group Spend</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatINR(balanceSummary.totalGroupExpenditurePaise)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Across {group.expenses.length} group expenses
          </p>
        </div>

        {/* Your Net Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Your Net Balance</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <p
            className={`text-2xl font-bold ${
              currentUserBalance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : currentUserBalance < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-900 dark:text-white"
            }`}
          >
            {formatINR(currentUserBalance, { showSign: true })}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {currentUserBalance > 0
              ? "You are owed in this trip"
              : currentUserBalance < 0
              ? "You owe in this trip"
              : "You are all settled up!"}
          </p>
        </div>

        {/* Debt Simplification Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Repayment Efficiency</span>
            <Scale className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {simplifiedDebt.transactionCount} repayment{simplifiedDebt.transactionCount === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Greedy min-cash-flow simplified
          </p>
        </div>
      </div>

      {/* Main Tabs (Expenses, Balances, Settlements) */}
      <GroupTabs
        groupId={group.id}
        members={membersList}
        currentUserId={user.id}
        expenses={group.expenses as unknown as ExpenseItem[]}
        settlements={group.settlements as unknown as SettlementItem[]}
        memberBalances={balanceSummary.memberBalances}
        suggestedSettlements={simplifiedDebt.suggestedSettlements}
        isZeroSumInvariantMaintained={balanceSummary.isZeroSumInvariantMaintained}
      />
    </div>
  );
}
