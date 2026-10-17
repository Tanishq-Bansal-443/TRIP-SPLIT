export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-pulse space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
