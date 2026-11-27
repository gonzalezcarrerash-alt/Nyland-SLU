// Renderiza los motion (MP4), los carruseles (JPG) y las imágenes estáticas (JPG).
// Uso: node render.mjs [--solo id1,id2] [--stills] [--videos] [--images] [--preview] [--skip-existing]
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const solo = args.includes("--solo") ? args[args.indexOf("--solo") + 1].split(",") : null;
const only = ["--stills", "--videos", "--images"].filter((a) => args.includes(a));
const want = (kind) => !only.length || only.includes(`--${kind}`);
const preview = args.includes("--preview"); // fotogramas sueltos para revisar
const skip = args.includes("--skip-existing");

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const d of ["out/motion", "out/carruseles", "out/imagenes", "out/preview"]) mkdirSync(d, { recursive: true });

const comps = await getCompositions(serveUrl);
const pick = (c) => !solo || solo.some((s) => c.id === s || c.id.startsWith(s + "-"));

for (const c of comps.filter(pick)) {
  const kind = c.height === 1350 ? "stills" : c.id.startsWith("img-") ? "images" : "videos";
  if (!want(kind)) continue;
  if (kind === "stills") {
    await renderStill({ composition: c, serveUrl, output: `out/carruseles/${c.id}.jpg`, frame: 149, imageFormat: "jpeg", jpegQuality: 88 });
    console.log("slide", c.id);
  } else if (kind === "images") {
    await renderStill({ composition: c, serveUrl, output: `out/imagenes/${c.id}.jpg`, frame: 59, imageFormat: "jpeg", jpegQuality: 90 });
    console.log("imagen", c.id);
  } else if (preview) {
    for (const fr of [20, Math.floor(c.durationInFrames * 0.3), Math.floor(c.durationInFrames * 0.55), Math.floor(c.durationInFrames * 0.8), c.durationInFrames - 5]) {
      await renderStill({ composition: c, serveUrl, output: `out/preview/${c.id}-${fr}.jpg`, frame: fr, imageFormat: "jpeg", jpegQuality: 70, scale: 0.4 });
    }
    console.log("preview", c.id);
  } else {
    const out = `out/motion/${c.id}.mp4`;
    if (skip && existsSync(out)) continue;
    await renderMedia({ composition: c, serveUrl, codec: "h264", crf: 24, audioBitrate: "160k", outputLocation: out, concurrency: 6 });
    console.log("video", c.id, (c.durationInFrames / 30).toFixed(1) + " s");
  }
}
