"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/store";
import type { TestConfig } from "@/lib/types";
import { Button, Sheet } from "./ui";

/** Starts a test, asking first if another one is still in progress. */
export function useStartTest() {
  const router = useRouter();
  const [pending, setPending] = useState<TestConfig | null>(null);
  const current = useSession((s) => s.session);

  const go = (config: TestConfig) => {
    useSession.getState().start(config);
    router.push("/play");
  };

  const start = (config: TestConfig | null) => {
    if (!config || !config.qids.length) return;
    const busy = current && current.started && current.responses.some((r) => r != null);
    if (busy && current.config.key !== config.key) setPending(config);
    else if (current && current.config.key === config.key && current.started) router.push("/play");
    else go(config);
  };

  const dialog = (
    <Sheet open={!!pending} onClose={() => setPending(null)} title="Test in progress">
      <p className="text-muted">
        You have an unfinished test: <b className="text-fg">{current?.config.title}</b>. Starting a new one will discard
        it.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => (setPending(null), router.push("/play"))}>
          Resume it
        </Button>
        <Button variant="danger" onClick={() => pending && (go(pending), setPending(null))}>
          Discard & start
        </Button>
      </div>
    </Sheet>
  );

  return { start, dialog };
}
