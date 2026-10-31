"use client";

import { motion } from "framer-motion";
import { BookOpen, ChartNoAxesColumn, House, Landmark, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp, useHydrated } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/tests", label: "Tests", icon: LayoutGrid },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/exams", label: "Exams", icon: Landmark },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const hydrated = useHydrated();
  const onboarded = useApp((s) => !!s.profile);
  const showNav = hydrated && onboarded;
  // The CBT player is full-screen, like the real exam console.
  if (path.startsWith("/play")) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
      <header className="sticky top-0 z-30 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="glass flex h-14 items-center gap-2 rounded-2xl pl-3 pr-1.5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Team Civilians home">
            <Logo />
            <span className="font-display text-[17px] font-extrabold tracking-tight">Team Civilians</span>
          </Link>
          <nav className={cx("ml-6 hidden gap-1", showNav && "sm:flex")} aria-label="Main">
            {NAV.map((n) => {
              const on = isActive(path, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    on ? "text-primary" : "text-muted hover:text-fg",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-top"
                      className="absolute inset-0 rounded-xl bg-primary-soft"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-12">{children}</main>

      <nav
        aria-label="Main"
        className={cx(
          "fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:hidden",
          !showNav && "hidden",
        )}
      >
        <div className="glass-strong mx-auto grid h-16 max-w-md grid-cols-5 rounded-[22px] px-1">
          {NAV.map((n) => {
            const on = isActive(path, n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  on ? "text-primary" : "text-muted",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-bottom"
                    className="absolute inset-x-2 inset-y-1.5 rounded-2xl bg-primary-soft"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={21} strokeWidth={on ? 2.4 : 2} className="relative" />
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/icon.svg" width={size} height={size} alt="" className="rounded-[9px]" />
  );
}
