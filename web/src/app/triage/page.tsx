"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { CATEGORY_LABEL, TriageApiError, TriageResult, runTriage } from "@/lib/triage";

const PLACEHOLDER = "Paste an error log or describe the incident...";
const HEADLINE = "What's broken?";
const HISTORY_KEY = "bm-history";
const THEME_KEY = "bm-theme";
const MAX_HISTORY = 20;

const CHIPS = [
  { label: "TSV dump full", log: "SYSTEM_NO_ROLL: TSV_TNEW_PAGE_ALLOC_FAILED" },
  { label: "HANA disk full", log: "HANA disk full on log volume, DB not accepting writes" },
  { label: "Background job stuck", log: "Background job stuck in Active state in SM37" },
];

type Message =
  | { role: "user"; text: string }
  | { role: "result"; data: TriageResult }
  | { role: "refuse"; data: TriageResult }
  | { role: "error"; detail: string };

interface HistoryEntry {
  id: string;
  label: string;
  log: string;
  message: Message;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    /* storage unavailable — history just won't persist */
  }
}

export default function TriagePage() {
  const [isDark, setIsDark] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [trace, setTrace] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hn, setHn] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // read after mount (not lazy init) to avoid an SSR/client hydration mismatch
    const saved = localStorage.getItem(THEME_KEY) === "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(saved);
    document.documentElement.classList.toggle("dark", saved);
    // the sidebar is a fixed 260px, not an overlay — on narrow screens it leaves
    // ~0px for the composer, so start collapsed there
    if (window.innerWidth < 640) setSideOpen(false);
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;
    const t0 = Date.now();
    const timer = setInterval(() => {
      const el = Date.now() - t0 - 300;
      const next = Math.max(0, Math.min(HEADLINE.length, Math.floor(el / 70)));
      setHn(next);
      if (next >= HEADLINE.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [messages.length]);

  function toggleTheme() {
    setIsDark((d) => {
      const next = !d;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  function resetChat() {
    setMessages([]);
    setText("");
  }

  function loadEntry(entry: HistoryEntry) {
    setMessages([{ role: "user", text: entry.log }, entry.message]);
    setText("");
  }

  async function send(logOverride?: string) {
    const log = (logOverride ?? text).trim();
    if (!log || loading) return;
    setText("");
    setMessages((m) => [...m, { role: "user", text: log }]);
    setLoading(true);
    try {
      const data = await runTriage(log);
      const msg: Message = data.category === "out_of_scope" ? { role: "refuse", data } : { role: "result", data };
      setMessages((m) => [...m, msg]);
      const entry: HistoryEntry = { id: `${Date.now()}`, label: log.slice(0, 40), log, message: msg };
      setHistory((h) => {
        const next = [entry, ...h].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    } catch (err) {
      const detail = err instanceof TriageApiError ? err.message : "Could not reach the triage service.";
      setMessages((m) => [...m, { role: "error", detail }]);
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="h-screen flex bg-[var(--bm-bg)] text-[var(--bm-fg)] overflow-hidden">
      {/* sidebar */}
      <aside
        className="flex-none min-w-0 overflow-hidden bg-[var(--bm-soft,var(--bm-card))] transition-[width] duration-200"
        style={{ width: sideOpen ? 260 : 0 }}
      >
        <div className="w-[260px] h-full p-5 px-4 flex flex-col gap-1.5">
          <button
            onClick={resetChat}
            className="bg-[var(--bm-card)] border border-[var(--bm-line)] rounded-full px-4 py-2.5 font-[family-name:var(--font-doto)] font-extrabold text-base tracking-[.04em] uppercase cursor-pointer text-left mb-3.5 flex gap-2 items-center"
          >
            <span className="text-[#FF4E45]">+</span>New triage
          </button>
          <div className="text-xs font-bold opacity-50 px-2 tracking-[.04em] uppercase">Sessions</div>
          {history.length === 0 ? (
            <div className="px-2.5 py-2 text-sm opacity-40">No sessions yet</div>
          ) : (
            history.map((h) => (
              <button
                key={h.id}
                onClick={() => loadEntry(h)}
                className="px-2.5 py-2 rounded-[10px] text-sm font-medium opacity-80 whitespace-nowrap overflow-hidden text-ellipsis text-left hover:bg-[rgba(127,127,150,.15)]"
              >
                {h.label}
              </button>
            ))
          )}
          <label className="mt-auto flex items-center gap-2.5 text-sm font-medium p-2 cursor-pointer">
            <input
              type="checkbox"
              checked={trace}
              onChange={(e) => setTrace(e.target.checked)}
              className="accent-[#FF4E45] w-4 h-4"
            />
            Show trace
          </label>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center gap-3 px-5 py-3.5">
          <button
            onClick={() => setSideOpen((s) => !s)}
            aria-label="Sidebar"
            className="w-[38px] h-[38px] rounded-full border-none bg-transparent text-[var(--bm-fg)] text-lg cursor-pointer hover:bg-[rgba(127,127,150,.15)]"
          >
            &#9776;
          </button>
          <Link href="/" className="flex items-center gap-2.5 font-bold text-[17px]">
            <Logo />
            <span>BasisMedic</span>
          </Link>
          <span className="text-xs font-bold border border-[var(--bm-line)] rounded-full px-3 py-1.5 opacity-80 whitespace-nowrap flex-none">
            Gemma 4 (E4B-it)
          </span>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="ml-auto w-[38px] h-[38px] rounded-full border border-[var(--bm-line)] bg-transparent text-[var(--bm-fg)] text-base cursor-pointer"
          >
            {isDark ? "☀" : "☾"}
          </button>
        </header>

        <div className={`flex-1 overflow-auto relative flex flex-col items-center ${empty ? "justify-center" : "justify-start"}`}>
          {empty && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(var(--bm-line) 1.2px, transparent 1.3px)",
                  backgroundSize: "22px 22px",
                  maskImage: "radial-gradient(ellipse 55% 50% at 50% 42%, #000 15%, transparent 72%)",
                  WebkitMaskImage: "radial-gradient(ellipse 55% 50% at 50% 42%, #000 15%, transparent 72%)",
                }}
              />
              <span className="grid grid-cols-3 grid-rows-3 gap-[3px] mb-12 relative">
                {["fg", "red", "", "red", "red", "red", "fg", "red", ""].map((c, i) => (
                  <i
                    key={i}
                    className="w-[10px] h-[10px] rounded-[3px]"
                    style={{
                      background: c === "red" ? "#FF4E45" : c === "fg" ? "var(--bm-fg)" : "transparent",
                      animation: `bmpop .45s cubic-bezier(.3,1.5,.5,1) ${0.3 + i * 0.16}s both`,
                    }}
                  />
                ))}
              </span>
              <h1 className="font-[family-name:var(--font-doto)] font-extrabold text-[52px] leading-none tracking-[.02em] mb-7 text-center uppercase">
                {HEADLINE.slice(0, hn)}
              </h1>
            </>
          )}

          {!empty && (
            <div className="w-full max-w-[760px] px-6 py-4 flex flex-col gap-5">
              {messages.map((m, i) => (
                <MessageView key={i} message={m} trace={trace} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm opacity-60">
                  <span
                    className="w-2 h-2 rounded-full bg-[#FF4E45]"
                    style={{ animation: "bmdrop 1.2s ease-in-out infinite" }}
                  />
                  Searching runbooks and verifying…
                </div>
              )}
            </div>
          )}
        </div>

        {/* composer */}
        <div
          className="relative z-10 px-6 pb-6 flex flex-col items-center gap-3.5"
          style={empty ? { marginTop: "-12vh" } : undefined}
        >
          <div
            className="w-full max-w-[760px] bg-[var(--bm-card)] border-[1.5px] border-[var(--bm-line)] rounded-[28px] pl-[22px] pr-4 pt-4 pb-3 shadow-[0_8px_30px_-14px_rgba(20,20,43,.2)] flex gap-3 items-end focus-within:border-[#FF4E45] focus-within:shadow-[0_0_0_4px_rgba(255,78,69,.18)]"
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={empty ? 4 : 2}
              placeholder={PLACEHOLDER}
              maxLength={4000}
              className="flex-1 border-none outline-none resize-none bg-transparent text-[var(--bm-fg)] font-mono text-[15px] leading-[1.5] py-1.5"
            />
            <button
              onClick={() => send()}
              disabled={loading || !text.trim()}
              aria-label="Send"
              className="w-[42px] h-[42px] rounded-full border-none bg-[#FF4E45] text-white text-lg font-bold cursor-pointer flex-none disabled:opacity-40"
            >
              &#8593;
            </button>
          </div>
          {empty && (
            <div className="flex gap-2.5 flex-wrap justify-center">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => send(c.log)}
                  className="border border-[var(--bm-line)] rounded-full px-3.5 py-1.5 text-sm font-medium hover:bg-[rgba(127,127,150,.12)]"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MessageView({ message, trace }: { message: Message; trace: boolean }) {
  if (message.role === "user") {
    return (
      <div
        className="max-w-[78%] bg-[var(--bm-soft,var(--bm-card))] rounded-[20px] px-[18px] py-3.5 font-mono text-[13px] leading-[1.55] whitespace-pre-wrap break-words"
      >
        {message.text}
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="bg-[var(--bm-card)] border border-[#FF4E45] rounded-3xl px-6 py-5 flex flex-col gap-2">
        <span className="self-start border border-[#FF4E45] text-[#FF4E45] text-sm font-bold px-3.5 py-1.5 rounded-full">
          Request failed
        </span>
        <div className="text-[15px] opacity-80">{message.detail}</div>
      </div>
    );
  }

  if (message.role === "refuse") {
    return (
      <div className="bg-[var(--bm-card)] border border-[var(--bm-line)] rounded-3xl px-6 py-6 flex flex-col gap-2.5">
        <span className="self-start border border-[var(--bm-line)] text-sm font-bold px-3.5 py-1.5 rounded-full">
          Out of scope
        </span>
        <b className="text-xl tracking-[-.01em]">No relevant runbook found</b>
        <div className="opacity-70 leading-[1.55] text-[15px]">{message.data.summary}</div>
        {trace && (
          <div className="text-xs opacity-50 mt-1">
            Tool trace isn&rsquo;t exposed by the web API yet — use <code>--show-trace</code> on the CLI.
          </div>
        )}
      </div>
    );
  }

  const r = message.data;
  return (
    <div className="ml-auto w-full bg-[var(--bm-card)] border border-[var(--bm-line)] rounded-3xl p-6 shadow-[0_12px_40px_-16px_rgba(20,20,43,.22)] flex flex-col gap-5">
      <div className="flex gap-2.5 items-center flex-wrap">
        <span className="bg-[#FF4E45] text-white text-sm font-bold px-3.5 py-1.5 rounded-full">
          {CATEGORY_LABEL[r.category]}
        </span>
        <span className="text-sm font-medium opacity-60">
          confidence: {r.confidence} &middot; &#10003; T-codes and citations verified
        </span>
      </div>

      <div>
        <div className="text-xs font-bold opacity-50 tracking-[.04em] uppercase mb-2.5">Open in order</div>
        <div className="flex flex-col gap-2">
          {r.tcodes.map((code, i) => (
            <div key={code + i} className="flex gap-3.5 items-baseline text-[15px]">
              <span className="w-5 opacity-45 font-bold">{i + 1}</span>
              <b className="w-[60px] font-mono">{code}</b>
            </div>
          ))}
        </div>
        {r.unverified_tcodes.length > 0 && (
          <div className="mt-2.5 text-xs text-[#FF4E45]">
            Not on the allow-list (flagged, not shown as verified): {r.unverified_tcodes.join(", ")}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-bold opacity-50 tracking-[.04em] uppercase mb-2.5">Checks</div>
        <div className="flex flex-col gap-2">
          {r.steps.map((s, i) => (
            <label key={i} className="flex gap-3 text-[15px] leading-[1.45] cursor-pointer">
              <input type="checkbox" className="accent-[#FF4E45] w-[17px] h-[17px] mt-0.5 flex-none" />
              <span>
                {s.tcode && <b className="font-mono mr-1.5">{s.tcode}:</b>}
                {s.action}
              </span>
            </label>
          ))}
        </div>
      </div>

      {r.escalate_to && (
        <div className="text-sm opacity-70">
          Escalate to: <b className="opacity-100">{r.escalate_to}</b>
        </div>
      )}

      {r.sources.length > 0 && (
        <div>
          <div className="text-xs font-bold opacity-50 tracking-[.04em] uppercase mb-2.5">Sources</div>
          <div className="flex gap-2 flex-wrap">
            {r.sources.map((src) => (
              <span
                key={src}
                className="border border-[var(--bm-line)] rounded-full px-3.5 py-1.5 font-mono text-xs"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {trace && (
        <div className="text-xs opacity-50">
          Tool trace isn&rsquo;t exposed by the web API yet — use <code>--show-trace</code> on the CLI.
        </div>
      )}
    </div>
  );
}
