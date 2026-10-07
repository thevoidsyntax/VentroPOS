interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({ className = '', width, height, variant = 'rectangular' }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variantClass = variant === 'text'
    ? 'rounded h-4'
    : variant === 'circular'
      ? 'rounded-full'
      : 'rounded-md';

  return (
    <div
      className={`animate-pulse bg-muted ${variantClass} ${className}`}
      style={style}
    />
  );
}

export function LoadingSkeleton({ className = '' }: SkeletonProps) {
  return <Skeleton className={className} />;
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center p-3 bg-card rounded-lg border">
          <Skeleton width={80} height={80} className="mb-3" />
          <Skeleton width="80%" className="mb-2" />
          <Skeleton width="60%" />
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
            <Skeleton width={48} height={48} />
            <div className="space-y-2">
              <Skeleton width={120} />
              <Skeleton width={80} />
            </div>
          </div>
          <Skeleton width={80} height={24} />
        </div>
      ))}
    </div>
  );
}
