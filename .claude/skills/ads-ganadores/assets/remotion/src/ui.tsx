import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "./themes";

export const ThemeCtx = createContext<Theme | null>(null);
export const useTheme = () => useContext(ThemeCtx) as Theme;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Entrada de un elemento según el tipo de movimiento de la marca. */
export const useEnter = (delay = 0, seed = 0) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = useTheme();
  if (t.motion === "snap") {
    const p = interpolate(f, [0, 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return { opacity: f >= 0 ? 1 : 0, translate: `0px ${(1 - p) * 70}px`, scale: 1, rotate: "0deg" };
  }
  if (t.motion === "bounce") {
    const p = spring({ frame: f, fps, config: { damping: 9, stiffness: 150, mass: 0.7 } });
    return { opacity: f >= 0 ? 1 : 0, translate: `0px ${(1 - p) * 40}px`, scale: 0.3 + 0.7 * p, rotate: `${(1 - p) * (random(seed) > 0.5 ? 12 : -12)}deg` };
  }
  if (t.motion === "glitch") {
    const p = interpolate(f, [0, 9], [0, 1], clamp);
    const jit = f >= 0 && f < 9 ? (random(`${seed}-${f}`) - 0.5) * 40 : 0;
    const flick = f < 0 ? 0 : f < 9 ? (random(`o${seed}-${f}`) > 0.35 ? 1 : 0.2) : 1;
    return { opacity: flick, translate: `${jit}px ${(1 - p) * 12}px`, scale: 1, rotate: "0deg" };
  }
  const p = interpolate(f, [0, 20], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return { opacity: p, translate: `0px ${(1 - p) * 60}px`, scale: 1, rotate: "0deg" };
};

/** Componente que entra con el movimiento de la marca. */
export const In: React.FC<{ d?: number; seed?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ d = 0, seed = 0, style, children }) => {
  const e = useEnter(d, seed);
  return <div style={{ ...style, opacity: e.opacity, translate: e.translate, scale: String(e.scale), rotate: e.rotate }}>{children}</div>;
};

/** Salida de la escena: corte seco en brutalista, fundido en el resto. */
export const useExit = (dur: number) => {
  const f = useCurrentFrame();
  const t = useTheme();
  if (t.motion === "snap" || t.motion === "glitch") return 1;
  return interpolate(f, [dur - 8, dur], [1, 0], clamp);
};

export const accentCss = (t: Theme): React.CSSProperties => {
  switch (t.accentStyle) {
    case "box": return { background: t.accent, color: t.onAccent, padding: "0 0.12em", boxDecorationBreak: "clone" };
    case "highlight": return { backgroundImage: `linear-gradient(transparent 55%, ${t.neon} 55%, ${t.neon} 92%, transparent 92%)`, padding: "0 0.06em" };
    case "serif": return { fontFamily: t.serif, fontStyle: "italic", textTransform: "none", color: t.accent, letterSpacing: "-0.01em", fontWeight: 400 };
    case "italic": return { fontStyle: "italic", color: t.accent };
    default: return { color: t.accent };
  }
};

type Tok = { w: string; acc: boolean; glue?: boolean };
export const parseRich = (s: string): Tok[][] =>
  s.split("\n").map((line) => {
    const out: Tok[] = [];
    let acc = false;
    let last = "";
    for (const part of line.split(/(\*)/)) {
      if (part === "*") { acc = !acc; continue; }
      if (!part) continue;
      const glued = out.length > 0 && !/\s$/.test(last) && /^\S/.test(part);
      part.split(/\s+/).filter(Boolean).forEach((w, j) => out.push({ w, acc, glue: glued && j === 0 }));
      last = part;
    }
    return out;
  });

export const autoSize = (s: string, t: Theme, base = 1) => {
  const n = s.replace(/[*\n]/g, "").length;
  const px = n <= 14 ? 168 : n <= 24 ? 140 : n <= 40 ? 116 : n <= 60 ? 96 : 82;
  return Math.round(px * t.scale * base);
};

/** Titular con entrada palabra a palabra y acentos marcados con *asteriscos*. */
export const Rich: React.FC<{ text: string; size?: number; d?: number; stagger?: number; align?: "left" | "center"; color?: string; style?: React.CSSProperties }> = ({ text, size, d = 0, stagger, align = "left", color, style }) => {
  const t = useTheme();
  const lines = parseRich(text);
  const fs = size ?? autoSize(text, t);
  const st = stagger ?? (t.motion === "snap" ? 3 : t.motion === "glitch" ? 2 : 4);
  let i = 0;
  return (
    <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: fs, lineHeight: t.leading, letterSpacing: t.tracking, textTransform: t.upper ? "uppercase" : "none", color: color ?? t.fg, textAlign: align, ...style }}>
      {lines.map((ln, li) => (
        <div key={li}>
          {ln.map((tok, j) => {
            const k = i++;
            return <React.Fragment key={k}>{j > 0 && !tok.glue ? " " : ""}<Word d={d + k * st} seed={k} acc={tok.acc}>{tok.w}</Word></React.Fragment>;
          })}
        </div>
      ))}
    </div>
  );
};
const Word: React.FC<{ d: number; seed: number; acc: boolean; children: string }> = ({ d, seed, acc, children }) => {
  const t = useTheme();
  const e = useEnter(d, seed);
  return <span style={{ display: "inline-block", opacity: e.opacity, translate: e.translate, scale: String(e.scale), rotate: e.rotate, ...(acc ? accentCss(t) : {}) }}>{children}</span>;
};

export const Mono: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const t = useTheme();
  return <div style={{ fontFamily: t.mono, fontSize: 30, letterSpacing: "0.08em", textTransform: "uppercase", color: t.muted, ...style }}>{children}</div>;
};

export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const t = useTheme();
  return <div style={{ fontFamily: t.body, fontSize: 46, lineHeight: 1.3, color: t.fg, fontWeight: 500, ...style }}>{children}</div>;
};

/** Fondo animado de cada marca. */
export const Bg: React.FC<{ tone?: "base" | "alt" | "accent" }> = ({ tone = "base" }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const bg = tone === "accent" ? t.accent : tone === "alt" ? t.bg2 : t.bg;
  const line = tone === "accent" ? "rgba(0,0,0,.12)" : t.fg + "14";
  let layer: React.ReactNode = null;
  if (t.bgStyle === "grid") {
    layer = <AbsoluteFill style={{ backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, backgroundSize: "90px 90px", backgroundPosition: `0 ${f * 0.6}px`, maskImage: "radial-gradient(80% 70% at 50% 45%, #000 30%, transparent 85%)" }}>
      <AbsoluteFill style={{ background: `radial-gradient(50% 35% at ${50 + Math.sin(f / 40) * 15}% ${30 + Math.cos(f / 50) * 10}%, ${t.accent}40, transparent 70%)` }} />
    </AbsoluteFill>;
  } else if (t.bgStyle === "dots") {
    layer = <AbsoluteFill style={{ backgroundImage: `radial-gradient(${t.fg}22 2px, transparent 2.5px)`, backgroundSize: "48px 48px", backgroundPosition: `${f * 0.3}px ${f * 0.3}px` }} />;
  } else if (t.bgStyle === "blobs") {
    layer = <AbsoluteFill>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", width: width * 0.9, height: width * 0.9, borderRadius: "50%", left: width * (k === 1 ? 0.35 : -0.35) + Math.sin(f / 30 + k) * 60, top: height * (0.05 + k * 0.38) + Math.cos(f / 36 + k) * 60, background: [t.accent, t.neon, t.accent][k], opacity: tone === "accent" ? 0.18 : 0.32, filter: "blur(90px)" }} />
      ))}
    </AbsoluteFill>;
  } else if (t.bgStyle === "grain") {
    layer = <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 35%, ${t.accent}26, transparent 70%)` }} />
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.16, mixBlendMode: "overlay" }}>
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2)} /></filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>;
  } else if (t.bgStyle === "paper") {
    layer = <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 80% 10%, ${t.neon}33, transparent 70%), radial-gradient(60% 40% at 10% 90%, ${t.accent}26, transparent 70%)` }} />
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.1, mixBlendMode: "multiply" }}>
        <filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed={3} /></filter>
        <rect width="100%" height="100%" filter="url(#p)" />
      </svg>
    </AbsoluteFill>;
  } else if (t.bgStyle === "news") {
    layer = <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 120, borderTop: `4px solid ${t.fg}`, borderBottom: `1px solid ${t.fg}`, height: 10 }} />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 120, borderTop: `1px solid ${t.fg}` }} />
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.08, mixBlendMode: "multiply" }}>
        <filter id="q"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed={7} /></filter>
        <rect width="100%" height="100%" filter="url(#q)" />
      </svg>
    </AbsoluteFill>;
  } else if (t.bgStyle === "scan") {
    layer = <AbsoluteFill>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${t.neon}18 1px, transparent 1px), linear-gradient(90deg, ${t.accent}18 1px, transparent 1px)`, backgroundSize: "120px 120px", transform: `perspective(900px) rotateX(55deg) translateY(${(f * 4) % 120}px)`, transformOrigin: "50% 100%", top: "45%" }} />
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% 20%, ${t.accent}44, transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 5px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, height: 140, top: ((f * 9) % (height + 300)) - 150, background: `linear-gradient(transparent, ${t.neon}14, transparent)` }} />
    </AbsoluteFill>;
  } else if (t.bgStyle === "blocks") {
    layer = <AbsoluteFill>
      <div style={{ position: "absolute", right: -80, top: 260 + Math.sin(f / 20) * 10, width: 420, height: 420, background: t.accent, rotate: `${f * 0.4}deg` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: t.fg }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 12, background: t.fg }} />
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{ background: bg }}>{layer}</AbsoluteFill>;
};

/** Marca de la agencia y etiqueta del servicio, fijas en todo el vídeo. */
export const Chrome: React.FC<{ tag: string; total: number }> = ({ tag, total }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 80, top: 64, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 38, color: t.fg, textTransform: t.upper ? "uppercase" : "none", letterSpacing: t.tracking }}>
          <div style={{ width: 34, height: 34, borderRadius: t.radius ? "50%" : 0, background: t.accent }} />
          {t.brand}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 24, letterSpacing: "0.1em", color: t.muted, border: `2px solid ${t.muted}66`, borderRadius: t.radius ? 99 : 0, padding: "6px 18px", textTransform: "uppercase" }}>{tag}</div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 60, height: 6, background: t.fg + "22", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${(f / total) * 100}%`, background: t.accent, borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
};

/** Marco de teléfono. */
export const Phone: React.FC<{ children: React.ReactNode; w?: number; h?: number; style?: React.CSSProperties }> = ({ children, w = 760, h = 1240, style }) => {
  const t = useTheme();
  return (
    <div style={{ width: w, height: h, borderRadius: Math.max(t.radius * 2, 24), background: t.bg2, border: `10px solid ${t.fg}`, overflow: "hidden", position: "relative", boxShadow: `0 40px 120px ${t.fg}33`, ...style }}>
      {children}
    </div>
  );
};

export const CheckIcon: React.FC<{ size?: number; color: string; bg: string }> = ({ size = 56, color, bg }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

export { clamp };
