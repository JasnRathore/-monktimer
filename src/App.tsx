import { useState, useEffect, useRef } from "react";
import { Gear, X, Circle, CheckCircle, CaretUp, CaretDown, Plus } from "@phosphor-icons/react";

const PRESETS = [
  { label: "25", minutes: 25 },
  { label: "60", minutes: 60 },
];

type CustomModalProps = { onSet: (minutes: number) => void; onClose: () => void };
type Goal = { id: number; text: string; done: boolean };
type Settings = { soundAlert: string; autoReset: boolean; showStatus: boolean; theme: string };
type SettingsDrawerProps = { settings: Settings; onChange: (s: Settings) => void; onClose: () => void; onPreviewSound: (s: string) => void };

/* ─── Custom Timer Modal ─── */
function CustomModal({ onSet, onClose }: CustomModalProps) {
  const [hrs, setHrs] = useState(0);
  const [mins, setMins] = useState(30);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  const clampH = (v: number) => Math.max(0, Math.min(5, v));
  const clampM = (v: number) => Math.max(0, Math.min(59, v));
  const totalMins = hrs * 60 + mins;
  const canSet = totalMins > 0;
  return (
    <div className="cm-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="cm-panel">
        <div className="cm-pickers">
          <div className="cm-field">
            <button className="cm-arrow" onClick={() => setHrs((v) => clampH(v + 1))} tabIndex={-1}><CaretUp weight="bold" size={16} /></button>
            <input className="cm-digit-input" type="number" min={0} max={5} value={hrs} onChange={(e) => setHrs(isNaN(parseInt(e.target.value, 10)) ? 0 : clampH(parseInt(e.target.value, 10)))} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
            <button className="cm-arrow" onClick={() => setHrs((v) => clampH(v - 1))} tabIndex={-1}><CaretDown weight="bold" size={16} /></button>
            <span className="cm-unit">hr</span>
          </div>
          <div className="cm-colon">:</div>
          <div className="cm-field">
            <button className="cm-arrow" onClick={() => setMins((v) => v >= 59 ? 0 : v + 1)} tabIndex={-1}><CaretUp weight="bold" size={16} /></button>
            <input className="cm-digit-input" type="number" min={0} max={59} value={String(mins).padStart(2, "0")} onChange={(e) => setMins(isNaN(parseInt(e.target.value, 10)) ? 0 : clampM(parseInt(e.target.value, 10)))} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
            <button className="cm-arrow" onClick={() => setMins((v) => v <= 0 ? 59 : v - 1)} tabIndex={-1}><CaretDown weight="bold" size={16} /></button>
            <span className="cm-unit">min</span>
          </div>
        </div>
        <div className="cm-actions">
          <button className="cm-confirm" onClick={() => canSet && onSet(totalMins)} disabled={!canSet}>Set timer</button>
          <button className="cm-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings Modal ─── */
function SettingsDrawer({ settings, onChange, onClose, onPreviewSound }: SettingsDrawerProps) {
  const setVal = (key: keyof Settings, val: any) => onChange({ ...settings, [key]: val });
  const overlayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  
  const THEMES = ["monk", "nord", "matcha", "midnight"];
  const SOUNDS = ["None", "Chime", "Digital", "Singing Bowl"];
  
  const options = [
    { key: "theme" as const, title: "Theme", desc: "Color palette", labels: THEMES, values: THEMES },
    { key: "soundAlert" as const, title: "Alarm sound", desc: "Played when session ends", labels: SOUNDS, values: SOUNDS },
    { key: "autoReset" as const, title: "Auto-reset", desc: "Reset timer after completion", labels: ["off", "on"], values: [false, true] },
    { key: "showStatus" as const, title: "Show status", desc: "Display FOCUS / PAUSED label", labels: ["hidden", "visible"], values: [false, true] },
  ];

  return (
    <div className="sd-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="sd-panel">
        <div className="sd-header">
          <span className="sd-eyebrow">Settings</span>
          <button className="sd-close" onClick={onClose}>
            <X weight="bold" size={16} />
          </button>
        </div>
        <div className="sd-list">
          {options.map(({ key, title, desc, labels, values }) => (
            <div key={key} className="sd-item">
              <div className="sd-info">
                <div className="sd-title">{title}</div>
                <div className="sd-desc">{desc}</div>
              </div>
              <div className="sd-options">
                {values.map((val, i) => (
                  <button 
                    key={String(val)} 
                    className={`sd-opt ${settings[key] === val ? "active" : ""}`} 
                    onClick={() => {
                      setVal(key, val);
                      if (key === "soundAlert" && typeof val === "string" && val !== "None") onPreviewSound(val);
                    }}>
                    {labels[i]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
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
  const [showSettings, setShowSettings] = useState(false);
  const [draftGoal, setDraftGoal] = useState("");
  
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("monktimer_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.soundAlert === 'boolean') parsed.soundAlert = parsed.soundAlert ? 'Chime' : 'None';
        return { soundAlert: 'Chime', autoReset: false, showStatus: true, theme: 'monk', ...parsed };
      }
    } catch { /* ignore */ }
    return { soundAlert: 'Chime', autoReset: false, showStatus: true, theme: 'monk' };
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem("monktimer_goals");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("monktimer_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("monktimer_goals", JSON.stringify(goals));
  }, [goals]);

  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const playSound = (type: string) => {
    if (type === "None") return;
    try {
      const ctx = new AudioContext();
      if (type === "Chime") {
        const frequencies = [523.25, 659.25, 783.99];
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = "sine"; osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.22;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.55, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
          osc.start(t); osc.stop(t + 1.0);
        });
      } else if (type === "Digital") {
        [0, 0.18].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = "square"; osc.frequency.value = 1800;
          const t = ctx.currentTime + offset;
          gain.gain.setValueAtTime(0, t);
          gain.gain.setValueAtTime(0.18, t + 0.01);
          gain.gain.setValueAtTime(0, t + 0.12);
          osc.start(t); osc.stop(t + 0.12);
        });
      } else if (type === "Singing Bowl") {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = 349.23;
        osc2.type = "sine"; osc2.frequency.value = 352.00;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.7, t + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        osc.start(t); osc.stop(t + 5.0);
        osc2.start(t); osc2.stop(t + 5.0);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isRunning) {
      if (sessionStartRef.current === null) sessionStartRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setRemaining((r) => {
          if (r <= 1) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsDone(true);
            sessionStartRef.current = null;
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current !== null) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // Fire sound and auto-reset when done
  useEffect(() => {
    if (isDone) {
      if (settings.soundAlert !== "None") playSound(settings.soundAlert);
      if (settings.autoReset) {
        const t = setTimeout(() => doReset(), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [isDone]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const setPreset = (minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(secs); setRemaining(secs); setIsRunning(false); setIsDone(false);
    elapsedRef.current = 0; sessionStartRef.current = null;
  };

  const handleStartPause = () => { if (!isDone) setIsRunning((r) => !r); };

  const doReset = () => {
    setIsRunning(false); setIsDone(false); setRemaining(totalSeconds);
    elapsedRef.current = 0; sessionStartRef.current = null;
  };

  const openSettings = () => { setShowSettings((s) => !s); };

  const addGoal = () => {
    const text = draftGoal.trim();
    if (!text) return;
    setGoals((g) => [...g, { id: Date.now(), text, done: false }]);
    setDraftGoal("");
  };
  const toggleGoal = (id: number) => setGoals((g) => g.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const removeGoal = (id: number) => setGoals((g) => g.filter((x) => x.id !== id));

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const progressPct = Math.round(progress * 100);
  const isCustom = !PRESETS.some((p) => p.minutes * 60 === totalSeconds);
  const statusLabel = isDone ? "COMPLETE" : isRunning ? "FOCUS" : remaining === totalSeconds ? "READY" : "PAUSED";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overscroll-behavior-y: none; overscroll-behavior-x: none; }

        :root, [data-theme="monk"] {
          --bg-main: #080808; --bg-panel: #0e0d0c; --bg-overlay: rgba(6,6,6,0.55);
          --bg-hover: #161412; --bg-active: #1e1b18;
          --border: #1a1816; --border-bright: #2a2825; --border-light: #2e2b28;
          --text-main: #F0EDE6; --text-sec: #c0bdb6; --text-dim: #6a6560; --text-dark: #3a3733; --text-xdark: #1e1c1a;
          --accent: #c8533a; --accent-glow: rgba(200,83,58,0.25); --done: #c8a03a;
        }
        [data-theme="nord"] {
          --bg-main: #2E3440; --bg-panel: #3B4252; --bg-overlay: rgba(36,42,52,0.55);
          --bg-hover: #434C5E; --bg-active: #4C566A;
          --border: #3B4252; --border-bright: #434C5E; --border-light: #4C566A;
          --text-main: #ECEFF4; --text-sec: #E5E9F0; --text-dim: #8FBCBB; --text-dark: #D8DEE9; --text-xdark: #4C566A;
          --accent: #88C0D0; --accent-glow: rgba(136,192,208,0.25); --done: #EBCB8B;
        }
        [data-theme="matcha"] {
          --bg-main: #F4F1EA; --bg-panel: #EBE6D9; --bg-overlay: rgba(230,226,215,0.55);
          --bg-hover: #E2DCC8; --bg-active: #D9D2B7;
          --border: #E2DCC8; --border-bright: #D9D2B7; --border-light: #CFC6A6;
          --text-main: #2C352E; --text-sec: #3D4A40; --text-dim: #5A6D5E; --text-dark: #8B9E8F; --text-xdark: #CFC6A6;
          --accent: #657D66; --accent-glow: rgba(101,125,102,0.25); --done: #D98359;
        }
        [data-theme="midnight"] {
          --bg-main: #000000; --bg-panel: #0A0A0A; --bg-overlay: rgba(0,0,0,0.55);
          --bg-hover: #141414; --bg-active: #1F1F1F;
          --border: #141414; --border-bright: #292929; --border-light: #3D3D3D;
          --text-main: #FFFFFF; --text-sec: #E0E0E0; --text-dim: #8F8F8F; --text-dark: #525252; --text-xdark: #292929;
          --accent: #E2E2E2; --accent-glow: rgba(226,226,226,0.25); --done: #FFFFFF;
        }

        .sf-root { min-height: 100vh; background: var(--bg-main); display: flex; flex-direction: column; align-items: stretch; font-family: 'DM Sans', sans-serif; overflow: hidden; position: relative; color: var(--text-main); }
        .sf-grain { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-repeat: repeat; background-size: 180px; }

        /* ── Top bar ── */
        .sf-topbar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; justify-content: flex-end; gap: 2px; padding: 1.25rem 1.5rem; }
        .sf-topbar-btn { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.24em; text-transform: uppercase; color: var(--text-sec); background: transparent; border: none; cursor: pointer; padding: 7px 14px; transition: color 0.2s, background 0.2s; display: flex; align-items: center; gap: 8px; }
        .sf-topbar-btn:hover { color: var(--text-main); }
        .sf-topbar-btn.active { color: var(--accent); }
        .sf-topbar-divider { width: 0.5px; height: 16px; background: var(--border); margin: 0 2px; }

        /* ── Main content ── */
        .sf-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; }
        .sf-inner { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; position: relative; }

        .sf-status { font-size: 11px; font-weight: 500; letter-spacing: 0.32em; color: var(--text-dark); margin-bottom: 2rem; transition: color 0.6s; text-transform: uppercase; }
        .sf-status.running { color: var(--accent); }
        .sf-status.done { color: var(--done); }
        .sf-status.paused { color: var(--text-dim); }
        .sf-status.hidden { display: none; }

        .sf-timer { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: clamp(88px, 20vw, 240px); line-height: 0.88; letter-spacing: -0.02em; color: var(--text-main); user-select: none; transition: color 0.6s; }
        .sf-timer.done { color: var(--done); }
        .sf-timer-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.92} }

        .sf-controls { display: flex; align-items: center; gap: 2rem; margin-top: 3rem; }

        .sf-btn-primary { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; color: var(--bg-main); background: var(--text-main); border: none; padding: 18px 56px; cursor: pointer; transition: background 0.2s, transform 0.15s; display: inline-flex; align-items: center; gap: 10px; }
        .sf-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .sf-btn-primary:active { transform: translateY(0); }
        .sf-btn-primary:disabled { background: var(--border-bright); color: var(--text-dark); cursor: default; transform: none; }

        .sf-btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); background: transparent; border: none; cursor: pointer; padding: 8px 0; transition: color 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .sf-btn-ghost:hover { color: var(--text-main); }

        .sf-presets { display: flex; margin-top: 3.5rem; border: 0.5px solid var(--border-light); }
        .sf-preset { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.18em; color: var(--text-dim); background: transparent; border: none; border-right: 0.5px solid var(--border-light); padding: 10px 22px; cursor: pointer; transition: all 0.2s; }
        .sf-preset:last-child { border-right: none; }
        .sf-preset:hover:not(:disabled) { color: var(--text-main); background: var(--bg-hover); }
        .sf-preset.active { color: var(--text-main); background: var(--bg-active); }

        /* ── Inline Goals ── */
        .sf-goals-section { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: stretch; gap: 0.4rem; margin-top: 1.5rem; width: 100%; max-width: 440px; animation: dc-fade 1s ease 0.2s both; }
        .sf-goal-item { display: flex; align-items: center; gap: 14px; width: 100%; position: relative; padding: 2px 0; transition: opacity 0.2s; }
        .sf-goal-item.done { opacity: 0.4; text-decoration: line-through; }
        .sf-goal-check { background: transparent; border: none; cursor: pointer; color: var(--text-dim); display: flex; align-items: center; padding: 2px; transition: color 0.2s; }
        .sf-goal-check:hover { color: var(--text-main); }
        .sf-goal-text { font-size: 16px; font-weight: 400; color: var(--text-sec); flex: 1; text-align: left; line-height: 1.5; transition: color 0.2s; }
        .sf-goal-remove { background: transparent; border: none; cursor: pointer; color: var(--text-dark); padding: 2px; display: flex; align-items: center; transition: color 0.2s; }
        .sf-goal-remove:hover { color: var(--accent); }
        
        .sf-goal-input-wrapper { display: flex; align-items: center; gap: 14px; width: 100%; padding: 2px 0; margin-top: 0.5rem; opacity: 0.6; transition: opacity 0.2s; }
        .sf-goal-input-wrapper:hover, .sf-goal-input-wrapper:focus-within { opacity: 1; }
        .sf-goal-add-icon { color: var(--text-dim); padding: 2px; flex-shrink: 0; }
        .sf-goal-input { flex: 1; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; color: var(--text-sec); background: transparent; border: none; outline: none; padding: 2px 0; text-align: left; }
        .sf-goal-input::placeholder { color: var(--text-dark); }

        /* ── Settings Modal ── */
        .sd-overlay { position: fixed; inset: 0; z-index: 100; background: var(--bg-overlay); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; animation: cm-fade-in 0.18s ease; font-family: 'DM Sans', sans-serif; }
        .sd-panel { background: var(--bg-panel); border: 0.5px solid var(--border-bright); min-width: 480px; max-width: 90vw; border-radius: 8px; animation: cm-slide-up 0.22s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
        .sd-header { display: flex; align-items: center; padding: 1.5rem 2rem 1.25rem; border-bottom: 0.5px solid var(--border); }
        .sd-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--text-dim); flex: 1; }
        .sd-close { background: transparent; border: none; cursor: pointer; color: var(--text-dark); padding: 4px; transition: color 0.15s; display: flex; }
        .sd-close:hover { color: var(--text-main); }
        .sd-list { padding: 1rem 0 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .sd-item { display: flex; flex-direction: column; gap: 0.8rem; padding: 0 2rem; }
        .sd-info { display: flex; flex-direction: column; gap: 4px; }
        .sd-title { font-size: 14px; font-weight: 500; color: var(--text-main); letter-spacing: 0.02em; }
        .sd-desc { font-size: 12px; color: var(--text-dim); letter-spacing: 0.04em; }
        .sd-options { display: flex; align-items: center; gap: 8px; background: var(--bg-hover); padding: 4px; border-radius: 6px; align-self: flex-start; }
        .sd-opt { background: transparent; border: none; padding: 6px 16px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--text-dim); cursor: pointer; transition: all 0.2s; letter-spacing: 0.04em; text-transform: uppercase; }
        .sd-opt:hover { color: var(--text-sec); }
        .sd-opt.active { background: var(--accent); color: var(--bg-main); box-shadow: 0 2px 8px var(--accent-glow); }

        /* ── Custom Modal ── */
        .cm-overlay { position: fixed; inset: 0; z-index: 100; background: var(--bg-overlay); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; animation: cm-fade-in 0.18s ease; font-family: 'DM Sans', sans-serif; }
        @keyframes cm-fade-in { from{opacity:0} to{opacity:1} }
        .cm-panel { background: var(--bg-panel); border: 0.5px solid var(--border-bright); padding: 3rem 3.5rem 2.5rem; min-width: 340px; animation: cm-slide-up 0.22s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; align-items: center; }
        @keyframes cm-slide-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .cm-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: var(--text-dark); margin-bottom: 2.5rem; }
        .cm-pickers { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; }
        .cm-field { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; position: relative; padding-bottom: 1.4rem; }
        .cm-arrow { background: transparent; border: none; cursor: pointer; color: var(--text-dim); padding: 6px 10px; transition: color 0.15s; display: flex; align-items: center; }
        .cm-arrow:hover { color: var(--text-main); }
        .cm-digit-input { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 72px; line-height: 1; letter-spacing: -0.02em; color: var(--text-main); background: transparent; border: none; border-bottom: 1.5px solid var(--text-dim); outline: none; text-align: center; width: 110px; padding: 0 0 6px; -moz-appearance: textfield; transition: border-color 0.2s; }
        .cm-digit-input::-webkit-inner-spin-button, .cm-digit-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .cm-digit-input:focus { border-bottom-color: var(--accent); }
        .cm-unit { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); white-space: nowrap; }
        .cm-colon { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 72px; color: var(--text-xdark); line-height: 1; padding-bottom: 18px; margin: 0 4px; }
        .cm-summary { font-size: 11px; letter-spacing: 0.18em; color: var(--text-dark); text-align: center; min-height: 1.4em; }
        .cm-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; align-items: center; width: 100%; }
        .cm-cancel { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-main); background: transparent; border: 0.5px solid var(--text-main); cursor: pointer; padding: 12px 36px; transition: opacity 0.2s; width: 100%; text-align: center; }
        .cm-cancel:hover { opacity: 0.6; }
        .cm-confirm { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; color: var(--bg-main); background: var(--text-main); border: none; padding: 12px 36px; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: inline-flex; align-items: center; justify-content: center; width: 100%; }
        .cm-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
        .cm-confirm:active { transform: translateY(0); }
        .cm-confirm:disabled { background: var(--border-bright); color: var(--text-dark); cursor: default; transform: none; opacity: 1; }

        /* ── Done Card ── */
        .dc-overlay { position: fixed; inset: 0; z-index: 200; background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; }
        .dc-inner { display: flex; flex-direction: column; align-items: center; gap: 0; animation: dc-rise 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes dc-rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .dc-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.36em; text-transform: uppercase; color: var(--accent); border: 0.5px solid var(--accent); padding: 5px 14px; border-radius: 100px; margin-bottom: 2.5rem; opacity: 0; animation: dc-fade 0.6s ease 0.1s forwards; }
        .dc-elapsed { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: clamp(96px, 18vw, 220px); line-height: 0.88; letter-spacing: -0.03em; color: var(--text-main); opacity: 0; animation: dc-fade 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; }
        .dc-sublabel { font-size: 12px; letter-spacing: 0.24em; color: var(--text-dim); text-transform: uppercase; margin-top: 1.2rem; opacity: 0; animation: dc-fade 0.6s ease 0.4s forwards; }
        .dc-divider { width: 32px; height: 0.5px; background: var(--border-bright); margin: 2.5rem auto; opacity: 0; animation: dc-fade 0.6s ease 0.6s forwards; }
        .dc-quote { font-size: 14px; font-weight: 300; letter-spacing: 0.04em; color: var(--text-dim); text-align: center; max-width: 380px; line-height: 1.7; font-style: italic; opacity: 0; animation: dc-fade 0.6s ease 0.8s forwards; }
        .dc-actions { display: flex; align-items: center; gap: 1.5rem; margin-top: 3rem; opacity: 0; animation: dc-fade 0.6s ease 1s forwards; }
        .dc-btn-primary { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase; color: var(--bg-main); background: var(--text-main); border: none; padding: 14px 36px; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .dc-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .dc-btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); background: transparent; border: none; padding: 14px 0; cursor: pointer; transition: color 0.2s; }
        .dc-btn-ghost:hover { color: var(--text-main); }
        @keyframes dc-fade { from{opacity:0} to{opacity:1} }

        /* ── Progress ── */
        .sf-progress-track { position: fixed; bottom: 0; left: 0; right: 0; height: 2px; background: var(--bg-hover); z-index: 10; }
        .sf-progress-fill { height: 100%; background: var(--accent); transition: width 1s linear; }
        .sf-progress-fill.done { background: var(--done); }
        .sf-pct { position: fixed; bottom: 1.5rem; right: 1.5rem; font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.12em; color: var(--text-xdark); z-index: 10; transition: color 0.4s; }
        .sf-pct.active { color: var(--border-bright); }

        /* ── Mobile Centric Responsive Design ── */
        @media (max-width: 600px) {
          .sf-body { padding: 1.5rem 1rem; }
          
          .sf-timer { font-size: clamp(80px, 25vw, 120px); letter-spacing: -0.01em; margin-bottom: 0; }
          
          .sf-controls { gap: 0.75rem; width: 100%; justify-content: center; }
          .sf-btn-primary { width: 100%; justify-content: center; padding: 18px 20px; font-size: 12px; }
          .sf-btn-ghost { width: 100%; justify-content: center; padding: 18px 20px; background: var(--bg-hover); border-radius: 4px; font-size: 12px; }
          
          .sf-presets { width: 100%; display: flex; }
          .sf-preset { flex: 1; text-align: center; padding: 14px 0; }
          
          .sf-goals-section { position: relative; top: auto; left: auto; transform: none; margin-top: 2.5rem; padding: 0; max-width: 100%; width: 100%; }
          
          .sd-overlay, .cm-overlay { align-items: flex-end; }
          
          .sd-panel, .cm-panel { 
            width: 100vw; min-width: 100vw; max-width: 100vw; 
            border-radius: 20px 20px 0 0; border: none; 
            border-top: 1px solid var(--border-bright);
            margin: 0; padding-top: 2rem;
            animation: slide-up-drawer 0.35s cubic-bezier(0.16,1,0.3,1); 
            position: relative;
          }
          
          .sd-panel::before, .cm-panel::before {
            content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
            width: 36px; height: 4px; border-radius: 4px; background: var(--border-bright);
          }
          
          .sd-panel { height: auto; max-height: 85vh; padding-top: 1rem; }
          .sd-panel::before { top: 10px; }
          .sd-header { padding: 1.5rem 1.5rem 1rem; border-bottom: none; }
          .sd-item { padding: 0 1.5rem; }
          .sd-options { flex-wrap: wrap; width: 100%; }
          .sd-opt { flex: 1 1 40%; text-align: center; }
          
          .cm-panel { height: auto; max-height: 85vh; padding: 2.5rem 1.5rem 1.5rem; }
          .cm-pickers { gap: 0.25rem; }
          .cm-digit-input { font-size: 56px; width: 80px; }
          .cm-colon { font-size: 56px; padding-bottom: 12px; }
          
          @keyframes slide-up-drawer { 
            from { transform: translateY(100%); } 
            to { transform: translateY(0); } 
          }
        }
      `}</style>

      <div className="sf-root" data-theme={settings.theme || "monk"}>
        <div className="sf-grain" />

        {/* Top bar */}
        <div className="sf-topbar">
          <button className={`sf-topbar-btn ${showSettings ? "active" : ""}`} onClick={openSettings} title="Settings">
            <span>Settings</span>
            <Gear size={26} weight="fill" />
          </button>
        </div>

        {/* Main */}
        <div className="sf-body">
          <div className="sf-inner">
            <div className={`sf-status ${isRunning ? "running" : isDone ? "done" : remaining < totalSeconds ? "paused" : ""} ${!settings.showStatus ? "hidden" : ""}`}>
              {statusLabel}
            </div>

            <div className={`sf-timer ${isDone ? "done" : ""} ${isRunning ? "sf-timer-pulse" : ""}`}>
              {formatTime(remaining)}
            </div>

            <div className="sf-controls">
              <button className="sf-btn-primary" onClick={handleStartPause} disabled={isDone} title={isRunning ? "Pause" : "Start"}>
                {isRunning ? "Pause" : "Start"}
              </button>
              {!isRunning && (
                <button className="sf-btn-ghost" onClick={doReset}>Reset</button>
              )}
            </div>

            <div className="sf-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  className={`sf-preset ${totalSeconds === p.minutes * 60 ? "active" : ""}`}
                  onClick={() => !isRunning && setPreset(p.minutes)}
                  disabled={isRunning}
                  style={{ opacity: isRunning ? 0.4 : 1 }}
                >
                  {p.label}
                  <span style={{ opacity: 0.45, marginLeft: 3, fontSize: 10, letterSpacing: "0.1em" }}>min</span>
                </button>
              ))}
              <button
                className={`sf-preset ${isCustom ? "active" : ""}`}
                onClick={() => !isRunning && setShowCustom(true)}
                disabled={isRunning}
                style={{ opacity: isRunning ? 0.4 : 1 }}
              >
                {isCustom ? `${Math.floor(totalSeconds / 60)}\u202fmin` : "Custom"}
              </button>
            </div>
            
            {/* Inline Goals */}
            <div className="sf-goals-section">
              {goals.map((g) => (
                <div key={g.id} className={`sf-goal-item ${g.done ? "done" : ""}`}>
                  <button className="sf-goal-check" onClick={() => toggleGoal(g.id)}>
                    {g.done ? <CheckCircle weight="fill" size={22} /> : <Circle weight="regular" size={22} />}
                  </button>
                  <span className="sf-goal-text">{g.text}</span>
                  <button className="sf-goal-remove" onClick={() => removeGoal(g.id)}>
                    <X weight="bold" size={16} />
                  </button>
                </div>
              ))}
              <div className="sf-goal-input-wrapper">
                <Plus weight="bold" size={22} className="sf-goal-add-icon" />
                <input
                  className="sf-goal-input"
                  placeholder="Add a focus..."
                  value={draftGoal}
                  onChange={(e) => setDraftGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addGoal();
                      e.currentTarget.blur();
                    }
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        <div className="sf-progress-track">
          <div className={`sf-progress-fill ${isDone ? "done" : ""}`} style={{ width: `${progressPct}%` }} />
        </div>
        {showSettings && <SettingsDrawer settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} onPreviewSound={playSound} />}
        {showCustom && <CustomModal onSet={(m) => { setPreset(m); setShowCustom(false); }} onClose={() => setShowCustom(false)} />}
      </div>

    </>
  );
}
