import { LoadingNote, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <p className="eyebrow">Workspace</p>
        <h1 className="display-title">Your Salesforce orgs</h1>
        <LoadingNote>Loading your orgs…</LoadingNote>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-44 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
