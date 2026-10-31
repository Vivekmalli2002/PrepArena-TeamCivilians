"use client";

import { Check, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp, useHydrated } from "@/lib/store";
import { Button } from "./ui";

/** "Prepare for this exam" — sets it as the target (or starts onboarding with it). */
export function ExamCta({ examId }: { examId: string }) {
  const hydrated = useHydrated();
  const profile = useApp((s) => s.profile);
  const router = useRouter();
  if (!hydrated) return null;
  const mine = profile?.examId === examId;
  return (
    <Button
      className="mt-4"
      variant={mine ? "soft" : "primary"}
      onClick={() => {
        const p = profile ?? { name: "", createdAt: Date.now(), examId };
        useApp.getState().setProfile({ ...p, examId });
        router.push("/tests");
      }}
    >
      {mine ? <Check size={17} /> : <Play size={17} />} {mine ? "Your target exam — practise" : "Prepare for this exam"}
    </Button>
  );
}
