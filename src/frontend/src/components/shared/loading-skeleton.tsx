interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className}`} />
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center p-3 bg-card rounded-lg border">
          <Skeleton variant="rectangular" width={80} height={80} className="mb-3" />
          <Skeleton variant="text" width="80%" className="mb-2" />
          <Skeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={48} height={48} />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} />
            </div>
          </div>
          <Skeleton variant="rectangular" width={80} height={24} />
        </div>
      ))}
    </div>
  );
}
