import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "25", minutes: 25 },
  { label: "45", minutes: 45 },
  { label: "60", minutes: 60 },
  { label: "90", minutes: 90 },
];

/* ─── Custom Timer Modal ─── */
function CustomModal({ onSet, onClose }) {
  const [hrs, setHrs] = useState(0);
  const [mins, setMins] = useState(30);
  const overlayRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const clampH = (v) => Math.max(0, Math.min(5, v));
  const clampM = (v) => Math.max(0, Math.min(59, v));
  const totalMins = hrs * 60 + mins;
  const canSet = totalMins > 0;

  return (
    <div className="cm-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="cm-panel">
        <div className="cm-eyebrow">Set duration</div>
        <div className="cm-pickers">
          <div className="cm-field">
            <button className="cm-arrow" onClick={() => setHrs((v) => clampH(v + 1))} tabIndex={-1}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <input className="cm-digit-input" type="number" min={0} max={5} value={hrs}
              onChange={(e) => setHrs(isNaN(parseInt(e.target.value, 10)) ? 0 : clampH(parseInt(e.target.value, 10)))} />
            <button className="cm-arrow" onClick={() => setHrs((v) => clampH(v - 1))} tabIndex={-1}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <span className="cm-unit">hr</span>
          </div>
          <div className="cm-colon">:</div>
          <div className="cm-field">
            <button className="cm-arrow" onClick={() => setMins((v) => v >= 59 ? 0 : v + 1)} tabIndex={-1}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <input className="cm-digit-input" type="number" min={0} max={59} value={String(mins).padStart(2, "0")}
              onChange={(e) => setMins(isNaN(parseInt(e.target.value, 10)) ? 0 : clampM(parseInt(e.target.value, 10)))} />
            <button className="cm-arrow" onClick={() => setMins((v) => v <= 0 ? 59 : v - 1)} tabIndex={-1}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <span className="cm-unit">min</span>
          </div>
        </div>
        <div className="cm-summary">
          {totalMins > 0
            ? hrs > 0 && mins > 0 ? `${hrs}h ${mins}m`
              : hrs > 0 ? `${hrs} hour${hrs > 1 ? "s" : ""}` : `${mins} minute${mins !== 1 ? "s" : ""}`
            : "Set a duration above"}
        </div>
        <div className="cm-actions">
          <button className="cm-cancel" onClick={onClose}>Cancel</button>
          <button className={`cm-confirm ${canSet ? "ready" : ""}`} onClick={() => canSet && onSet(totalMins)} disabled={!canSet}>
            Set timer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Goals Drawer ─── */
function GoalsDrawer({ onClose }) {
  const [goals, setGoals] = useState([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const addGoal = () => {
    const text = draft.trim();
    if (!text) return;
    setGoals((g) => [...g, { id: Date.now(), text, done: false }]);
    setDraft("");
    inputRef.current?.focus();
  };

  const toggle = (id) => setGoals((g) => g.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const remove = (id) => setGoals((g) => g.filter((x) => x.id !== id));

  const done = goals.filter((g) => g.done).length;
  const total = goals.length;

  return (
    <div className="gd-drawer">
      <div className="gd-header">
        <span className="gd-eyebrow">Goals</span>
        {total > 0 && (
          <span className="gd-count">{done}/{total}</span>
        )}
        <button className="gd-close" onClick={onClose} aria-label="Close goals">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="gd-list">
        {goals.length === 0 && (
          <div className="gd-empty">No goals yet</div>
        )}
        {goals.map((g) => (
          <div key={g.id} className={`gd-item ${g.done ? "done" : ""}`}>
            <button className="gd-check" onClick={() => toggle(g.id)} aria-label="Toggle">
              {g.done && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="gd-text">{g.text}</span>
            <button className="gd-remove" onClick={() => remove(g.id)} aria-label="Remove">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="gd-input-row">
        <input
          ref={inputRef}
          className="gd-input"
          placeholder="Add a goal…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          autoFocus
        />
        <button className="gd-add" onClick={addGoal} disabled={!draft.trim()}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function StudyFocus() {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const wakeLockRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { setWakeLockSupported("wakeLock" in navigator); }, []);

  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) { try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch (_) { } }
  };
  const releaseWakeLock = () => {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  };

  useEffect(() => {
    if (isRunning) {
      requestWakeLock();
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { clearInterval(intervalRef.current); setIsRunning(false); setIsDone(true); return 0; }
          return r - 1;
        });
      }, 1000);
    } else { releaseWakeLock(); clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const setPreset = (minutes) => {
    const secs = minutes * 60;
    setTotalSeconds(secs); setRemaining(secs); setIsRunning(false); setIsDone(false);
  };

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const progressPct = Math.round(progress * 100);
  const isCustom = !PRESETS.some((p) => p.minutes * 60 === totalSeconds);
  const statusLabel = isDone ? "COMPLETE" : isRunning ? "FOCUS" : remaining === totalSeconds ? "READY" : "PAUSED";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sf-root {
          min-height: 100vh; background: #080808;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; overflow: hidden; position: relative; padding: 2rem;
        }
        .sf-grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px;
        }
        .sf-wordmark { position: fixed; top: 1.5rem; left: 1.5rem; font-size: 10px; font-weight: 500; letter-spacing: 0.3em; color: #1e1c1a; text-transform: uppercase; z-index: 10; }
        .sf-wake-indicator { position: fixed; top: 1.5rem; right: 1.5rem; display: flex; align-items: center; gap: 7px; z-index: 10; }
        .sf-wake-dot { width: 5px; height: 5px; border-radius: 50%; background: #1e1c1a; transition: background 0.4s; }
        .sf-wake-dot.active { background: #c8533a; box-shadow: 0 0 0 3px rgba(200,83,58,0.15); }
        .sf-wake-label { font-size: 10px; letter-spacing: 0.2em; color: #2a2825; text-transform: uppercase; transition: color 0.4s; }
        .sf-wake-label.active { color: #3a3733; }

        .sf-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; }
        .sf-status { font-size: 11px; font-weight: 500; letter-spacing: 0.32em; color: #3a3733; margin-bottom: 2rem; transition: color 0.6s; text-transform: uppercase; }
        .sf-status.running { color: #c8533a; }
        .sf-status.done { color: #c8a03a; }
        .sf-status.paused { color: #4a5a6a; }
        .sf-timer {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
          font-size: clamp(88px, 20vw, 240px); line-height: 0.88; letter-spacing: -0.02em;
          color: #F0EDE6; user-select: none; transition: color 0.6s, opacity 0.4s; cursor: pointer;
        }
        .sf-timer.done { color: #c8a03a; }
        .sf-timer:hover { opacity: 0.85; }
        .sf-timer-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.92} }
        .sf-controls { display: flex; align-items: center; gap: 2rem; margin-top: 3rem; }
        .sf-btn-primary {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.28em; text-transform: uppercase; color: #080808;
          background: #F0EDE6; border: none; padding: 14px 40px; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .sf-btn-primary:hover { background: #fff; transform: translateY(-1px); }
        .sf-btn-primary:active { transform: translateY(0); }
        .sf-btn-primary:disabled { background: #2a2825; color: #4a4845; cursor: default; transform: none; }
        .sf-btn-ghost {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400;
          letter-spacing: 0.22em; text-transform: uppercase; color: #3a3733;
          background: transparent; border: none; cursor: pointer; padding: 8px 0; transition: color 0.2s;
        }
        .sf-btn-ghost:hover { color: #F0EDE6; }
        .sf-presets { display: flex; margin-top: 3.5rem; border: 0.5px solid #1e1c1a; }
        .sf-preset {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400;
          letter-spacing: 0.18em; color: #3a3733; background: transparent; border: none;
          border-right: 0.5px solid #1e1c1a; padding: 10px 22px; cursor: pointer; transition: all 0.2s;
        }
        .sf-preset:last-child { border-right: none; }
        .sf-preset:hover { color: #F0EDE6; background: #111010; }
        .sf-preset.active { color: #F0EDE6; background: #151413; }

        .sf-goals-toggle {
          position: fixed; bottom: 1.5rem; left: 1.5rem;
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #2a2825; background: transparent; border: none; cursor: pointer;
          padding: 4px 0; transition: color 0.2s; z-index: 20;
          display: flex; align-items: center; gap: 8px;
        }
        .sf-goals-toggle:hover { color: #F0EDE6; }
        .sf-goals-toggle.active { color: #3a3733; }

        .sf-progress-track { position: fixed; bottom: 0; left: 0; right: 0; height: 2px; background: #111010; z-index: 10; }
        .sf-progress-fill { height: 100%; background: #c8533a; transition: width 1s linear; }
        .sf-progress-fill.done { background: #c8a03a; }
        .sf-pct { position: fixed; bottom: 1.5rem; right: 1.5rem; font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.12em; color: #1e1c1a; z-index: 10; transition: color 0.4s; }
        .sf-pct.active { color: #2a2825; }

        /* Goals Drawer */
        .gd-drawer {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 50;
          width: 280px; background: #0a0908;
          border-left: 0.5px solid #1a1816;
          display: flex; flex-direction: column;
          animation: gd-slide-in 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes gd-slide-in { from{transform:translateX(100%)} to{transform:translateX(0)} }

        .gd-header {
          display: flex; align-items: center; gap: 0;
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 0.5px solid #1a1816;
          flex-shrink: 0;
        }
        .gd-eyebrow {
          font-size: 10px; font-weight: 500; letter-spacing: 0.32em;
          text-transform: uppercase; color: #3a3733; flex: 1;
        }
        .gd-count {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
          font-size: 13px; letter-spacing: 0.06em; color: #2a2825; margin-right: 1rem;
        }
        .gd-close {
          background: transparent; border: none; cursor: pointer;
          color: #2a2825; padding: 4px; transition: color 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .gd-close:hover { color: #F0EDE6; }

        .gd-list {
          flex: 1; overflow-y: auto; padding: 1rem 0;
        }
        .gd-list::-webkit-scrollbar { width: 2px; }
        .gd-list::-webkit-scrollbar-thumb { background: #1e1c1a; }

        .gd-empty {
          font-size: 11px; letter-spacing: 0.16em; color: #1e1c1a;
          text-transform: uppercase; text-align: center;
          padding: 2.5rem 1.5rem;
        }

        .gd-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 1.5rem;
          transition: background 0.15s;
          position: relative;
        }
        .gd-item:hover { background: #0e0d0c; }
        .gd-item:hover .gd-remove { opacity: 1; }

        .gd-check {
          width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;
          border: 0.5px solid #2a2825; background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, background 0.2s; color: #c8533a;
        }
        .gd-item.done .gd-check { border-color: #1e1c1a; background: #111010; color: #2a2825; }
        .gd-check:hover { border-color: #c8533a; }

        .gd-text {
          font-size: 13px; font-weight: 400; color: #8a8580; line-height: 1.4;
          flex: 1; word-break: break-word; transition: color 0.2s;
        }
        .gd-item:not(.done) .gd-text { color: #c0bdb6; }
        .gd-item.done .gd-text { text-decoration: line-through; color: #2a2825; }

        .gd-remove {
          background: transparent; border: none; cursor: pointer;
          color: #1e1c1a; opacity: 0; transition: color 0.15s, opacity 0.15s;
          padding: 2px; display: flex; align-items: center; flex-shrink: 0; margin-top: 3px;
        }
        .gd-remove:hover { color: #c8533a; }

        .gd-input-row {
          display: flex; align-items: center;
          border-top: 0.5px solid #1a1816; flex-shrink: 0;
        }
        .gd-input {
          flex: 1; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
          color: #c0bdb6; background: transparent; border: none; outline: none;
          padding: 1.1rem 1.5rem; letter-spacing: 0.04em;
        }
        .gd-input::placeholder { color: #1e1c1a; }
        .gd-add {
          background: transparent; border: none; border-left: 0.5px solid #1a1816;
          cursor: pointer; color: #2a2825; padding: 1.1rem 1.2rem;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s, background 0.15s;
        }
        .gd-add:not(:disabled):hover { color: #F0EDE6; background: #0e0d0c; }
        .gd-add:disabled { cursor: default; }

        /* Custom Modal */
        .cm-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(8,8,8,0.88);
          display: flex; align-items: center; justify-content: center; animation: cm-fade-in 0.18s ease;
        }
        @keyframes cm-fade-in { from{opacity:0} to{opacity:1} }
        .cm-panel {
          background: #0e0d0c; border: 0.5px solid #2a2825; padding: 3rem 3.5rem 2.5rem; min-width: 340px;
          animation: cm-slide-up 0.22s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; align-items: center;
        }
        @keyframes cm-slide-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .cm-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: #3a3733; margin-bottom: 2.5rem; }
        .cm-pickers { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; }
        .cm-field { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; position: relative; padding-bottom: 1.4rem; }
        .cm-arrow { background: transparent; border: none; cursor: pointer; color: #2a2825; padding: 6px 10px; transition: color 0.15s; display: flex; align-items: center; }
        .cm-arrow:hover { color: #F0EDE6; }
        .cm-digit-input {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 72px; line-height: 1;
          letter-spacing: -0.02em; color: #F0EDE6; background: transparent; border: none;
          border-bottom: 1px solid #2a2825; outline: none; text-align: center; width: 110px; padding: 0 0 6px;
          -moz-appearance: textfield; transition: border-color 0.2s;
        }
        .cm-digit-input::-webkit-inner-spin-button, .cm-digit-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .cm-digit-input:focus { border-bottom-color: #c8533a; }
        .cm-unit { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #2a2825; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); white-space: nowrap; }
        .cm-colon { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 72px; color: #1e1c1a; line-height: 1; padding-bottom: 18px; margin: 0 4px; }
        .cm-summary { font-size: 11px; letter-spacing: 0.18em; color: #3a3733; text-align: center; min-height: 1.4em; }
        .cm-actions { display: flex; gap: 1.5rem; margin-top: 2.25rem; align-items: center; }
        .cm-cancel { font-size: 10px; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; color: #3a3733; background: transparent; border: none; cursor: pointer; padding: 10px 0; transition: color 0.2s; }
        .cm-cancel:hover { color: #F0EDE6; }
        .cm-confirm { font-size: 10px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase; color: #3a3733; background: transparent; border: 0.5px solid #2a2825; padding: 12px 28px; cursor: pointer; transition: all 0.2s; }
        .cm-confirm.ready { color: #F0EDE6; border-color: #3a3733; }
        .cm-confirm.ready:hover { background: #F0EDE6; color: #080808; border-color: #F0EDE6; }
        .cm-confirm:disabled { cursor: default; }
      `}</style>

      <div className="sf-root">
        <div className="sf-grain" />
        <div className="sf-wordmark">Monk</div>
        <div className="sf-wake-indicator">
          <div className={`sf-wake-dot ${isRunning && wakeLockSupported ? "active" : ""}`} />
          <span className={`sf-wake-label ${isRunning && wakeLockSupported ? "active" : ""}`}>
            {wakeLockSupported ? "Screen awake" : "No wake lock"}
          </span>
        </div>

        <div className="sf-inner">
          <div className={`sf-status ${isRunning ? "running" : isDone ? "done" : remaining < totalSeconds ? "paused" : ""}`}>
            {statusLabel}
          </div>
          <div
            className={`sf-timer ${isDone ? "done" : ""} ${isRunning ? "sf-timer-pulse" : ""}`}
            onClick={() => { if (!isDone) setIsRunning((r) => !r); }}
          >
            {formatTime(remaining)}
          </div>
          <div className="sf-controls">
            <button className="sf-btn-primary" onClick={() => { if (!isDone) setIsRunning((r) => !r); }} disabled={isDone}>
              {isRunning ? "Pause" : "Start"}
            </button>
            <button className="sf-btn-ghost" onClick={() => { setIsRunning(false); setIsDone(false); setRemaining(totalSeconds); }}>
              Reset
            </button>
          </div>
          <div className="sf-presets">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                className={`sf-preset ${totalSeconds === p.minutes * 60 ? "active" : ""}`}
                onClick={() => setPreset(p.minutes)}
              >
                {p.label}
                <span style={{ opacity: 0.45, marginLeft: 3, fontSize: 10, letterSpacing: "0.1em" }}>min</span>
              </button>
            ))}
            <button
              className={`sf-preset ${isCustom ? "active" : ""}`}
              onClick={() => setShowCustom(true)}
            >
              {isCustom ? `${Math.floor(totalSeconds / 60)}\u202fmin` : "Custom"}
            </button>
          </div>
        </div>

        <button
          className={`sf-goals-toggle ${showGoals ? "active" : ""}`}
          onClick={() => setShowGoals((s) => !s)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="0.5" y="0.5" width="4" height="4" stroke="currentColor" strokeWidth="0.8" />
            <rect x="0.5" y="7.5" width="4" height="4" stroke="currentColor" strokeWidth="0.8" />
            <line x1="7" y1="2.5" x2="11.5" y2="2.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="7" y1="9.5" x2="11.5" y2="9.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
          Goals
        </button>

        <div className="sf-progress-track">
          <div className={`sf-progress-fill ${isDone ? "done" : ""}`} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={`sf-pct ${isRunning ? "active" : ""}`}>{progressPct}%</div>
      </div>

      {showGoals && <GoalsDrawer onClose={() => setShowGoals(false)} />}
      {showCustom && <CustomModal onSet={(m) => { setPreset(m); setShowCustom(false); }} onClose={() => setShowCustom(false)} />}
    </>
  );
}