import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TRIP-SPLIT | Smart Expense Splitting for Travellers",
  description:
    "Lightweight, production-ready group expense splitting application with debt simplification, exact paise precision, and multi-split options in INR.",
};

async function DynamicNavbar() {
  const user = await getCurrentUser();
  return <Navbar user={user} />;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <Suspense fallback={<Navbar user={null} />}>
          <DynamicNavbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
