export default function GroupDetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-pulse space-y-8">
      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />

      <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
