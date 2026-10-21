import { LoadingNote, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <p className="eyebrow">Savings report</p>
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <LoadingNote>Opening your savings report…</LoadingNote>
      </div>
      <Skeleton className="h-48 rounded-[20px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[20px]" />
    </div>
  );
}
