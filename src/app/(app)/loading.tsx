import { LoadingNote, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <LoadingNote>Loading…</LoadingNote>
      </div>
      <Skeleton className="h-64 rounded-[20px]" />
    </div>
  );
}
