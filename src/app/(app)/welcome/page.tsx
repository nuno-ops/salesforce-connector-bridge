import type { Metadata } from "next";
import { AnswersForm } from "@/components/app/answers-form";
import { requireWorkspace } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "A few questions" };

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const { workspace } = await requireWorkspace();
  const { next } = await searchParams;
  const answers = workspace.answers && !workspace.answers.skipped ? workspace.answers : null;
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <p className="eyebrow">{answers ? "Your company" : "Welcome"}</p>
        <h1 className="display-title">A few questions a scan can&apos;t answer</h1>
        <p className="text-muted-foreground">
          These change what you could save, and Salesforce doesn&apos;t record them. Every question is optional, and you can change your
          answers any time from Settings.
        </p>
      </div>
      <AnswersForm answers={answers} next={safeNext(typeof next === "string" ? next : "/dashboard")} />
    </div>
  );
}
