"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({
  className,
  strong,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div className={cx(strong ? "glass-strong" : "glass", "rounded-3xl", className)} {...rest}>
      {children}
    </div>
  );
}

const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 select-none",
  size: { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[15px]", lg: "h-13 px-6 text-base" },
  variant: {
    primary: "bg-primary text-on-primary shadow-[0_8px_24px_-8px_var(--primary)] hover:brightness-110",
    soft: "bg-primary-soft text-primary hover:bg-primary/15",
    ghost: "text-fg hover:bg-hairline",
    outline: "border border-hairline bg-glass text-fg hover:bg-hairline",
    danger: "bg-bad text-white hover:brightness-110",
  },
};

type BtnProps = {
  variant?: keyof typeof btn.variant;
  size?: keyof typeof btn.size;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: BtnProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx(btn.base, btn.size[size], btn.variant[variant], className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
}: BtnProps & { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cx(btn.base, btn.size[size], btn.variant[variant], className)}>
      {children}
    </Link>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("flex gap-1 rounded-2xl bg-hairline p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative flex-1 whitespace-nowrap rounded-xl px-2 py-2 text-sm font-semibold transition-colors",
              on ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${label}`}
                className="glass-strong absolute inset-0 rounded-xl"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  on,
  children,
  onClick,
  className,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition",
        on ? "border-primary bg-primary text-on-primary" : "border-hairline bg-glass text-fg hover:border-primary/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            className={cx(
              "glass-strong relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px]",
              wide ? "sm:max-w-2xl" : "sm:max-w-md",
            )}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-m-1 grid size-9 place-items-center rounded-full text-muted hover:bg-hairline"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3">
      <h2 className="font-display text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

/** Staggered entrance for lists of cards. */
export const enter = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.045 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
  },
} as const;
