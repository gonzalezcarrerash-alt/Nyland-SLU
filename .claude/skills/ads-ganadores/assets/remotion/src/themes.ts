import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as instrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as jetbrains } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as spaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as plexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as archivo } from "@remotion/google-fonts/Archivo";
import { loadFont as spaceMono } from "@remotion/google-fonts/SpaceMono";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as garamond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as courier } from "@remotion/google-fonts/CourierPrime";
import { loadFont as redHat } from "@remotion/google-fonts/RedHatDisplay";
import { loadFont as redHatMono } from "@remotion/google-fonts/RedHatMono";
import { loadFont as syne } from "@remotion/google-fonts/Syne";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as dmMono } from "@remotion/google-fonts/DMMono";
import { loadFont as fraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as karla } from "@remotion/google-fonts/Karla";
import { loadFont as majorMono } from "@remotion/google-fonts/MajorMonoDisplay";
import { loadFont as workSans } from "@remotion/google-fonts/WorkSans";

const o = { subsets: ["latin"] as ["latin"] };
const F = {
  anton: anton("normal", { weights: ["400"], ...o }).fontFamily,
  instrument: instrument("italic", { weights: ["400"], ...o }).fontFamily,
  inter: inter("normal", { weights: ["400", "600", "700"], ...o }).fontFamily,
  jetbrains: jetbrains("normal", { weights: ["500"], ...o }).fontFamily,
  spaceGrotesk: spaceGrotesk("normal", { weights: ["500", "700"], ...o }).fontFamily,
  plexMono: plexMono("normal", { weights: ["500"], ...o }).fontFamily,
  archivo: archivo("normal", { weights: ["500", "900"], ...o }).fontFamily,
  spaceMono: spaceMono("normal", { weights: ["400", "700"], ...o }).fontFamily,
  playfair: playfair("normal", { weights: ["700", "900"], ...o }).fontFamily,
  garamond: garamond("normal", { weights: ["400", "600"], ...o }).fontFamily,
  courier: courier("normal", { weights: ["400", "700"], ...o }).fontFamily,
  redHat: redHat("normal", { weights: ["400", "500", "900"], ...o }).fontFamily,
  redHatMono: redHatMono("normal", { weights: ["500"], ...o }).fontFamily,
  syne: syne("normal", { weights: ["700", "800"], ...o }).fontFamily,
  manrope: manrope("normal", { weights: ["500", "700"], ...o }).fontFamily,
  dmMono: dmMono("normal", { weights: ["500"], ...o }).fontFamily,
  fraunces: fraunces("normal", { weights: ["600", "900"], ...o }).fontFamily,
  karla: karla("normal", { weights: ["400", "600"], ...o }).fontFamily,
  majorMono: majorMono("normal", { weights: ["400"], ...o }).fontFamily,
  workSans: workSans("normal", { weights: ["500", "700"], ...o }).fontFamily,
};
playfair("italic", { weights: ["700"], ...o });
fraunces("italic", { weights: ["600"], ...o });

export type Motion = "snap" | "smooth" | "bounce" | "glitch";
export type AccentStyle = "color" | "box" | "highlight" | "serif" | "italic";
export type BgStyle = "grid" | "dots" | "blobs" | "grain" | "paper" | "scan" | "blocks" | "news";

export type Theme = {
  id: string;
  kit: string;
  brand: string;
  handle: string;
  display: string;
  displayWeight: number;
  body: string;
  mono: string;
  serif?: string;
  upper: boolean;
  scale: number; // ajuste del cuerpo del titular según lo ancha que sea la fuente
  tracking: string;
  leading: number;
  bg: string;
  bg2: string;
  fg: string;
  muted: string;
  accent: string;
  onAccent: string;
  neon: string;
  radius: number;
  bgStyle: BgStyle;
  motion: Motion;
  accentStyle: AccentStyle;
};

const base = (t: Partial<Theme> & Pick<Theme, "id">): Theme => ({
  kit: "",
  brand: "",
  handle: "",
  display: F.inter,
  displayWeight: 700,
  body: F.inter,
  mono: F.jetbrains,
  upper: false,
  scale: 1,
  tracking: "-0.02em",
  leading: 1.02,
  bg: "#111",
  bg2: "#1b1b1b",
  fg: "#f5f5f5",
  muted: "#9a9a9a",
  accent: "#5B5BFF",
  onAccent: "#fff",
  neon: "#C5FF45",
  radius: 24,
  bgStyle: "grid",
  motion: "smooth",
  accentStyle: "color",
  ...t,
});

export const THEMES: Record<string, Theme> = {
  corporate: base({
    id: "corporate", kit: "Corporate Tech", brand: "Vértice IA", handle: "@vertice.ia",
    display: F.redHat, displayWeight: 900, body: F.redHat, mono: F.redHatMono,
    bg: "#0F1419", bg2: "#18222E", fg: "#F1F5F9", muted: "#8A9BB0", accent: "#0066FF", onAccent: "#fff", neon: "#00D4FF",
    radius: 22, bgStyle: "grid", motion: "smooth", accentStyle: "color", scale: 1,
  }),
  corporateLight: base({
    id: "corporateLight", kit: "Corporate Tech", brand: "Vértice IA", handle: "@vertice.ia",
    display: F.redHat, displayWeight: 900, body: F.redHat, mono: F.redHatMono,
    bg: "#F1F5F9", bg2: "#FFFFFF", fg: "#0F1419", muted: "#5B6B7F", accent: "#0066FF", onAccent: "#fff", neon: "#00B3D9",
    radius: 22, bgStyle: "grid", motion: "smooth", accentStyle: "color",
  }),
  brutal: base({
    id: "brutal", kit: "Brutalist", brand: "RAW/LAB", handle: "@rawlab.ia",
    display: F.archivo, displayWeight: 900, body: F.archivo, mono: F.spaceMono, upper: true,
    tracking: "-0.04em", leading: 0.92, scale: 1.05,
    bg: "#EFEFEF", bg2: "#FFFFFF", fg: "#000000", muted: "#555", accent: "#FF3B00", onAccent: "#000", neon: "#00FF00",
    radius: 0, bgStyle: "blocks", motion: "snap", accentStyle: "box",
  }),
  brutalYellow: base({
    id: "brutalYellow", kit: "Brutalist", brand: "RAW/LAB", handle: "@rawlab.ia",
    display: F.archivo, displayWeight: 900, body: F.archivo, mono: F.spaceMono, upper: true,
    tracking: "-0.04em", leading: 0.92, scale: 1.05,
    bg: "#000000", bg2: "#141414", fg: "#EFEFEF", muted: "#9a9a9a", accent: "#FFE600", onAccent: "#000", neon: "#FF3B00",
    radius: 0, bgStyle: "blocks", motion: "snap", accentStyle: "box",
  }),
  clean: base({
    id: "clean", kit: "Modern Clean", brand: "Línea", handle: "@linea.studio",
    display: F.spaceGrotesk, displayWeight: 700, body: F.inter, mono: F.plexMono,
    bg: "#F5F5F0", bg2: "#FFFFFF", fg: "#111111", muted: "#6b6b6b", accent: "#5B5BFF", onAccent: "#fff", neon: "#C5FF45",
    radius: 28, bgStyle: "dots", motion: "smooth", accentStyle: "highlight",
  }),
  cleanDark: base({
    id: "cleanDark", kit: "Modern Clean", brand: "Línea", handle: "@linea.studio",
    display: F.spaceGrotesk, displayWeight: 700, body: F.inter, mono: F.plexMono,
    bg: "#111111", bg2: "#1C1C1C", fg: "#F5F5F0", muted: "#9a9a9a", accent: "#C5FF45", onAccent: "#111", neon: "#5B5BFF",
    radius: 28, bgStyle: "dots", motion: "smooth", accentStyle: "color",
  }),
  playful: base({
    id: "playful", kit: "Playful", brand: "Pulpo Studio", handle: "@pulpo.studio",
    display: F.syne, displayWeight: 800, body: F.manrope, mono: F.dmMono, scale: 0.95,
    bg: "#FFF4E0", bg2: "#FFFFFF", fg: "#1F1A2E", muted: "#6b6478", accent: "#FF6B9D", onAccent: "#1F1A2E", neon: "#FFE45E",
    radius: 40, bgStyle: "blobs", motion: "bounce", accentStyle: "highlight",
  }),
  playfulDark: base({
    id: "playfulDark", kit: "Playful", brand: "Pulpo Studio", handle: "@pulpo.studio",
    display: F.syne, displayWeight: 800, body: F.manrope, mono: F.dmMono, scale: 0.95,
    bg: "#1F1A2E", bg2: "#2B2540", fg: "#FFF4E0", muted: "#b8b0c9", accent: "#FFE45E", onAccent: "#1F1A2E", neon: "#FF6B9D",
    radius: 40, bgStyle: "blobs", motion: "bounce", accentStyle: "color",
  }),
  editorial: base({
    id: "editorial", kit: "Editorial", brand: "Estudio Lumen", handle: "@estudio.lumen",
    display: F.anton, displayWeight: 400, body: F.inter, mono: F.jetbrains, serif: F.instrument, upper: true,
    tracking: "0em", leading: 0.95, scale: 1.18,
    bg: "#0A0A0A", bg2: "#171512", fg: "#F2EBDD", muted: "#a39c8f", accent: "#E94822", onAccent: "#0A0A0A", neon: "#E8FF00",
    radius: 4, bgStyle: "grain", motion: "smooth", accentStyle: "serif",
  }),
  warmth: base({
    id: "warmth", kit: "Warmth", brand: "Raíz Digital", handle: "@raiz.digital",
    display: F.fraunces, displayWeight: 600, body: F.karla, mono: F.dmMono, tracking: "-0.02em", leading: 1.05,
    bg: "#F5EAD7", bg2: "#FBF4E8", fg: "#2A1F18", muted: "#7a6a5a", accent: "#C77D2C", onAccent: "#fff", neon: "#9CB071",
    radius: 26, bgStyle: "paper", motion: "smooth", accentStyle: "italic",
  }),
  y2k: base({
    id: "y2k", kit: "Y2K Neo-Retro", brand: "Byte Club", handle: "@byteclub.ads",
    display: F.majorMono, displayWeight: 400, body: F.workSans, mono: F.spaceMono, scale: 0.78, tracking: "-0.01em", leading: 1.08,
    bg: "#0D0D1A", bg2: "#171730", fg: "#F0E8FF", muted: "#a59cc4", accent: "#FF00AA", onAccent: "#fff", neon: "#00FFAA",
    radius: 6, bgStyle: "scan", motion: "glitch", accentStyle: "color",
  }),
  serif: base({
    id: "serif", kit: "Serif Classic", brand: "Atlas Consultores", handle: "@atlas.consultores",
    display: F.playfair, displayWeight: 900, body: F.garamond, mono: F.courier, tracking: "-0.015em", leading: 1.02,
    bg: "#F5EFE3", bg2: "#FBF7EE", fg: "#1A1411", muted: "#6e6152", accent: "#8B1A1A", onAccent: "#F5EFE3", neon: "#D4A82B",
    radius: 2, bgStyle: "news", motion: "smooth", accentStyle: "italic",
  }),
};
