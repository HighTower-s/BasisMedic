"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";

const L1 = "Paste. Verify.";
const L2 = "Don't guess.";
const P =
  'Paste an error log. Get a verified category, T-codes, and step-by-step checks. Every citation is checked against real evidence, or you get an honest "nothing relevant" instead of a guess.';

const COVERAGE = [
  {
    n: "01",
    title: "Memory / Short Dump",
    rows: [
      { code: "TSV_TNEW_PAGE_ALLOC_FAILED", desc: "internal table can't extend" },
      { code: "SYSTEM_NO_ROLL", desc: "instance out of shared memory" },
    ],
  },
  {
    n: "02",
    title: "Timeout",
    rows: [{ text: "Dialog step exceeded max run time" }, { text: "Long-running work process timeout" }],
  },
  {
    n: "03",
    title: "Lock",
    rows: [{ text: "Lock table overflow" }, { text: "Stale/old lock entries blocking transactions" }],
  },
  {
    n: "04",
    title: "Authorization",
    rows: [{ text: "Missing authorization" }, { text: "User account locked" }],
  },
  {
    n: "05",
    title: "RFC",
    rows: [{ text: "RFC connection failed" }, { text: "tRFC queue stuck" }],
  },
  {
    n: "06",
    title: "Transport",
    rows: [{ text: "Transport RC8 error" }, { text: "Transport RC12 or stuck in queue" }],
  },
  {
    n: "07",
    title: "Update",
    rows: [{ text: "Update terminated" }, { text: "Update task deactivated" }],
  },
  {
    n: "08",
    title: "Background Jobs",
    rows: [{ text: "Job cancelled" }, { text: "Job stuck in Ready/Released status" }],
  },
];

const FLOAT_DOTS = [
  { left: "6%", top: 150, size: 14, red: true, dur: 5 },
  { left: "13%", top: 250, size: 10, red: false, dur: 6.5 },
  { left: "3%", top: 330, size: 12, red: true, dur: 7 },
  { right: "7%", top: 140, size: 12, red: false, dur: 6 },
  { right: "12%", top: 260, size: 14, red: true, dur: 5.5 },
  { right: "4%", top: 340, size: 9, red: true, dur: 7.5 },
];

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [n, setN] = useState(0);
  const [p, setP] = useState(0);
  const [step, setStep] = useState(0);
  const howRef = useRef<HTMLDivElement>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // read after mount (not lazy init) to avoid an SSR/client hydration mismatch
    const saved = localStorage.getItem("bm-theme") === "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  useEffect(() => {
    const H = L1.length + L2.length;
    const t0 = Date.now();
    const timer = setInterval(() => {
      const el = Date.now() - t0 - 500;
      const nextN = Math.max(0, Math.min(H, Math.floor(el / 75)));
      const nextP = Math.max(0, Math.min(P.length, Math.floor((el - H * 75 - 250) / 12)));
      setN(nextN);
      setP(nextP);
      if (nextP >= P.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = howRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !stepTimer.current) {
          setStep(1);
          stepTimer.current = setInterval(() => {
            setStep((s) => {
              const next = s + 1;
              if (next >= 3 && stepTimer.current) {
                clearInterval(stepTimer.current);
                stepTimer.current = null;
              }
              return next;
            });
          }, 1300);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, []);

  function toggleTheme() {
    setIsDark((d) => {
      const next = !d;
      localStorage.setItem("bm-theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  const H = L1.length + L2.length;
  const n1 = Math.min(n, L1.length);
  const n2 = Math.max(0, n - L1.length);
  const headlineDone = n >= H;
  const ctaVisible = p >= P.length;

  const stepState = (i: number) => ({
    visible: step >= i,
    red: step >= i,
    filled: step > i,
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--bm-bg)] text-[var(--bm-fg)]">
      {/* nav */}
      <div className="p-3">
        <nav className="flex items-center bg-[var(--bm-card)] rounded-2xl px-5 py-3 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <Link href="#" className="flex items-center gap-2.5 font-bold text-lg flex-1">
            <Logo />
            <span>BasisMedic</span>
          </Link>
          <div className="hidden sm:flex gap-2 text-sm font-medium">
            <a href="#how" className="px-3.5 py-2 rounded-[10px] transition-colors hover:bg-[rgba(127,127,127,.14)]">
              How it works
            </a>
            <a href="#errors" className="px-3.5 py-2 rounded-[10px] transition-colors hover:bg-[rgba(127,127,127,.14)]">
              Supported errors
            </a>
            <a href="#trust" className="px-3.5 py-2 rounded-[10px] transition-colors hover:bg-[rgba(127,127,127,.14)]">
              Why trust it
            </a>
          </div>
          <div className="flex-1 flex justify-end items-center gap-4 text-sm font-medium">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="border-none bg-transparent text-[var(--bm-fg)] text-base cursor-pointer w-9 h-9 rounded-full transition-all hover:bg-[rgba(127,127,127,.16)] hover:rotate-[20deg]"
            >
              {isDark ? "☀" : "☾"}
            </button>
            <Link
              href="/triage"
              className="bg-[#111114] text-white px-[18px] py-[11px] rounded-[10px] transition-all hover:bg-[#FF4E45] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(255,78,69,.6)]"
            >
              Try it
            </Link>
          </div>
        </nav>
      </div>

      {/* hero */}
      <section className="max-w-[1100px] mx-auto px-6 pt-[120px] text-center relative z-0">
        <div
          className="absolute -inset-x-[60px] -top-5 -bottom-10 -z-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(var(--bm-dot) 1.2px, transparent 1.3px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 60% 55% at 50% 38%, #000 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 38%, #000 20%, transparent 75%)",
          }}
        />
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {FLOAT_DOTS.map((d, i) => (
            <i
              key={i}
              className="absolute rounded-md"
              style={{
                left: d.left,
                right: d.right,
                top: d.top,
                width: d.size,
                height: d.size,
                background: d.red ? "#FF4E45" : "var(--bm-fg)",
                animation: `bmfloat ${d.dur}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <h1 className="font-[family-name:var(--font-doto)] font-extrabold text-5xl sm:text-[76px] leading-[1.15] tracking-[.02em] uppercase m-0">
          <span>{L1.slice(0, n1)}</span>
          <span
            className="inline-block w-[.2em] h-[.7em] ml-[.1em] align-[-.02em] bg-[#FF4E45]"
            style={{
              display: n < L1.length ? "inline-block" : "none",
              animation: headlineDone ? "bmblink 1s steps(1) infinite" : "none",
            }}
          />
          <br />
          <span>{L2.slice(0, n2)}</span>
          <span
            className="inline-block w-[.2em] h-[.7em] ml-[.1em] align-[-.02em] bg-[#FF4E45]"
            style={{
              display: n >= L1.length ? "inline-block" : "none",
              animation: headlineDone ? "bmblink 1s steps(1) infinite" : "none",
            }}
          />
        </h1>
        <p className="text-[17px] leading-[1.55] text-[var(--bm-mute)] max-w-[560px] mx-auto mt-9 mb-8 text-pretty">
          {P.slice(0, p)}
        </p>
        <div
          className="flex justify-center transition-all duration-700"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(18px)",
            pointerEvents: ctaVisible ? "auto" : "none",
          }}
        >
          <Link
            href="/triage"
            className="inline-flex items-center gap-3 bg-[#111114] text-white font-medium text-lg pl-2 pr-7 py-2 rounded-[18px] border-2 border-[#333] shadow-[0_12px_30px_-10px_rgba(255,78,69,.55)] transition-all hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_22px_44px_-12px_rgba(255,78,69,.8)] hover:border-[#FF4E45] active:translate-y-0 active:scale-[.98]"
          >
            <span className="w-12 h-12 rounded-xl bg-[#FF4E45] inline-flex items-center justify-center text-lg">
              &#8599;
            </span>
            Try BasisMedic
          </Link>
        </div>
      </section>

      {/* stat band */}
      <section className="max-w-[1176px] mx-auto mt-24 px-3">
        <div className="bg-[var(--bm-card)] rounded-[28px] grid grid-cols-1 sm:grid-cols-3">
          <div className="p-7 flex flex-col justify-between gap-14 min-h-[230px]">
            <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] tracking-[.04em]">
              EVALUATION-FIRST
            </div>
            <div>
              <div className="font-[family-name:var(--font-doto)] font-extrabold text-[54px] leading-none mb-2.5">
                bm25 &middot; dense &middot; hybrid
              </div>
              <div className="text-[15px] text-[var(--bm-mute)]">Benchmarked against named baselines</div>
            </div>
          </div>
          <div className="p-7 border-t sm:border-t-0 sm:border-l border-[var(--bm-line)] flex flex-col justify-between gap-14">
            <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] tracking-[.04em]">
              GROUNDED ANSWERS ONLY
            </div>
            <div>
              <div className="font-[family-name:var(--font-doto)] font-extrabold text-[54px] leading-none mb-2.5 text-[#FF4E45]">
                0 fabricated
              </div>
              <div className="text-[15px] text-[var(--bm-mute)]">Of shown citations verified by code</div>
            </div>
          </div>
          <div className="p-7 border-t sm:border-t-0 sm:border-l border-[var(--bm-line)] flex flex-col justify-between gap-5">
            <div className="text-[15px] leading-[1.7]">
              Never trusted from the model. T-codes and citations pass a code check against real runbook text
              before they appear.
            </div>
            <Link
              href="/triage"
              className="self-start inline-flex items-center gap-2 bg-[#FF4E45] text-white font-medium text-[15px] px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(255,78,69,.7)]"
            >
              Start
            </Link>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" ref={howRef} className="max-w-[1100px] mx-auto mt-[120px] px-6">
        <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] tracking-[.04em] mb-3">
          HOW IT WORKS
        </div>
        <h2 className="text-[44px] leading-[1.1] font-normal tracking-[-.02em] mb-14 max-w-[640px]">
          From raw log to a checked answer. <span className="text-[var(--bm-faint)]">Three steps.</span>
        </h2>

        {[
          {
            title: "Paste your error log",
            body: "Drop in a raw SAP error log, a short stack trace, or just describe what you're seeing — no need to know the T-code or category up front.",
            extra: (
              <div className="mt-5 bg-[var(--bm-bg)] rounded-2xl px-4 py-3.5 font-[family-name:var(--font-jetbrains-mono)] text-[12.5px] leading-[1.6] text-[var(--bm-mute)]">
                SYSTEM_NO_ROLL: TSV_TNEW_PAGE_ALLOC_FAILED
                <br />
                Program SAPLSMTR_NAVIGATION, work process 07
                <span
                  className="inline-block w-[7px] h-[14px] bg-[#FF4E45] ml-1 align-[-2px]"
                  style={{ animation: "bmblink 1s steps(1) infinite" }}
                />
              </div>
            ),
          },
          {
            title: "The agent searches your runbooks",
            body: "A bounded tool-calling loop searches the actual runbook corpus and looks up transaction codes — it never answers from memory. Every step it takes is traceable, not a black box.",
            extra: (
              <div className="mt-5 flex flex-col gap-2 font-[family-name:var(--font-jetbrains-mono)] text-[12.5px] leading-[1.5] text-[var(--bm-mute)]">
                <div className="flex gap-2.5 items-center">
                  <span className="border border-[var(--bm-line)] rounded-full px-3.5 py-1 font-medium text-[var(--bm-fg)]">
                    search_runbook
                  </span>
                  &rarr; 4 passages retrieved
                </div>
                <div className="flex gap-2.5 items-center">
                  <span className="border border-[var(--bm-line)] rounded-full px-3.5 py-1 font-medium text-[var(--bm-fg)]">
                    lookup_tcode
                  </span>
                  &rarr; ST22, SM04, ST02
                </div>
              </div>
            ),
          },
          {
            title: 'Get a verified result — or an honest "no match"',
            body: "Before anything reaches you, every citation is checked against the evidence actually retrieved, and every T-code is checked against the allow-list. You get a category, an ordered list of T-codes, step-by-step checks, and citations that resolve to real runbook text — or, if nothing matches, a plain \"nothing relevant\" instead of a confident guess.",
            extra: (
              <div className="mt-5 flex gap-2 flex-wrap items-center">
                <span className="bg-[#FF4E45] text-white rounded-full px-3.5 py-1 text-[13px] font-bold">
                  Memory &middot; urgent
                </span>
                <span className="border border-[var(--bm-line)] rounded-full px-3.5 py-1 font-[family-name:var(--font-jetbrains-mono)] text-xs font-medium">
                  &#10003; citations match retrieved text
                </span>
                <span className="border border-[var(--bm-line)] rounded-full px-3.5 py-1 font-[family-name:var(--font-jetbrains-mono)] text-xs font-medium">
                  &#10003; T-codes on allow-list
                </span>
                <span className="text-[var(--bm-faint)] text-[13px] mx-1.5">or</span>
                <span className="border border-[var(--bm-line)] rounded-full px-3.5 py-1 font-[family-name:var(--font-jetbrains-mono)] text-xs font-medium">
                  No relevant runbook found
                </span>
              </div>
            ),
          },
        ].map((s, i) => {
          const st = stepState(i + 1);
          return (
            <div
              key={i}
              className="grid grid-cols-[96px_minmax(0,1fr)] gap-6 transition-all duration-700"
              style={{
                opacity: st.visible ? 1 : 0,
                transform: st.visible ? "translateY(0)" : "translateY(32px)",
              }}
            >
              <div className="flex flex-col items-start gap-3">
                <div
                  className="font-[family-name:var(--font-doto)] font-extrabold text-[56px] leading-none transition-colors duration-500"
                  style={{ color: st.red ? "#FF4E45" : "var(--bm-faint)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                {i < 2 && (
                  <div className="flex-1 w-0.5 min-h-10 bg-[var(--bm-line)] rounded-sm ml-2 overflow-hidden">
                    <div
                      className="h-full bg-[#FF4E45] origin-top transition-transform duration-1000"
                      style={{ transform: `scaleY(${st.filled ? 1 : 0})` }}
                    />
                  </div>
                )}
              </div>
              <div
                className={`bg-[var(--bm-card)] rounded-3xl px-8 py-7 shadow-[0_1px_2px_rgba(0,0,0,.04)] ${
                  i < 2 ? "mb-6" : ""
                }`}
              >
                <h3 className="text-2xl font-medium mb-2.5 tracking-[-.01em]">{s.title}</h3>
                <p className="m-0 text-[var(--bm-mute)] leading-[1.6] max-w-[640px] text-pretty">{s.body}</p>
                {s.extra}
              </div>
            </div>
          );
        })}
      </section>

      {/* coverage */}
      <section id="errors" className="max-w-[1100px] mx-auto mt-[120px] px-6">
        <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] tracking-[.04em] mb-3">
          RUNBOOK COVERAGE
        </div>
        <h2 className="text-[44px] leading-[1.1] font-normal tracking-[-.02em] mb-4 max-w-[640px]">
          What BasisMedic can — and cannot — answer
        </h2>
        <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] text-[#FF4E45] mb-5">
          8 incident categories &middot; 16 runbooks &middot; each one verified against real evidence
        </div>
        <p className="mb-12 text-[var(--bm-mute)] leading-[1.6] max-w-[720px] text-pretty">
          The runbook corpus is hand-written, covering eight SAP Basis incident categories with two runbooks
          each. Every match tells you exactly which symptom it was written for, which transaction codes to
          open in order, and who to escalate to if the fix is outside a Basis admin&rsquo;s hands. Anything
          outside this list is correctly refused as out of scope — never guessed.
        </p>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
          {COVERAGE.map((c) => (
            <div
              key={c.n}
              className="relative bg-[var(--bm-card)] rounded-3xl px-7 pt-[26px] pb-3.5 min-w-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(17,17,20,.35)]"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <span className="font-[family-name:var(--font-doto)] font-extrabold text-[30px] leading-none text-[#FF4E45]">
                  {c.n}
                </span>
                <h3 className="text-xl font-medium m-0 tracking-[-.01em] break-words">{c.title}</h3>
              </div>
              <div className="border-t border-[var(--bm-line)]">
                {c.rows.map((row, i) => (
                  <div
                    key={i}
                    className={`py-3.5 min-w-0 ${i < c.rows.length - 1 ? "border-b border-[var(--bm-line)]" : ""}`}
                  >
                    {"code" in row ? (
                      <>
                        <div className="inline-block max-w-full font-[family-name:var(--font-jetbrains-mono)] font-medium text-[11.5px] bg-[var(--bm-bg)] rounded-lg px-2.5 py-1 mb-1.5 break-words">
                          {row.code}
                        </div>
                        <div className="text-sm leading-[1.45] text-[var(--bm-mute)] break-words">{row.desc}</div>
                      </>
                    ) : (
                      <div className="text-[14.5px] leading-[1.45] break-words">{row.text}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-[#111114] text-white rounded-3xl px-7 py-6 flex gap-4 items-center flex-wrap">
          <span className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-xs bg-[#FF4E45] rounded-full px-3 py-1.5">
            OUT OF SCOPE
          </span>
          <span className="leading-[1.5]">
            Not on this list? You&rsquo;ll get a plain &ldquo;nothing relevant found&rdquo; — not a confident
            wrong answer.
          </span>
        </div>
      </section>

      {/* why trust it */}
      <section id="trust" className="max-w-[1100px] mx-auto mt-[120px] px-6">
        <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-[13px] tracking-[.04em] mb-3">
          WHY TRUST IT
        </div>
        <h2 className="text-[44px] leading-[1.1] font-normal tracking-[-.02em] mb-5 max-w-[720px]">
          Why trust it
        </h2>
        <p className="mb-12 text-[var(--bm-mute)] leading-[1.6] max-w-[720px] text-[17px] text-pretty">
          A triage assistant that&rsquo;s confidently wrong is worse than one that says &ldquo;I don&rsquo;t
          know.&rdquo; Every number on this page is measured against named baselines, and every answer you see
          has already passed a code-level check — not just a model&rsquo;s word for it.
        </p>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          <div className="bg-[var(--bm-card)] rounded-3xl p-7 min-w-0 flex flex-col gap-7 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(17,17,20,.35)]">
            <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-xs tracking-[.05em]">
              EVALUATION-FIRST
            </div>
            <div className="h-14 flex gap-2 flex-wrap">
              {["bm25", "dense", "hybrid"].map((t, i) => (
                <span
                  key={t}
                  className="border border-[rgba(127,127,127,.35)] rounded-full px-3.5 py-1 font-[family-name:var(--font-jetbrains-mono)] text-xs font-medium"
                  style={{ animation: `bmpulse 4.5s ease-in-out ${i}s infinite` }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3.5 mt-auto">
              <div className="font-[family-name:var(--font-doto)] font-extrabold text-[30px] leading-[1.1] break-words">
                bm25 &middot; dense &middot; hybrid
              </div>
              <p className="m-0 text-[15px] leading-[1.6] text-[var(--bm-mute)] text-pretty">
                Retrieval isn&rsquo;t picked by vibes. Each strategy is benchmarked on a held-out test set
                against named baselines before it ships, and the same evaluation runs again for the full agent
                end-to-end.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bm-card)] rounded-3xl p-7 min-w-0 flex flex-col gap-7 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(17,17,20,.35)]">
            <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-xs tracking-[.05em]">
              GROUNDED ANSWERS ONLY
            </div>
            <div className="h-14 flex gap-1.5 items-start">
              {[0, 1, 2, 3, 4].map((i) => (
                <i
                  key={i}
                  className="w-[18px] h-[18px] rounded-[5px]"
                  style={
                    i === 2
                      ? { background: "#FF4E45", animation: "bmdrop 3.6s ease-in infinite" }
                      : { background: "var(--bm-fg)" }
                  }
                />
              ))}
            </div>
            <div className="flex flex-col gap-3.5 mt-auto">
              <div className="font-[family-name:var(--font-doto)] font-extrabold text-[40px] leading-[1.1] text-[#FF4E45] break-words">
                0 fabricated
              </div>
              <p className="m-0 text-[15px] leading-[1.6] text-[var(--bm-mute)] text-pretty">
                Every citation is checked against the evidence actually retrieved that request. One that
                doesn&rsquo;t match gets dropped before it ever reaches you — it never makes it into the
                answer.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bm-card)] rounded-3xl p-7 min-w-0 flex flex-col gap-7 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(17,17,20,.35)]">
            <div className="font-[family-name:var(--font-jetbrains-mono)] font-medium text-xs tracking-[.05em]">
              VERIFIED, NOT TRUSTED
            </div>
            <div className="h-14 relative">
              <div className="relative flex flex-col gap-2.5 pt-1">
                {[70, 45, 58].map((w, i) => (
                  <div key={i} className="flex gap-2.5 items-center">
                    <span className="w-3.5 h-3.5 rounded-[4px] bg-[#FF4E45] flex-none" />
                    <div className="h-2 rounded-sm bg-[var(--bm-line)]" style={{ width: `${w}%` }} />
                  </div>
                ))}
                <div
                  className="absolute -left-1.5 -right-1.5 h-0.5"
                  style={{
                    background: "linear-gradient(90deg, transparent, #FF4E45, transparent)",
                    animation: "bmscan 3s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3.5 mt-auto">
              <p className="m-0 text-[15px] leading-[1.6] text-[var(--bm-mute)] text-pretty">
                Never trusted from the model. T-codes and citations pass a code check against real runbook
                text before they appear. If nothing relevant is found, the system — not the model — forces an
                honest &ldquo;out of scope&rdquo; instead of a guess.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="max-w-[1100px] mx-auto mt-[120px] px-6 pt-8 pb-12 border-t border-[var(--bm-line)] flex flex-wrap gap-6 justify-between items-center text-sm">
        <Link href="#" className="flex items-center gap-2.5 font-bold text-base">
          <Logo />
          <span>BasisMedic</span>
        </Link>
        <div className="flex gap-7 font-medium">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <div className="basis-full text-center text-[13px] text-[var(--bm-mute)]">
          &copy; 2026 BasisMedic. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
