export default function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <p className="text-xs text-gray-500 dark:text-slate-400 sm:text-sm">{title}</p>

      <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
        {value}
      </h2>
    </div>
  );
}
