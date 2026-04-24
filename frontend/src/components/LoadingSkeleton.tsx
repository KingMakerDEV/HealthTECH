const CardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="h-4 w-1/3 skeleton-pulse" />
    <div className="h-3 w-full skeleton-pulse" />
    <div className="h-3 w-2/3 skeleton-pulse" />
  </div>
);

const ListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-full skeleton-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 skeleton-pulse" />
          <div className="h-2 w-1/3 skeleton-pulse" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="h-8 w-64 skeleton-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <CardSkeleton />
  </div>
);

export { CardSkeleton, ListSkeleton, DashboardSkeleton };
