import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsSkeletonProps {
  count?: number;
}

export const StatsSkeleton = ({ count = 4 }: StatsSkeletonProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-7 w-28 mb-1" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
};
