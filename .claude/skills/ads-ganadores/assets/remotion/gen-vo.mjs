// Genera la locución de cada escena con ElevenLabs (con tiempos por palabra para los subtítulos).
// Uso: ELEVENLABS_API_KEY=... node gen-vo.mjs [--solo id1,id2]
// Solo regenera las escenas cuyo texto cambió o que no tienen tiempos (todo queda en src/data/vo.json).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ADS } from "./src/data/ads.ts";

const VOICE = process.env.ELEVENLABS_VOICE_ID || "PEGA_AQUI_TU_VOICE_ID"; // la voz de tu marca en ElevenLabs
const FPS = 30;
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("Falta ELEVENLABS_API_KEY");
const args = process.argv.slice(2);
const solo = args.includes("--solo") ? args[args.indexOf("--solo") + 1].split(",") : null;

const META = "src/data/vo.json";
const meta = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};

/** Agrupa la alineación por caracteres en palabras con inicio y fin en segundos. */
function words(al) {
  const out = [];
  let cur = null;
  al.characters.forEach((ch, k) => {
    if (/\s/.test(ch)) { if (cur) { out.push(cur); cur = null; } return; }
    if (!cur) cur = { w: "", s: al.character_start_times_seconds[k], e: 0 };
    cur.w += ch;
    cur.e = al.character_end_times_seconds[k];
  });
  if (cur) out.push(cur);
  return out.map((x) => ({ w: x.w, s: Math.round(x.s * 100) / 100, e: Math.round(x.e * 100) / 100 }));
}

const jobs = [];
for (const [id, ad] of Object.entries(ADS)) {
  if (solo && !solo.includes(id)) continue;
  mkdirSync(`public/vo/${id}`, { recursive: true });
  meta[id] ??= [];
  for (const [i, s] of ad.scenes.entries()) {
    const file = `public/vo/${id}/${i}.mp3`;
    if (meta[id][i]?.text === s.vo && meta[id][i]?.words && existsSync(file)) continue;
    jobs.push({ id, i, s, file });
  }
}

// 4 peticiones a la vez
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { id, i, s, file } = jobs[next++];
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text: s.vo, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } }),
    });
    if (!r.ok) throw new Error(`${id} escena ${i}: ${r.status} ${await r.text()}`);
    const j = await r.json();
    writeFileSync(file, Buffer.from(j.audio_base64, "base64"));
    const sec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
    meta[id][i] = { text: s.vo, sec, frames: Math.ceil(sec * FPS), words: words(j.alignment) };
    console.log(`${id} · ${i} · ${sec.toFixed(2)} s`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
for (const [id, ad] of Object.entries(ADS)) if (meta[id]) meta[id].length = ad.scenes.length;
writeFileSync(META, JSON.stringify(meta));
console.log(`listo: ${jobs.length} locuciones nuevas`);
