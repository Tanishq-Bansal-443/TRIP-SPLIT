import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { quickDemoLoginAction } from "@/lib/auth/actions";
import {
  Zap,
  ShieldCheck,
  Split,
  IndianRupee,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(0,0,0,0))]" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Designed for travel groups & road trips
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
            Split expenses effortlessly on your next{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              group adventure
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
            TRIP-SPLIT eliminates awkward money conversations with friends. Features
            exact paise accuracy in INR, flexible split modes, and greedy debt simplification
            to minimize bank transfers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start a Trip Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 text-left">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 text-center sm:text-left">
              ⚡ Live Demo: Click below to test immediately
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <form action={quickDemoLoginAction.bind(null, "aarav")}>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
                >
                  Login as Aarav 👤
                </button>
              </form>
              <form action={quickDemoLoginAction.bind(null, "diya")}>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
                >
                  Login as Diya 👤
                </button>
              </form>
              <form action={quickDemoLoginAction.bind(null, "kabir")}>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
                >
                  Login as Kabir 👤
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Built with mathematical precision for group peace of mind
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              No rounding errors, no confusing chain of debts, no lost receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
                Exact Paise Accuracy
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Calculations are executed in integer paise. Even odd splits like ₹100 among 3 people allocate every last single paisa cleanly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
                Debt Simplification
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Greedy minimum cash-flow algorithm condenses complex multi-party debts into the minimum possible peer payments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <Split className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
                4 Flexible Split Types
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Supports Equal, Exact amount, Percentage, and Custom Shares allocations with automatic validation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
                Unguessable Invite Links
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cryptographically secure tokenized links ensure only invited friends can join and access your private trip details.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
