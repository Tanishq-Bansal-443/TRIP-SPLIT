"use client";

import Link from "next/link";
import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction, quickDemoLoginAction, AuthState } from "@/lib/auth/actions";
import { Compass, Lock, Mail, User, ArrowRight } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    registerAction,
    {}
  );

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Create an account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Start planning and splitting expenses with your travel crew
        </p>
      </div>

      {state?.error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectUrl} />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="name"
              required
              placeholder="Aarav Sharma"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Password (min. 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {isPending ? "Creating account..." : "Sign Up"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Quick Logins */}
      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-center font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Or Quick Test with Demo Profiles
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickDemoLoginAction("aarav")}
            type="button"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 transition-colors"
          >
            Aarav
          </button>
          <button
            onClick={() => quickDemoLoginAction("diya")}
            type="button"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 transition-colors"
          >
            Diya
          </button>
          <button
            onClick={() => quickDemoLoginAction("kabir")}
            type="button"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 transition-colors"
          >
            Kabir
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href={`/login${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Sign in instead
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
