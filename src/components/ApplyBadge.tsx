"use client";

import { applyStatus, fmtDate, type Notification } from "@/content/notifications";
import { dayKey } from "@/lib/random";
import { useHydrated } from "@/lib/store";
import { cx } from "./ui";

/** Application window status — computed on the device so it stays right after deploy. */
export function ApplyBadge({ n, long }: { n: Notification; long?: boolean }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span className="inline-block h-6 w-28 rounded-full bg-hairline" />;
  const s = applyStatus(n, dayKey());
  const label =
    s === "open" ? `Applications open · till ${fmtDate(n.apply.to)}` : s === "upcoming" ? `Opens ${fmtDate(n.apply.from)}` : "Applications closed";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        s === "open" && "bg-good-soft text-good",
        s === "upcoming" && "bg-primary-soft text-primary",
        s === "closed" && "bg-hairline text-muted",
      )}
    >
      <span className={cx("size-1.5 rounded-full", s === "open" ? "bg-good" : s === "upcoming" ? "bg-primary" : "bg-faint")} />
      {long || s !== "open" ? label : "Open now"}
    </span>
  );
}
