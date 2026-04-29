export default function Skeleton({ type = 'card', count = 1 }) {
  const skeletons = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {skeletons.map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1A1A1A] rounded-sm overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-[#262626]" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-1/2" />
              <div className="pt-2 flex gap-2">
                <div className="h-8 bg-gray-200 dark:bg-[#262626] rounded flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className="w-full h-48 sm:h-64 bg-gray-200 dark:bg-[#262626] rounded-sm animate-pulse mb-8" />
    );
  }

  return null;
}
