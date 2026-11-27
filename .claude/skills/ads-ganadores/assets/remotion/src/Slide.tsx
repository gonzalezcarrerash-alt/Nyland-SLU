import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import CARIMG from "./data/carimg.json";
import { THEMES, type Theme } from "./themes";
import { Bg, Body, CheckIcon, In, Mono, Rich, ThemeCtx, useTheme } from "./ui";
import { CARS, type SlideDef } from "./data/carousels";

const toned = (t: Theme, tone: SlideDef["tone"]): Theme => {
  // En fondos de color, el marcador se lee como tachado: pasa a color neón.
  const hl = t.accentStyle === "highlight" ? { accentStyle: "color" as const, accent: t.neon } : {};
  if (tone === "accent") return { ...t, bg: t.accent, bg2: t.accent, fg: t.onAccent, muted: t.onAccent + "cc", accent: t.bg === t.onAccent ? t.neon : t.bg, onAccent: t.accent, bgStyle: t.bgStyle === "scan" ? "dots" : t.bgStyle, ...hl };
  if (tone === "inverse") return { ...t, bg: t.fg, bg2: t.fg, fg: t.bg, muted: t.bg + "aa", ...hl };
  if (tone === "alt") return { ...t, bg: t.bg2 };
  return t;
};

const Footer: React.FC<{ n: number; total: number }> = ({ n, total }) => {
  const t = useTheme();
  return (
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 60, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: t.mono, fontSize: 24, letterSpacing: "0.08em", color: t.muted, textTransform: "uppercase" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ width: 22, height: 22, borderRadius: t.radius ? "50%" : 0, background: t.accent, display: "inline-block" }} />{t.brand} · {t.handle}</span>
      <span>{n === 1 ? "Deslizá →" : `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}</span>
    </div>
  );
};

/** Foto de Higgsfield: a sangre en la portada, arriba en los slides de texto, en tarjeta en los numerados. */
const Photo: React.FC<{ src: string; mode: "full" | "top" | "card" }> = ({ src, mode }) => {
  const t = useTheme();
  if (mode === "card") {
    return (
      <div style={{ position: "absolute", right: 90, top: 110, width: 470, height: 470, borderRadius: Math.max(t.radius, 6), overflow: "hidden", border: `3px solid ${t.fg}`, boxShadow: `0 30px 70px ${t.fg}40`, rotate: t.motion === "bounce" ? "3deg" : "0deg" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const h = mode === "full" ? "100%" : "60%";
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: h, objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: mode === "full"
        ? `linear-gradient(180deg, ${t.bg}33 0%, transparent 18%, transparent 30%, ${t.bg}e6 52%, ${t.bg} 66%)`
        : `linear-gradient(180deg, transparent 55%, ${t.bg}cc 85%, ${t.bg} 100%)` }} />
    </AbsoluteFill>
  );
};

const Content: React.FC<{ s: SlideDef; img?: string }> = ({ s, img }) => {
  const t = useTheme();
  const pad: React.CSSProperties = { position: "absolute", inset: "110px 90px 150px", display: "flex", flexDirection: "column", gap: 34, textAlign: "left" };
  if (s.kind === "hero") {
    return (
      <>
        {img && <Photo src={img} mode="full" />}
        <div style={{ ...pad, justifyContent: "flex-end" }}>
          {s.kicker && <Mono style={{ color: t.accent }}>{s.kicker}</Mono>}
          <Rich text={s.title} size={Math.round((s.title.length > 46 ? 104 : 128) * t.scale)} />
          {s.sub && <Body style={{ color: t.muted, fontSize: 44 }}>{s.sub}</Body>}
        </div>
      </>
    );
  }
  if (s.kind === "text") {
    return (
      <>
        {img && <Photo src={img} mode="top" />}
        <div style={{ ...pad, justifyContent: img ? "flex-end" : "center" }}>
          {s.kicker && <Mono style={{ color: t.accent }}>{s.kicker}</Mono>}
          <Rich text={s.title} size={Math.round((s.title.length > 60 ? 84 : img ? 92 : 100) * t.scale)} />
          {s.body && <Body style={{ fontSize: 44, color: t.muted }}>{s.body}</Body>}
        </div>
      </>
    );
  }
  if (s.kind === "item") {
    return (
      <>
        <div style={{ position: "absolute", ...(img ? { left: 50 } : { right: 40 }), top: 30, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: (img ? 460 : 620) * t.scale, lineHeight: 0.85, color: "transparent", WebkitTextStroke: `4px ${t.accent}55` }}>{String(s.n).padStart(2, "0")}</div>
        {img && <Photo src={img} mode="card" />}
        <div style={{ ...pad, justifyContent: "flex-end" }}>
          <Mono style={{ color: t.accent }}>{s.label ?? "Punto"} {String(s.n).padStart(2, "0")}</Mono>
          <Rich text={s.title} size={Math.round(100 * t.scale)} />
          <Body style={{ fontSize: 44, color: t.muted }}>{s.body}</Body>
        </div>
      </>
    );
  }
  if (s.kind === "bento") {
    return (
      <div style={{ ...pad, justifyContent: "center" }}>
        <Rich text={s.title} size={Math.round(92 * t.scale)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {s.cards.map((c, i) => (
            <In key={i} d={4 + i * 3}>
              <div style={{ background: i === 0 ? t.accent : t.bg2 === t.bg ? t.fg + "10" : t.bg2, color: i === 0 ? t.onAccent : t.fg, border: `2px solid ${t.fg}18`, borderRadius: t.radius, padding: "34px 30px", minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
                <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 64 * t.scale, lineHeight: 1, textTransform: t.upper ? "uppercase" : "none", letterSpacing: t.tracking }}>{c.t}</div>
                <div style={{ fontFamily: t.body, fontSize: 34, lineHeight: 1.25, opacity: 0.85 }}>{c.d}</div>
              </div>
            </In>
          ))}
        </div>
      </div>
    );
  }
  if (s.kind === "compare") {
    const Col: React.FC<{ c: { t: string; items: string[] }; good: boolean }> = ({ c, good }) => (
      <div style={{ flex: 1, borderRadius: t.radius, padding: "38px 34px", background: good ? t.accent : t.fg + "0d", color: good ? t.onAccent : t.fg, border: good ? "none" : `2px solid ${t.fg}22`, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontFamily: t.mono, fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.t}</div>
        {c.items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", fontFamily: t.body, fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}>
            {good ? <CheckIcon size={44} color={t.accent} bg={t.onAccent} /> : <span style={{ width: 44, flex: "none", textAlign: "center", color: t.muted, fontSize: 40, lineHeight: 1 }}>×</span>}
            <span style={{ opacity: good ? 1 : 0.7 }}>{it}</span>
          </div>
        ))}
      </div>
    );
    return (
      <div style={{ ...pad, justifyContent: "center" }}>
        {s.title && <Rich text={s.title} size={Math.round(84 * t.scale)} />}
        <div style={{ display: "flex", gap: 22 }}><Col c={s.left} good={false} /><Col c={s.right} good /></div>
      </div>
    );
  }
  // cta
  return (
    <div style={{ ...pad, justifyContent: "center" }}>
      <Rich text={s.title} size={Math.round(112 * t.scale)} />
      {s.body && <Body style={{ fontSize: 44, color: t.muted }}>{s.body}</Body>}
      {s.keyword && (
        <div style={{ display: "flex", alignItems: "center", gap: 22, background: t.fg + "0d", border: `3px solid ${t.accent}`, borderRadius: t.radius ? 999 : 0, padding: "26px 34px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${t.neon}, ${t.accent})`, flex: "none" }} />
          <div style={{ fontFamily: t.body, fontSize: 38, color: t.muted }}>Comentá</div>
          <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 58 * t.scale, color: t.fg, textTransform: "uppercase" }}>{s.keyword}</div>
        </div>
      )}
      {s.button && (
        <div style={{ alignSelf: "flex-start", background: t.accent, color: t.onAccent, borderRadius: t.radius ? 999 : 0, padding: "30px 48px", fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 52 * t.scale, textTransform: t.upper ? "uppercase" : "none" }}>{s.button} →</div>
      )}
    </div>
  );
};

export const Slide: React.FC<{ id: string; idx: number }> = ({ id, idx }) => {
  const car = CARS[id];
  const s = car.slides[idx];
  const theme = toned(THEMES[car.theme], s.tone ?? "base");
  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
        <Bg />
        <Content s={s} img={(CARIMG as Record<string, Record<string, string>>)[id]?.[String(idx)]} />
        <Footer n={idx + 1} total={car.slides.length} />
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};
