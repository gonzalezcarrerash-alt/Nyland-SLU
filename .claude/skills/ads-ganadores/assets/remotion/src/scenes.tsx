import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Body, CheckIcon, clamp, In, Mono, Phone, Rich, useExit, useTheme } from "./ui";

export type SceneDef =
  | { type: "statement"; dur: number; text: string; kicker?: string; sub?: string; align?: "left" | "center" }
  | { type: "chat"; dur: number; header: string; msgs: { from: "c" | "a"; text: string }[] }
  | { type: "counter"; dur: number; value: number; prefix?: string; suffix?: string; label: string; source?: string }
  | { type: "beforeAfter"; dur: number; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { type: "list"; dur: number; title: string; items: string[] }
  | { type: "prompt"; dur: number; prompt: string; outputs: string[] }
  | { type: "calendar"; dur: number; title: string; label: string }
  | { type: "adgrid"; dur: number; title: string }
  | { type: "dashboard"; dur: number; title: string; kpis: { l: string; v: number }[]; note: string }
  | { type: "pipeline"; dur: number; title: string; cols: string[] }
  | { type: "call"; dur: number; name: string; lines: { from: "c" | "a"; text: string }[]; result: string }
  | { type: "phoneApp"; dur: number; screens: { title: string; rows: string[] }[] }
  | { type: "funnel"; dur: number; title: string; steps: string[] }
  | { type: "cta"; dur: number; headline: string; keyword?: string; button?: string; sub?: string }
  | { type: "guide"; dur: number; title: string; sub?: string };

const Frame: React.FC<{ dur: number; children: React.ReactNode; center?: boolean }> = ({ dur, children, center }) => {
  const o = useExit(dur);
  return (
    <AbsoluteFill style={{ opacity: o, padding: "200px 90px 340px", display: "flex", flexDirection: "column", justifyContent: center ? "center" : "flex-start", gap: 40 }}>
      {children}
    </AbsoluteFill>
  );
};

const Statement: React.FC<Extract<SceneDef, { type: "statement" }>> = ({ dur, text, kicker, sub, align }) => {
  const t = useTheme();
  const words = text.replace(/\*/g, "").split(/\s+/).length;
  return (
    <Frame dur={dur} center>
      {kicker && <In><Mono style={{ color: t.accent, textAlign: align ?? "left" }}>{kicker}</Mono></In>}
      <Rich text={text} align={align} d={kicker ? 5 : 0} />
      {sub && <In d={words * 4 + 6}><Body style={{ color: t.muted, textAlign: align ?? "left" }}>{sub}</Body></In>}
    </Frame>
  );
};

const Chat: React.FC<Extract<SceneDef, { type: "chat" }>> = ({ dur, header, msgs }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const gap = Math.floor((dur - 30) / msgs.length);
  return (
    <Frame dur={dur} center>
      <In style={{ alignSelf: "center" }}>
        <Phone>
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "40px 36px 28px", borderBottom: `2px solid ${t.fg}18`, background: t.bg }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.neon})` }} />
            <div>
              <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 36, color: t.fg }}>{header}</div>
              <div style={{ fontFamily: t.mono, fontSize: 22, color: t.accent }}>agente IA · en línea</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: 36 }}>
            {msgs.map((m, i) => {
              const at = 12 + i * gap;
              const typing = m.from === "a" && f >= at - 14 && f < at;
              if (f < at && !typing) return null;
              const mine = m.from === "a";
              return (
                <In key={i} d={typing ? at - 14 : at} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%" }}>
                  <div style={{ background: mine ? t.accent : t.bg, color: mine ? t.onAccent : t.fg, border: mine ? "none" : `2px solid ${t.fg}1f`, borderRadius: Math.max(t.radius, 8), padding: "20px 26px", fontFamily: t.body, fontSize: 34, lineHeight: 1.35 }}>
                    {typing ? <span style={{ letterSpacing: 8, fontSize: 40 }}>{".".repeat(1 + (Math.floor(f / 5) % 3))}</span> : m.text}
                  </div>
                </In>
              );
            })}
          </div>
        </Phone>
      </In>
    </Frame>
  );
};

const Counter: React.FC<Extract<SceneDef, { type: "counter" }>> = ({ dur, value, prefix = "", suffix = "", label, source }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [4, 34], [0, value], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <Frame dur={dur} center>
      <In>
        <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 330 * t.scale, lineHeight: 0.9, letterSpacing: t.tracking, color: t.accent, fontVariantNumeric: "tabular-nums" }}>{prefix}{v.toLocaleString("es-ES")}{suffix}</div>
      </In>
      <In d={10}><Body style={{ fontSize: 56, fontWeight: 700 }}>{label}</Body></In>
      {source && <In d={18}><Mono>Fuente: {source}</Mono></In>}
    </Frame>
  );
};

const BeforeAfter: React.FC<Extract<SceneDef, { type: "beforeAfter" }>> = ({ dur, left, right }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const half = Math.floor(dur * 0.42);
  const wipe = interpolate(f, [half, half + 14], [0, 100], { ...clamp, easing: Easing.bezier(0.7, 0, 0.2, 1) });
  const Panel: React.FC<{ s: { title: string; items: string[] }; good: boolean; d: number }> = ({ s, good, d }) => (
    <div style={{ flex: 1, borderRadius: t.radius, padding: "44px 48px", background: good ? t.accent : t.bg2, color: good ? t.onAccent : t.fg, border: good ? "none" : `2px solid ${t.fg}22`, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: t.mono, fontSize: 30, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>{s.title}</div>
      {s.items.map((it, i) => (
        <In key={i} d={d + 6 + i * 6}>
          <div style={{ display: "flex", gap: 22, alignItems: "center", fontFamily: t.body, fontSize: 44, fontWeight: 600, lineHeight: 1.2 }}>
            {good ? <CheckIcon size={52} color={t.accent} bg={t.onAccent} /> : <div style={{ width: 52, height: 52, flex: "none", borderRadius: "50%", border: `3px solid ${t.muted}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.muted, fontSize: 34 }}>×</div>}
            <span style={{ textDecoration: good ? "none" : "line-through", textDecorationColor: t.accent, textDecorationThickness: 4, opacity: good ? 1 : 0.75 }}>{it}</span>
          </div>
        </In>
      ))}
    </div>
  );
  return (
    <Frame dur={dur} center>
      <In><Panel s={left} good={false} d={0} /></In>
      <div style={{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }}><Panel s={right} good d={half} /></div>
    </Frame>
  );
};

const List: React.FC<Extract<SceneDef, { type: "list" }>> = ({ dur, title, items }) => {
  const t = useTheme();
  const step = Math.min(14, Math.floor((dur - 30) / items.length));
  return (
    <Frame dur={dur} center>
      <Rich text={title} size={Math.round(96 * t.scale)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 20 }}>
        {items.map((it, i) => (
          <In key={i} d={14 + i * step} seed={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 28, background: t.bg2, border: `2px solid ${t.fg}1a`, borderRadius: t.radius, padding: "28px 34px" }}>
              <div style={{ width: 70, height: 70, flex: "none", borderRadius: t.radius ? "50%" : 0, background: t.accent, color: t.onAccent, fontFamily: t.mono, fontSize: 32, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: t.body, fontSize: 48, fontWeight: 700, color: t.fg, lineHeight: 1.15 }}>{it}</div>
            </div>
          </In>
        ))}
      </div>
    </Frame>
  );
};

const Prompt: React.FC<Extract<SceneDef, { type: "prompt" }>> = ({ dur, prompt, outputs }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const typeEnd = Math.min(dur * 0.45, prompt.length / 1.6);
  const n = Math.floor(interpolate(f, [4, 4 + typeEnd], [0, prompt.length], clamp));
  const outAt = 4 + typeEnd + 8;
  return (
    <Frame dur={dur} center>
      <In>
        <div style={{ background: t.bg2, border: `3px solid ${t.accent}`, borderRadius: t.radius, padding: "34px 38px", boxShadow: `0 0 80px ${t.accent}33` }}>
          <div style={{ fontFamily: t.mono, fontSize: 24, color: t.accent, letterSpacing: "0.12em", marginBottom: 16 }}>PROMPT</div>
          <div style={{ fontFamily: t.body, fontSize: 42, lineHeight: 1.35, color: t.fg, minHeight: 170 }}>
            {prompt.slice(0, n)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: t.accent }}>▍</span>
          </div>
        </div>
      </In>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {outputs.map((o, i) => (
          <In key={i} d={outAt + i * 6} seed={i + 3}>
            <div style={{ borderRadius: t.radius, padding: "26px 28px", background: i % 2 ? t.neon : t.accent, color: i % 2 ? t.fg : t.onAccent, fontFamily: t.body, fontWeight: 700, fontSize: 34, lineHeight: 1.25, minHeight: 190, display: "flex", alignItems: "flex-end" }}>{o}</div>
          </In>
        ))}
      </div>
    </Frame>
  );
};

const Calendar: React.FC<Extract<SceneDef, { type: "calendar" }>> = ({ dur, title, label }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const kinds = ["Reel", "Carrusel", "Post"];
  const filled = Math.floor(interpolate(f, [10, dur - 30], [0, 30], clamp));
  return (
    <Frame dur={dur} center>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24 }}>
        <Rich text={title} size={Math.round(92 * t.scale)} />
        <div style={{ flex: "none", fontFamily: t.mono, fontSize: 44, color: t.accent, fontVariantNumeric: "tabular-nums" }}>{filled}/30</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const on = i < filled;
          const k = Math.floor(random(i) * 3);
          return (
            <div key={i} style={{ aspectRatio: "1", borderRadius: Math.min(t.radius, 20), background: on ? [t.accent, t.neon, t.fg][k] : "transparent", border: `2px dashed ${t.fg}33`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 12, scale: on ? "1" : "0.92" }}>
              <div style={{ fontFamily: t.mono, fontSize: 20, color: on ? (k === 2 ? t.bg : t.onAccent) : t.muted }}>{i + 1}</div>
              {on && <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 20, color: k === 2 ? t.bg : k === 1 ? t.fg : t.onAccent }}>{kinds[k]}</div>}
            </div>
          );
        })}
      </div>
      <In d={dur - 30}><Body style={{ fontWeight: 700 }}>{label}</Body></In>
    </Frame>
  );
};

const AdGrid: React.FC<Extract<SceneDef, { type: "adgrid" }>> = ({ dur, title }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const pick = Math.floor(dur * 0.6);
  const win = 4;
  const hl = interpolate(f, [pick, pick + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <Frame dur={dur} center>
      <Mono style={{ color: t.accent }}>{title}</Mono>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const at = 6 + i * 5;
          const shown = f >= at;
          const isWin = i === win;
          const dim = f >= pick && !isWin ? 0.25 : 1;
          const hue = [t.accent, t.neon, t.fg][i % 3];
          return (
            <div key={i} style={{ aspectRatio: "4/5", borderRadius: t.radius, overflow: "hidden", background: t.bg2, border: `2px solid ${isWin && f >= pick ? t.neon : t.fg + "22"}`, opacity: shown ? dim : 0, scale: isWin ? String(1 + hl * 0.12) : "1", zIndex: isWin ? 2 : 1, position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, background: `linear-gradient(${120 + i * 30}deg, ${hue}, ${t.bg2})`, opacity: 0.85 }} />
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 12, width: `${60 + random(i) * 35}%`, background: t.fg + "aa", borderRadius: 6 }} />
                <div style={{ height: 10, width: "45%", background: t.fg + "55", borderRadius: 6 }} />
              </div>
              <div style={{ position: "absolute", left: 10, top: 10, fontFamily: t.mono, fontSize: 18, color: "#fff", background: "#0008", padding: "2px 8px", borderRadius: 6 }}>V{String(i + 1).padStart(2, "0")}</div>
              {isWin && f >= pick && <div style={{ position: "absolute", left: "50%", top: "40%", translate: "-50% 0", fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 30, background: t.neon, color: t.bg, padding: "8px 16px", borderRadius: 8, whiteSpace: "nowrap" }}>GANADOR</div>}
            </div>
          );
        })}
      </div>
      <In d={pick + 8}><Body style={{ fontWeight: 700 }}>Se prueban todas. Se escala la que vende.</Body></In>
    </Frame>
  );
};

const Dashboard: React.FC<Extract<SceneDef, { type: "dashboard" }>> = ({ dur, title, kpis, note }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const draw = interpolate(f, [20, 70], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pts = [20, 45, 38, 70, 62, 95, 88, 120, 140, 132, 170];
  const path = pts.map((y, i) => `${i === 0 ? "M" : "L"}${i * 76},${200 - y}`).join(" ");
  return (
    <Frame dur={dur} center>
      <In>
        <div style={{ borderRadius: t.radius, background: t.bg2, border: `2px solid ${t.fg}1f`, overflow: "hidden", boxShadow: `0 40px 100px ${t.fg}22` }}>
          <div style={{ display: "flex", gap: 10, padding: "18px 24px", borderBottom: `2px solid ${t.fg}14` }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />)}
            <div style={{ marginLeft: 16, fontFamily: t.mono, fontSize: 22, color: t.muted }}>{title}</div>
          </div>
          <div style={{ padding: 34, display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 18 }}>
              {kpis.map((k, i) => (
                <In key={i} d={8 + i * 6}>
                  <div style={{ borderRadius: Math.min(t.radius, 18), background: i === 0 ? t.accent : t.bg, color: i === 0 ? t.onAccent : t.fg, padding: "22px 22px" }}>
                    <div style={{ fontFamily: t.body, fontSize: 24, opacity: 0.8 }}>{k.l}</div>
                    <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 76 * t.scale, fontVariantNumeric: "tabular-nums" }}>{Math.round(interpolate(f, [10 + i * 6, 40 + i * 6], [0, k.v], { ...clamp, easing: Easing.out(Easing.cubic) }))}</div>
                  </div>
                </In>
              ))}
            </div>
            <svg viewBox="0 0 770 210" style={{ width: "100%", height: 300 }}>
              <path d={path} fill="none" stroke={t.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
              <path d={`${path} L760,210 L0,210 Z`} fill={t.accent} opacity={0.12 * (1 - draw)} />
            </svg>
            {[0, 1, 2].map((r) => (
              <In key={r} d={40 + r * 6}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 0", borderTop: `2px solid ${t.fg}10` }}>
                  <CheckIcon size={40} color={t.onAccent} bg={t.accent} />
                  <div style={{ height: 14, width: `${50 + r * 12}%`, background: t.fg + "33", borderRadius: 7 }} />
                </div>
              </In>
            ))}
          </div>
        </div>
      </In>
      <Mono>{note}</Mono>
    </Frame>
  );
};

const Pipeline: React.FC<Extract<SceneDef, { type: "pipeline" }>> = ({ dur, title, cols }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const colW = 210, gapW = 14;
  const cards = [0, 1, 2, 3];
  return (
    <Frame dur={dur} center>
      <Rich text={title} size={Math.round(100 * t.scale)} />
      <div style={{ position: "relative", height: 860 }}>
        <div style={{ display: "flex", gap: gapW }}>
          {cols.map((c, i) => (
            <div key={i} style={{ width: colW, height: 860, borderRadius: Math.min(t.radius, 20), background: t.bg2, border: `2px solid ${t.fg}18`, padding: 14 }}>
              <div style={{ fontFamily: t.mono, fontSize: 22, color: i === cols.length - 1 ? t.accent : t.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{c}</div>
            </div>
          ))}
        </div>
        {cards.map((k) => {
          const start = 10 + k * 10;
          const hops = Math.min(cols.length - 1, 1 + (k % 3) + (k === 0 ? 1 : 0));
          const per = (dur - start - 20) / hops;
          const pos = interpolate(f, Array.from({ length: hops + 1 }, (_, j) => start + j * per), Array.from({ length: hops + 1 }, (_, j) => j), { ...clamp, easing: Easing.inOut(Easing.cubic) });
          return (
            <div key={k} style={{ position: "absolute", left: 14 + pos * (colW + gapW), top: 70 + k * 190, width: colW - 28, borderRadius: Math.min(t.radius, 14), background: pos > cols.length - 1.5 ? t.accent : t.bg, color: pos > cols.length - 1.5 ? t.onAccent : t.fg, border: `2px solid ${t.fg}22`, padding: 16, opacity: f >= start ? 1 : 0, boxShadow: `0 12px 30px ${t.fg}22` }}>
              <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 26 }}>{["Ana R.", "Luis P.", "Marta G.", "Diego S."][k]}</div>
              <div style={{ height: 8, width: "70%", background: "currentColor", opacity: 0.3, borderRadius: 4, marginTop: 10 }} />
              <div style={{ fontFamily: t.mono, fontSize: 18, marginTop: 10, opacity: 0.8 }}>auto · IA</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

const Call: React.FC<Extract<SceneDef, { type: "call" }>> = ({ dur, name, lines, result }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const ring = 26;
  const gap = Math.floor((dur - ring - 40) / lines.length);
  const resAt = ring + lines.length * gap;
  const secs = Math.max(0, Math.floor((f - ring) / 30));
  return (
    <Frame dur={dur} center>
      <In style={{ alignSelf: "center" }}>
        <Phone>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 40px 30px", gap: 16, background: `linear-gradient(${t.accent}33, transparent)` }}>
            <div style={{ position: "relative", width: 150, height: 150 }}>
              {f < ring && [0, 1].map((k) => <div key={k} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `4px solid ${t.accent}`, scale: String(1 + ((f + k * 10) % 20) / 20), opacity: 1 - ((f + k * 10) % 20) / 20 }} />)}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.neon})` }} />
            </div>
            <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 38, color: t.fg, textAlign: "center" }}>{name}</div>
            <div style={{ fontFamily: t.mono, fontSize: 26, color: t.accent }}>{f < ring ? "llamando…" : `agente de voz · 0:${String(secs).padStart(2, "0")}`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "10px 34px" }}>
            {lines.map((l, i) => {
              const at = ring + i * gap;
              if (f < at) return null;
              return (
                <In key={i} d={at}>
                  <div style={{ fontFamily: t.body, fontSize: 30, lineHeight: 1.35, color: t.fg }}>
                    <span style={{ fontFamily: t.mono, fontSize: 22, color: l.from === "a" ? t.accent : t.muted, display: "block" }}>{l.from === "a" ? "AGENTE" : "CLIENTE"}</span>
                    {l.text}
                  </div>
                </In>
              );
            })}
          </div>
          {f >= resAt && (
            <In d={resAt} style={{ position: "absolute", left: 30, right: 30, bottom: 34 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, background: t.accent, color: t.onAccent, borderRadius: Math.max(t.radius, 12), padding: "22px 26px", fontFamily: t.body, fontWeight: 700, fontSize: 32 }}>
                <CheckIcon size={48} color={t.accent} bg={t.onAccent} />{result}
              </div>
            </In>
          )}
        </Phone>
      </In>
    </Frame>
  );
};

const PhoneApp: React.FC<Extract<SceneDef, { type: "phoneApp" }>> = ({ dur, screens }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const per = dur / screens.length;
  const idx = interpolate(f, screens.flatMap((_, i) => [i * per + per - 12, (i + 1) * per]).slice(0, -2), screens.flatMap((_, i) => [i, i + 1]).slice(0, -2), { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const W = 680;
  return (
    <Frame dur={dur} center>
      <In style={{ alignSelf: "center" }}>
        <Phone w={W + 20} h={1240}>
          <div style={{ display: "flex", width: W * screens.length, translate: `${-idx * W}px 0` }}>
            {screens.map((s, i) => (
              <div key={i} style={{ width: W, padding: "56px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ fontFamily: t.mono, fontSize: 22, color: t.accent, letterSpacing: "0.1em" }}>{String(i + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}</div>
                <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 76 * t.scale, color: t.fg, textTransform: t.upper ? "uppercase" : "none", letterSpacing: t.tracking, lineHeight: 1 }}>{s.title}</div>
                {s.rows.map((r, j) => {
                  const at = i * per + 8 + j * 7;
                  return (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 18, background: j === 0 ? t.accent : t.bg, color: j === 0 ? t.onAccent : t.fg, borderRadius: Math.max(t.radius, 10), padding: "26px 26px", fontFamily: t.body, fontWeight: 600, fontSize: 32, opacity: interpolate(f, [at, at + 8], [0, 1], clamp), translate: `0 ${interpolate(f, [at, at + 8], [20, 0], clamp)}px`, border: `2px solid ${t.fg}14` }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: j === 0 ? t.onAccent : t.accent, flex: "none" }} />{r}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Phone>
      </In>
    </Frame>
  );
};

const Funnel: React.FC<Extract<SceneDef, { type: "funnel" }>> = ({ dur, title, steps }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const leak = steps.length - 2;
  const pulse = 0.5 + 0.5 * Math.sin(f / 4);
  return (
    <Frame dur={dur} center>
      <Rich text={title} size={Math.round(96 * t.scale)} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 10 }}>
        {steps.map((s, i) => {
          const w = 100 - i * (55 / (steps.length - 1));
          const bad = i === leak;
          return (
            <In key={i} d={10 + i * 8} style={{ width: `${w}%` }}>
              <div style={{ background: bad ? "transparent" : i === steps.length - 1 ? t.accent : t.bg2, border: bad ? `4px dashed ${t.accent}` : `2px solid ${t.fg}22`, color: i === steps.length - 1 ? t.onAccent : t.fg, padding: "30px 20px", textAlign: "center", fontFamily: t.body, fontWeight: 700, fontSize: 40, borderRadius: Math.min(t.radius, 12), opacity: bad ? 0.5 + 0.5 * pulse : 1 }}>
                {s}{bad && <span style={{ display: "block", fontFamily: t.mono, fontSize: 24, color: t.accent, marginTop: 6 }}>← aquí se enfría el lead</span>}
              </div>
            </In>
          );
        })}
      </div>
    </Frame>
  );
};

const Cta: React.FC<Extract<SceneDef, { type: "cta" }>> = ({ dur, headline, keyword, button, sub }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const words = headline.split(/\s+/).length;
  const at = words * 4 + 10;
  const n = keyword ? Math.min(keyword.length, Math.max(0, Math.floor((f - at) / 3))) : 0;
  return (
    <Frame dur={dur + 20} center>
      <Rich text={headline} />
      {keyword && (
        <In d={at - 4}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, background: t.bg2, border: `3px solid ${t.accent}`, borderRadius: t.radius ? 999 : 0, padding: "26px 34px", marginTop: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${t.neon}, ${t.accent})`, flex: "none" }} />
            <div style={{ fontFamily: t.body, fontSize: 40, color: t.muted }}>Comenta</div>
            <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: Math.min(60, 470 / keyword.length) * t.scale, color: t.fg, textTransform: "uppercase", whiteSpace: "nowrap" }}>{keyword.slice(0, n)}<span style={{ color: t.accent, opacity: Math.floor(f / 8) % 2 }}>▍</span></div>
            <div style={{ marginLeft: "auto", fontSize: 56, color: t.accent, scale: n >= keyword.length ? String(1 + 0.15 * Math.sin(f / 3)) : "0" }}>♥</div>
          </div>
        </In>
      )}
      {button && (
        <In d={at - 4}>
          <div style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 20, background: t.accent, color: t.onAccent, borderRadius: t.radius ? 999 : 0, padding: "34px 54px", marginTop: 20, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 58 * t.scale, textTransform: t.upper ? "uppercase" : "none", scale: String(1 + 0.03 * Math.sin(f / 5)), boxShadow: `0 20px 60px ${t.accent}66` }}>
            {button} <span>→</span>
          </div>
        </In>
      )}
      {sub && <In d={at + 6}><Body style={{ color: t.muted, fontSize: 40 }}>{sub}</Body></In>}
    </Frame>
  );
};

/** Portada de la guía gratuita (lead magnet) que entra girando. */
const Guide: React.FC<Extract<SceneDef, { type: "guide" }>> = ({ dur, title, sub }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const rot = interpolate(f, [0, 22], [-38, -8], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fl = Math.sin(f / 18) * 3;
  return (
    <Frame dur={dur} center>
      <div style={{ alignSelf: "center", perspective: 1600 }}>
        <In>
          <div style={{ width: 620, height: 820, borderRadius: Math.max(t.radius, 10), background: `linear-gradient(155deg, ${t.bg2}, ${t.bg})`, border: `6px solid ${t.accent}`, boxShadow: `0 50px 120px ${t.fg}30, 0 0 90px ${t.accent}44`, padding: "60px 50px", display: "flex", flexDirection: "column", gap: 28, transform: `rotateY(${rot + fl}deg)`, position: "relative" }}>
            <div style={{ fontFamily: t.mono, fontSize: 26, letterSpacing: "0.14em", color: t.accent }}>GUÍA GRATIS</div>
            <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 66 * t.scale, lineHeight: 1.05, color: t.fg, textTransform: t.upper ? "uppercase" : "none", letterSpacing: t.tracking }}>{title}</div>
            <div style={{ marginTop: "auto", fontFamily: t.body, fontSize: 30, color: t.muted }}>{sub ?? "Sin código · gratis · en menos de 5 minutos"}</div>
            <div style={{ position: "absolute", right: -34, top: -30, background: t.neon, color: t.bg, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 34, padding: "12px 26px", borderRadius: 999, rotate: "8deg" }}>PDF</div>
          </div>
        </In>
      </div>
    </Frame>
  );
};

export const Scene: React.FC<{ s: SceneDef }> = ({ s }) => {
  switch (s.type) {
    case "statement": return <Statement {...s} />;
    case "chat": return <Chat {...s} />;
    case "counter": return <Counter {...s} />;
    case "beforeAfter": return <BeforeAfter {...s} />;
    case "list": return <List {...s} />;
    case "prompt": return <Prompt {...s} />;
    case "calendar": return <Calendar {...s} />;
    case "adgrid": return <AdGrid {...s} />;
    case "dashboard": return <Dashboard {...s} />;
    case "pipeline": return <Pipeline {...s} />;
    case "call": return <Call {...s} />;
    case "phoneApp": return <PhoneApp {...s} />;
    case "funnel": return <Funnel {...s} />;
    case "cta": return <Cta {...s} />;
    case "guide": return <Guide {...s} />;
  }
};
