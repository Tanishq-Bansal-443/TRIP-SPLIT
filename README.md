# TRIP-SPLIT

> A lightweight, production-ready Splitwise-inspired group expense-splitting web application engineered specifically for friends travelling together.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

---

## 🌟 Key Features

### 1. Groups & Secure Membership
- **Trip Creation**: Create travel groups with custom names and optional descriptions.
- **Unguessable Invite Links**: Cryptographically secure 32-character hex tokens for private invite links (`/join/[inviteToken]`).
- **Session-Based Authentication**: Secure HTTP-only JWT sessions with `bcryptjs` password hashing. Real user accounts prevent spoofing (does not rely on display names alone).
- **Group Authorization**: Strict server-side verification ensures only active group members can view or modify group resources.

### 2. Expense Management & Precise Splits
- **Integer Paise Arithmetic**: All INR monetary calculations are stored and computed in integer paise (1 INR = 100 paise) to eliminate floating-point rounding errors.
- **4 Flexible Split Modes**:
  - **Equal (`=`)**: Even division among selected friends with fair distribution of remainder paise.
  - **Exact (`₹`)**: User-specified exact amounts with real-time balance validation.
  - **Percentage (`%`)**: Percentage allocations with largest-remainder rounding (Hare-Niemeyer method).
  - **Shares (`x:y`)**: Custom weighted shares/ratios.
- **Atomic Transactions**: All expense creations, split recalculations, and updates are executed inside Prisma database transactions.
- **Categorization**: Visual category tags (Food, Transport, Accommodation, Activities, Shopping, Entertainment, General).

### 3. Balances & Debt Simplification
- **Zero-Sum Invariant**: Strictly guarantees that the sum of all member net balances across the group equals exactly ₹0.00 at all times (`sum(net_balances) === 0`).
- **Greedy Debt Simplification (Min-Cash-Flow)**: Computes the minimum number of peer-to-peer repayments required to settle all debts (e.g., if A owes B ₹500 and B owes C ₹500, the system simplifies this into a single direct transfer: A pays C ₹500).
- **Settlement Tracking**: Dedicated peer-to-peer repayment recording that resolves debts without double-counting or altering total group expenditure.

### 4. Interactive Dashboard & Mobile-First UX
- **Live Demo Switcher**: Instant 1-click test logins (`Aarav`, `Diya`, `Kabir`) and a 1-click demo trip generator ("Goa Road Trip") for live evaluation.
- **Responsive Layout**: Designed mobile-first for travellers checking balances on their phones on the go.
- **Loading & Error States**: Built-in skeleton screens and error boundaries.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma ORM 6](https://www.prisma.io/)
- **Auth**: Secure JWT cookie sessions with [jose](https://github.com/panva/jose) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📁 Project Structure

```
TRIP-SPLIT/
├── prisma/
│   ├── schema.prisma           # Prisma data models & relations
│   └── migrations/             # Applied SQL migrations
├── src/
│   ├── app/                    # Next.js App Router pages & layouts
│   │   ├── page.tsx            # Landing page with hero & quick demo
│   │   ├── login/page.tsx      # Sign in page
│   │   ├── register/page.tsx   # Registration page
│   │   ├── dashboard/page.tsx  # User trips overview & balance summary
│   │   ├── groups/[id]/        # Trip detail dashboard, expenses & balances
│   │   ├── join/[inviteToken]/ # Secure invite acceptance page
│   │   ├── layout.tsx          # Root layout with streaming Navbar
│   │   ├── error.tsx           # Global error boundary
│   │   ├── not-found.tsx       # 404 handler
│   │   └── loading.tsx         # Global loading spinner
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.tsx          # Sticky navigation with account switcher
│   │   ├── CreateGroupModal.tsx# Trip group creation modal
│   │   ├── JoinGroupModal.tsx  # Modal to enter invite link
│   │   ├── ExpenseModal.tsx    # Modal for creating/editing expenses & splits
│   │   ├── SettleUpModal.tsx   # Modal for recording peer repayments
│   │   ├── ExpenseList.tsx     # Chronological expenses & split breakdown
│   │   ├── BalancesView.tsx    # Net balances & debt simplification
│   │   ├── SettlementsList.tsx # Recorded repayments log
│   │   └── InviteLinkButton.tsx# Clipboard copy button with feedback
│   └── lib/
│       ├── prisma.ts           # Prisma client singleton
│       ├── auth/
│       │   ├── session.ts      # JWT session cookie & authorization helpers
│       │   └── actions.ts      # Auth server actions (register, login, logout)
│       ├── groups/
│       │   └── actions.ts      # Group creation & invite actions
│       ├── expenses/
│       │   └── actions.ts      # Expense creation, update, delete & settlements
│       └── calculations/       # Pure calculation engines & unit tests
│           ├── currency.ts     # Paise-to-rupees & INR formatting
│           ├── splits.ts       # Equal, Exact, Percentage, Shares split engine
│           ├── balances.ts     # Net balance & zero-sum invariant calculator
│           ├── debtSimplification.ts # Greedy min-cash-flow algorithm
│           └── __tests__/      # Vitest test suite
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20 or higher (v22 recommended)
- **Package Manager**: `pnpm` (or `npm`)
- **PostgreSQL**: A running PostgreSQL instance (local or hosted on Neon, Supabase, etc.)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/TRIP-SPLIT.git
cd TRIP-SPLIT

# Install dependencies using pnpm
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL database URL and session secret:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripsplit?schema=public"

# Session encryption secret (minimum 32 characters)
SESSION_SECRET="your-secure-random-32-character-session-secret"

# Next.js app URL (optional in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Database Migrations

Apply the Prisma migrations to create the database tables:

```bash
pnpm prisma migrate dev
```

### 5. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

TRIP-SPLIT includes a full test suite testing currency rounding, split allocations, remainder distributions, zero-sum invariants, debt simplification, and Prisma integration:

```bash
# Run unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run TypeScript type check
pnpm tsc --noEmit

# Run ESLint
pnpm lint
```

---

## 🚢 Vercel Deployment Guide

### Step 1: Push Code to GitHub / GitLab
Push your project to a remote git repository.

### Step 2: Set up a PostgreSQL Database
Use a cloud-hosted Postgres database such as:
- **Neon** (Serverless Postgres)
- **Supabase**
- **Vercel Postgres**

Obtain the pooled connection string (e.g. `postgresql://...pooler.us-east-1.postgres.vercel-storage.com/...`).

### Step 3: Create Project on Vercel
1. Import your repository in the [Vercel Dashboard](https://vercel.com/new).
2. Set the framework preset to **Next.js**.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your pooled PostgreSQL connection string.
   - `SESSION_SECRET`: A secure 32+ character random secret string.

### Step 4: Configure Build Command
In the Vercel Project Settings > Build & Development:
- **Build Command**: `prisma generate && next build` (or default `pnpm build` if `prisma generate` is in your postinstall).

### Step 5: Deploy
Click **Deploy**. Once built, run migrations against your production database:
```bash
npx prisma migrate deploy
```

---

## 🔒 Security & Invariants

1. **Authorization**: Every protected Server Action verifies that the session user exists and is a registered member of the target group before executing queries or mutations.
2. **Unguessable Tokens**: Group invite links use a 32-character hex token generated via `crypto.randomBytes(16)`.
3. **No Database Secrets Exposed**: All database interactions occur strictly on the server; credentials are never bundled into client payloads.
4. **Mathematical Balance Guarantee**: Total net balances across any group always sum to zero (`sum(balances) === 0`).
