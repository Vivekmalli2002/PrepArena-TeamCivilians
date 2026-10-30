"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, Clock, WifiOff } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Logo } from "./AppShell";
import { ExamPicker } from "./ExamPicker";
import { Button, Card } from "./ui";

export function Onboarding() {
  const [step, setStep] = useState<0 | 1>(0);
  const [examId, setExamId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const finish = () =>
    examId && useApp.getState().setProfile({ examId, name: name.trim().slice(0, 40), createdAt: Date.now() });

  return (
    <div className="mx-auto max-w-lg">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pt-4 text-center sm:pt-10"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
              className="mx-auto w-fit"
            >
              <Logo size={76} />
            </motion.div>
            <h1 className="mt-6 font-display text-[34px] font-extrabold leading-[1.08] sm:text-5xl">
              Practise like it&apos;s
              <br />
              <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                exam day.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-muted">
              APPSC-style CBT practice with real previous-year questions, clear explanations and coaching on what to
              study next.
            </p>
            <div className="mt-7 grid gap-2 text-left">
              {[
                { icon: Clock, t: "Real CBT console", d: "Palette, dual timers, mark for review, negative marking" },
                { icon: BarChart3, t: "Know your weak areas", d: "Topic mastery and a “practise this” for each gap" },
                { icon: WifiOff, t: "Works offline", d: "Install it — your progress stays on this device" },
              ].map(({ icon: Icon, t, d }) => (
                <Card key={t} className="flex items-center gap-3 p-3.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-muted">{d}</div>
                  </div>
                </Card>
              ))}
            </div>
            <Button size="lg" className="mt-7 w-full" onClick={() => setStep(1)}>
              Get started <ArrowRight size={18} />
            </Button>
            <p className="mt-3 text-xs text-faint">Free · no sign-up needed</p>
          </motion.div>
        ) : (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pt-2"
          >
            <p className="text-sm font-semibold text-primary">Step 2 of 2</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold">Which exam are you preparing for?</h1>
            <p className="mt-2 text-muted">We&apos;ll set the marking scheme and subjects to match. You can change it later.</p>
            <div className="mt-5">
              <ExamPicker value={examId} onChange={setExamId} />
            </div>
            <label className="mt-6 block">
              <span className="text-sm font-semibold">
                Your name <span className="font-normal text-muted">(optional)</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && finish()}
                maxLength={40}
                autoComplete="given-name"
                placeholder="e.g. Lakshmi"
                className="mt-2 h-12 w-full rounded-2xl border border-hairline bg-glass px-4 text-base outline-none transition focus:border-primary"
              />
              <span className="mt-1.5 block text-xs text-faint">Stays on this device only.</span>
            </label>
            <div className="mt-7 flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!examId} onClick={finish}>
                Start practising <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
