import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { joinGroupAction } from "@/lib/groups/actions";
import { Compass, Users, CheckCircle2, ArrowRight } from "lucide-react";

interface JoinPageProps {
  params: Promise<{
    inviteToken: string;
  }>;
}

export default async function JoinGroupPage({ params }: JoinPageProps) {
  const { inviteToken } = await params;
  const user = await getCurrentUser();

  const group = await prisma.group.findUnique({
    where: { inviteToken },
    include: {
      createdBy: {
        select: { name: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Invalid or Expired Invite
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            The trip invite link you followed is invalid or has been deactivated.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If user is already logged in, check if already member
  const isAlreadyMember = user
    ? group.members.some((m) => m.userId === user.id)
    : false;

  const handleJoinServer = async () => {
    "use server";
    const res = await joinGroupAction(inviteToken);
    if (res.groupId) {
      redirect(`/groups/${res.groupId}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg p-6 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-6">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Trip Invitation
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1 mb-2">
          {group.name}
        </h1>

        {group.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            {group.description}
          </p>
        )}

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-left mb-8">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Organized by</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {group.createdBy.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Current Members</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {group.members.length} friends
            </span>
          </div>
        </div>

        {user ? (
          isAlreadyMember ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                You are already a member of this trip
              </div>
              <Link
                href={`/groups/${group.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm shadow-md shadow-emerald-600/30"
              >
                Open Trip Details
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form action={handleJoinServer}>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Accept Invite & Join Trip
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 mb-2">
              Sign in or create an account to accept this trip invitation
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/join/${inviteToken}`)}`}
                className="py-3 px-4 rounded-xl font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=${encodeURIComponent(`/join/${inviteToken}`)}`}
                className="py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm shadow-md shadow-emerald-600/30 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
