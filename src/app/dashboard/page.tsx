import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { JoinGroupModal } from "@/components/JoinGroupModal";
import { seedSampleTripAction } from "@/lib/groups/actions";
import { calculateGroupBalances, formatINR } from "@/lib/calculations";
import {
  Compass,
  Users,
  IndianRupee,
  ArrowRight,
  Sparkles,
  Plane,
  Receipt,
  Wallet,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch groups user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          expenses: {
            include: {
              splits: true,
            },
          },
          settlements: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groupSummaries = memberships.map((m) => {
    const group = m.group;
    const membersInfo = group.members.map((gm) => ({
      id: gm.user.id,
      name: gm.user.name,
      email: gm.user.email,
    }));

    const balanceSummary = calculateGroupBalances(
      membersInfo,
      group.expenses,
      group.settlements
    );

    const userBalance = balanceSummary.memberBalances[user.id]?.netBalancePaise || 0;

    return {
      group,
      role: m.role,
      userBalance,
      totalTripExpenditure: balanceSummary.totalGroupExpenditurePaise,
      membersCount: group.members.length,
      expensesCount: group.expenses.length,
    };
  });

  const totalNetAcrossGroupsPaise = groupSummaries.reduce(
    (sum, g) => sum + g.userBalance,
    0
  );
  const totalSpentAcrossGroupsPaise = groupSummaries.reduce(
    (sum, g) => sum + g.totalTripExpenditure,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Hello, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track and settle expenses across your active travel groups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <JoinGroupModal />
          <CreateGroupModal />
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Overall Net Balance</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p
            className={`text-2xl font-bold ${
              totalNetAcrossGroupsPaise > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : totalNetAcrossGroupsPaise < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-900 dark:text-white"
            }`}
          >
            {formatINR(totalNetAcrossGroupsPaise, { showSign: true })}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {totalNetAcrossGroupsPaise > 0
              ? "You are owed in total"
              : totalNetAcrossGroupsPaise < 0
              ? "You owe in total"
              : "All settled up across groups"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Trips</span>
            <Plane className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {memberships.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Group memberships joined
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Group Volume</span>
            <IndianRupee className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatINR(totalSpentAcrossGroupsPaise)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Combined spend across your trips
          </p>
        </div>
      </div>

      {/* Trips List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Your Trips & Groups
          </h2>
          {memberships.length > 0 && (
            <span className="text-xs font-medium text-zinc-500">
              {memberships.length} group{memberships.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {groupSummaries.length === 0 ? (
          /* Empty State */
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              No trips yet!
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
              Start by creating a new travel group for your upcoming trip, or join a
              friend’s group with their invite link.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <CreateGroupModal />
              <JoinGroupModal />

              {/* Seed Demo Trip Button */}
              <form action={seedSampleTripAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Load Demo Goa Trip
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupSummaries.map(({ group, role, userBalance, totalTripExpenditure, membersCount, expensesCount }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {group.name}
                    </h3>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {role}
                    </span>
                  </div>

                  {group.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">
                      {group.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {membersCount} member{membersCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      {expensesCount} expense{expensesCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      Spend: {formatINR(totalTripExpenditure)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                      Your balance
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        userBalance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : userBalance < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {userBalance === 0
                        ? "Settled up"
                        : formatINR(userBalance, { showSign: true })}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
