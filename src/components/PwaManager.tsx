"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, WifiOff, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp, useHydrated } from "@/lib/store";
import { Logo } from "./AppShell";
import { Button } from "./ui";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker and shows the "Add to Home Screen" card once the student
 * has had a first good session (set from the results screen). Also shows an offline pill.
 */
export function PwaManager() {
  const hydrated = useHydrated();
  const path = usePathname();
  const installPrompt = useApp((s) => s.installPrompt);
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => useApp.getState().setInstallPrompt("dismissed");
    const net = () => setOffline(!navigator.onLine);
    // iOS Safari has no install event; we show manual instructions instead.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone;
    queueMicrotask(() => {
      setIos(isIos);
      net();
    });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
    };
  }, []);

  const show = hydrated && installPrompt === "eligible" && (deferred || ios) && !path?.startsWith("/play");
  const dismiss = () => useApp.getState().setInstallPrompt("dismissed");

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <>
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[60] flex justify-center"
            role="status"
          >
            <span className="glass-strong flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold">
              <WifiOff size={15} className="text-warn" /> Offline — practice still works
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 px-3 sm:bottom-6"
            role="dialog"
            aria-label="Install Team Civilians"
          >
            <div className="glass-solid mx-auto flex max-w-md items-center gap-3 rounded-3xl p-3.5">
              <Logo size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold leading-tight">Install Team Civilians</p>
                <p className="text-sm leading-snug text-muted">
                  {ios ? (
                    <>
                      Tap <Share size={13} className="inline -translate-y-px" /> then “Add to Home Screen”.
                    </>
                  ) : (
                    "Works offline, one tap away."
                  )}
                </p>
              </div>
              {!ios && (
                <Button size="sm" onClick={install}>
                  <Download size={15} /> Install
                </Button>
              )}
              <button
                onClick={dismiss}
                aria-label="Not now"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-hairline"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
