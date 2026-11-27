import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { THEMES } from "./themes";
import { Bg, Body, Chrome, In, Mono, Rich, ThemeCtx, useExit, useTheme } from "./ui";
import { Scene } from "./scenes";
import { ADS, type VoScene } from "./data/ads";
import VO from "./data/vo.json";
import AVATAR from "./data/avatar.json";

const VO_START = 6; // la voz entra 6 fotogramas después del corte
const vo = VO as Record<string, { frames: number; words?: Word[] }[]>;
const avatar = AVATAR as Record<string, Record<string, { vertical: boolean }>>;

/** Cada escena dura lo que dura su locución (más aire), sin bajar del 80 % de su duración de diseño. */
export const sceneDurations = (id: string) =>
  ADS[id].scenes.map((s, i) => Math.max(Math.round(s.dur * 0.8), (vo[id]?.[i]?.frames ?? 0) + VO_START + 16));
export const adDuration = (id: string) => sceneDurations(id).reduce((a, b) => a + b, 0);

/** Miriam a cámara (HeyGen) con el titular de la escena encima, en el estilo de la marca. */
const AvatarScene: React.FC<{ id: string; i: number; s: VoScene; dur: number }> = ({ id, i, s, dur }) => {
  const t = useTheme();
  const o = useExit(dur);
  const text = s.type === "statement" ? s.text : s.type === "cta" ? s.headline : "";
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Sequence from={VO_START} layout="absolute-fill">
        <OffthreadVideo src={staticFile(`avatar/${id}-${i}.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${t.bg}66 0%, transparent 18%, transparent 52%, ${t.bg}ee 78%, ${t.bg} 100%)` }} />
      <AbsoluteFill style={{ padding: "0 90px 190px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 26 }}>
        {s.type === "statement" && s.kicker && <In><Mono style={{ color: t.accent }}>{s.kicker}</Mono></In>}
        <Rich text={text} size={Math.round(Math.min(118, 2600 / Math.max(14, text.length)) * t.scale)} d={8} />
        {s.type === "cta" && s.keyword && (
          <In d={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, background: t.bg2, border: `3px solid ${t.accent}`, borderRadius: t.radius ? 999 : 0, padding: "22px 30px" }}>
              <div style={{ fontFamily: t.body, fontSize: 38, color: t.muted }}>Comenta</div>
              <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: Math.min(56, 470 / s.keyword.length) * t.scale, color: t.fg, textTransform: "uppercase" }}>{s.keyword}</div>
            </div>
          </In>
        )}
        {s.type === "cta" && s.button && (
          <In d={20}>
            <div style={{ alignSelf: "flex-start", background: t.accent, color: t.onAccent, borderRadius: t.radius ? 999 : 0, padding: "28px 46px", fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 50 * t.scale, textTransform: t.upper ? "uppercase" : "none", boxShadow: `0 20px 60px ${t.accent}66` }}>{s.button} →</div>
          </In>
        )}
        {s.type === "cta" && s.sub && <In d={26}><Body style={{ color: t.muted, fontSize: 36 }}>{s.sub}</Body></In>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type Word = { w: string; s: number; e: number };
/** Subtítulos de 3 palabras con la palabra que suena resaltada en el color de la marca. */
const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const now = (f - VO_START) / 30;
  if (!words?.length || now < 0) return null;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 3 || /[.,;:?!…]$/.test(w.w)) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  let ci = -1;
  for (let k = 0; k < chunks.length; k++) if (now >= chunks[k][0].s - 0.05) ci = k;
  const ch = chunks[ci];
  if (!ch || now > ch[ch.length - 1].e + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 150, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", background: `${t.bg}e6`, border: `2px solid ${t.fg}1f`, borderRadius: Math.max(t.radius, 14), padding: "16px 26px", backdropFilter: "blur(8px)" }}>
        {ch.map((w, k) => {
          const on = now >= w.s - 0.03 && now <= w.e + 0.08;
          return <span key={k} style={{ fontFamily: t.body, fontWeight: 800, fontSize: 50, lineHeight: 1.15, color: on ? t.onAccent : t.fg, background: on ? t.accent : "transparent", borderRadius: 10, padding: "0 10px", textTransform: t.upper ? "uppercase" : "none" }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

/** Barrido de color entre escenas. */
const Wipe: React.FC = () => {
  const t = useTheme();
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 14], [-140, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, bottom: -200, width: "120%", left: `${x}%`, background: t.accent, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: -200, bottom: -200, width: "8%", left: `${x - 12}%`, background: t.neon, transform: "skewX(-14deg)" }} />
    </AbsoluteFill>
  );
};

export const Ad: React.FC<{ id: string }> = ({ id }) => {
  const ad = ADS[id];
  const theme = THEMES[ad.theme];
  const durs = sceneDurations(id);
  const total = durs.reduce((a, b) => a + b, 0);
  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.bg }}>
        <Bg />
        <Series>
          {ad.scenes.map((s, i) => {
            const onCam = !!avatar[id]?.[i];
            return (
              <Series.Sequence key={i} durationInFrames={durs[i]} name={`${i + 1} · ${onCam ? "Miriam a cámara" : s.type}`}>
                {onCam ? <AvatarScene id={id} i={i} s={s} dur={durs[i]} /> : <Scene s={{ ...s, dur: durs[i] }} />}
                {!onCam && vo[id]?.[i] && (
                  <Sequence from={VO_START} name="Locución">
                    <Audio src={staticFile(`vo/${id}/${i}.mp3`)} />
                  </Sequence>
                )}
                {!onCam && <Captions words={vo[id]?.[i]?.words ?? []} />}
              </Series.Sequence>
            );
          })}
        </Series>
        {durs.slice(0, -1).map((_, i) => {
          const at = durs.slice(0, i + 1).reduce((a, b) => a + b, 0);
          return <Sequence key={`w${i}`} from={at - 7} durationInFrames={15} name="Transición"><Wipe /></Sequence>;
        })}
        <Chrome tag={ad.tag} total={total} />
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};
