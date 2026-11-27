// Paso 4: renderiza el vídeo final y normaliza el audio a -14 LUFS (el estándar de las redes).
//
// Uso:  node scripts/render.mjs [out/nombre-del-video.mp4]
//
// Antes de renderizar, pasa la comprobación del plan (conferir.mjs) y se detiene si no lo aprueba.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, lerJson, medirVolume } from "./comum.mjs";
import { conferirPlano, tiposDoModelo } from "./conferir.mjs";

exigirProjeto();
const { posicionais, opcoes } = argumentos();

// antes de gastar minutos renderizando: ¿el plan es una edición de verdad? (references/adaptar.md)
{
  const plano = lerJson("src/plano.json");
  const modelo = existsSync("modelo.json") ? lerJson("modelo.json") : {};
  const r = conferirPlano(plano, modelo, tiposDoModelo());
  if (!r.ok && !opcoes.forcar) {
    console.error("El plan no ha pasado la comprobación (node scripts/conferir.mjs --mapa para verlo todo):");
    r.erros.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    console.error("\nCorrige el plan y vuelve a lanzar el render. No entregues una edición solo con subtítulos.");
    process.exit(1);
  }
  if (!r.ok) console.warn("Atención: renderizando con --forcar un plan rechazado en la comprobación. Díselo al usuario en la entrega.");
}
const saida = posicionais[0] ?? "out/video-editado.mp4";
// el bruto sale con audio sin comprimir: el AAC del render llega ~43 ms tarde respecto a la imagen;
// el AAC que se hace aquí al final queda a tiempo
const bruto = path.join(path.dirname(saida), ".render-sem-normalizar.mov");
mkdirSync(path.dirname(saida), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  const composition = await selectComposition({ serveUrl, id: "Edicao" });
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 17,
    audioCodec: "pcm-16",
    imageFormat: "jpeg",
    jpegQuality: 92,
    // sin esto el archivo sale marcado como "full range" y los colores cambian en algunos reproductores
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    outputLocation: bruto,
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== ultimo) {
        ultimo = pct;
        console.log(`render ${pct}%`);
      }
    },
  });
} finally {
  // el bundle copia la carpeta public; borrarlo evita llenar el disco
  rmSync(serveUrl, { recursive: true, force: true });
}

const m = medirVolume(bruto);
const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
ffmpeg(["-y", "-i", bruto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
rmSync(bruto, { force: true });
console.log(`\nListo: ${path.resolve(saida)}  (audio ${m.input_i} → -14 LUFS)`);
