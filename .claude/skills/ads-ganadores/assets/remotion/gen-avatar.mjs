// Genera con HeyGen los planos "a cámara" de Miriam usando la misma locución de ElevenLabs.
// Uso: HEYGEN_API_KEY=... node gen-avatar.mjs
// Guarda public/avatar/<anuncio>-<escena>.mp4 y src/data/avatar.json. Solo genera lo que falta.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.HEYGEN_API_KEY;
if (!KEY) throw new Error("Falta HEYGEN_API_KEY");

// anuncio → look de Miriam (talking photo) y escenas en las que habla a cámara
const PLAN = {
  // "id-del-anuncio": { look: "ID_DEL_TALKING_PHOTO_EN_HEYGEN", vertical: true, scenes: [0, 3] },
  // vertical: true si el look es 9:16; scenes: escenas (empezando en 0) donde tu avatar habla a cámara
};

const META = "src/data/avatar.json";
const meta = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};
mkdirSync("public/avatar", { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { "X-Api-Key": KEY, Accept: "application/json", ...(init.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${url}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j.data;
}

const jobs = [];
for (const [id, p] of Object.entries(PLAN)) {
  for (const i of p.scenes) {
    const out = `public/avatar/${id}-${i}.mp4`;
    if (meta[id]?.[i] && existsSync(out)) continue;
    const audio = readFileSync(`public/vo/${id}/${i}.mp3`);
    const asset = await api("https://upload.heygen.com/v1/asset", { method: "POST", headers: { "Content-Type": "audio/mpeg" }, body: audio });
    const dim = p.vertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
    const v = await api("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_inputs: [{ character: { type: "talking_photo", talking_photo_id: p.look, talking_style: "expressive", expression: "happy" }, voice: { type: "audio", audio_asset_id: asset.id } }],
        dimension: dim,
      }),
    });
    console.log(`${id} · escena ${i} · en cola (${v.video_id})`);
    jobs.push({ id, i, out, videoId: v.video_id, vertical: p.vertical });
  }
}

for (const job of jobs) {
  for (;;) {
    await sleep(10000);
    const s = await api(`https://api.heygen.com/v1/video_status.get?video_id=${job.videoId}`);
    if (s.status === "completed") {
      const buf = Buffer.from(await (await fetch(s.video_url)).arrayBuffer());
      writeFileSync(job.out, buf);
      (meta[job.id] ??= {})[job.i] = { vertical: job.vertical, videoId: job.videoId };
      writeFileSync(META, JSON.stringify(meta, null, 1));
      console.log(`${job.id} · escena ${job.i} · listo`);
      break;
    }
    if (s.status === "failed") { console.log(`${job.id} · escena ${job.i} · FALLÓ: ${JSON.stringify(s.error)}`); break; }
  }
}
writeFileSync(META, JSON.stringify(meta, null, 1));
