import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { THEMES } from "./themes";
import { Bg, Body, In, Mono, Rich, ThemeCtx, useTheme } from "./ui";
import BOFU from "./data/gen-bofu.json" with { type: "json" };

export type PosterDef = { id: string; stage: string; cat: string; theme: string; kicker: string; headline: string; sub: string; cta: string; note?: string };
export const POSTERS = (BOFU as unknown as { images: PosterDef[] }).images;

const Inner: React.FC<{ p: PosterDef }> = ({ p }) => {
  const t = useTheme();
  const keyword = /^Comenta\s+/i.test(p.cta) ? p.cta.replace(/^Comenta\s+/i, "") : null;
  return (
    <AbsoluteFill>
      <Img src={staticFile(`poster-img/${p.id}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${t.bg}40 0%, transparent 16%, transparent 34%, ${t.bg}e6 54%, ${t.bg} 68%)` }} />
      <div style={{ position: "absolute", left: 80, top: 70, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 34, color: t.fg, textTransform: t.upper ? "uppercase" : "none", background: `${t.bg}d9`, borderRadius: t.radius ? 99 : 0, padding: "8px 20px 8px 12px" }}>
          <div style={{ width: 30, height: 30, borderRadius: t.radius ? "50%" : 0, background: t.accent }} />{t.brand}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 22, letterSpacing: "0.1em", color: t.fg, background: `${t.bg}cc`, borderRadius: t.radius ? 99 : 0, padding: "6px 16px", textTransform: "uppercase" }}>Publicidad</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 150, display: "flex", flexDirection: "column", gap: 30, textAlign: "left" }}>
        <Mono style={{ color: t.accent, fontSize: 30 }}>{p.kicker}</Mono>
        <Rich text={p.headline} size={Math.round((p.headline.length > 44 ? 104 : 124) * t.scale)} />
        <Body style={{ color: t.muted, fontSize: 44 }}>{p.sub}</Body>
        <In>
          {keyword ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20, background: `${t.bg2}`, border: `3px solid ${t.accent}`, borderRadius: t.radius ? 999 : 0, padding: "24px 32px", marginTop: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${t.neon}, ${t.accent})` }} />
              <div style={{ fontFamily: t.body, fontSize: 38, color: t.muted }}>Comenta</div>
              <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: Math.min(58, 460 / keyword.length) * t.scale, color: t.fg, textTransform: "uppercase" }}>{keyword}</div>
            </div>
          ) : (
            <div style={{ alignSelf: "flex-start", display: "inline-block", background: t.accent, color: t.onAccent, borderRadius: t.radius ? 999 : 0, padding: "30px 50px", marginTop: 10, fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 52 * t.scale, textTransform: t.upper ? "uppercase" : "none", boxShadow: `0 20px 60px ${t.accent}55` }}>{p.cta} →</div>
          )}
        </In>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 70, fontFamily: t.mono, fontSize: 22, letterSpacing: "0.08em", color: t.muted, textTransform: "uppercase" }}>{t.handle} · Publicidad</div>
    </AbsoluteFill>
  );
};

export const Poster: React.FC<{ id: string }> = ({ id }) => {
  const p = POSTERS.find((x) => x.id === id)!;
  const theme = THEMES[p.theme];
  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.bg }}>
        <Bg />
        <Inner p={p} />
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};
