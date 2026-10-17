"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction, quickDemoLoginAction } from "@/lib/auth/actions";
import { Compass, LogOut, Users, ChevronDown, Check } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleDemoSwitch = async (name: "aarav" | "diya" | "kabir") => {
    setSwitching(true);
    await quickDemoLoginAction(name);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              TRIP-SPLIT
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              INR ₹
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 transition-colors text-sm font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-zinc-900 dark:text-zinc-100 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      >
                        <Users className="w-4 h-4 text-emerald-600" />
                        My Trips & Groups
                      </Link>
                    </div>

                    <div className="py-2 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="px-3 pb-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Switch Demo Account
                      </p>
                      <button
                        onClick={() => handleDemoSwitch("aarav")}
                        disabled={switching}
                        className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <span>Aarav (aarav@tripsplit.local)</span>
                        {user.email.includes("aarav") && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleDemoSwitch("diya")}
                        disabled={switching}
                        className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <span>Diya (diya@tripsplit.local)</span>
                        {user.email.includes("diya") && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleDemoSwitch("kabir")}
                        disabled={switching}
                        className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <span>Kabir (kabir@tripsplit.local)</span>
                        {user.email.includes("kabir") && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    </div>

                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm shadow-emerald-600/30 transition-all hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
