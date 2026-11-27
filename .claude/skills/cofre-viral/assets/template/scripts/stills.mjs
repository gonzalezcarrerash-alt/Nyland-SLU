// Paso 3: renderiza fotogramas de comprobación en out/stills (a la mitad de tamaño, para mirarlos rápido).
//
// Uso:  node scripts/stills.mjs 1.8 4.5 10.2        (tiempos en segundos)
//       node scripts/stills.mjs --momentos          (cada momento: en el medio y en los dos bordes)
//       node scripts/stills.mjs --guias             (3 fotogramas con las guías de cara, zona y subtítulos)
//       node scripts/stills.mjs --guias 12 30       (guías en tiempos concretos)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, lerJson } from "./comum.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();
let tempos = posicionais.map(Number).filter((n) => Number.isFinite(n));
const plano = lerJson("src/plano.json");
// todos los instantes marcados dentro de un momento: campos "em" y "...Em", a cualquier nivel
const instantes = (valor, chave = "") => {
  if (Array.isArray(valor)) return valor.flatMap((v) => instantes(v));
  if (valor && typeof valor === "object") return Object.entries(valor).flatMap(([k, v]) => instantes(v, k));
  return typeof valor === "number" && (chave === "em" || /Em$/.test(chave)) ? [valor] : [];
};
if (opcoes.momentos) {
  tempos = plano.momentos.flatMap((m) => {
    // los bordes muestran si los subtítulos desaparecen y vuelven en el sitio correcto
    const bordas = [Math.max(0, m.de - 0.25), Math.min(plano.duracao - 0.05, m.ate + 0.25)];
    const meio = m.de + (m.ate - m.de) * 0.5;
    // cada subpaso (ítem, opción, subrayado, número…) un instante después de que ocurra
    const passos = instantes(m).map((t) => Math.min(m.ate - 0.1, t + 0.7));
    return [bordas[0], meio, ...passos, bordas[1]];
  });
}
if (opcoes.guias && tempos.length === 0) tempos = [0.15, 0.5, 0.85].map((f) => plano.duracao * f);
tempos = [...new Set(tempos.map((t) => Number(Math.min(Math.max(0, t), plano.duracao - 0.05).toFixed(2))))].sort((a, b) => a - b);
if (tempos.length === 0) {
  console.error("Indica los tiempos (en segundos), --momentos o --guias.");
  process.exit(1);
}

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  const inputProps = opcoes.guias ? { plano, guias: true } : undefined;
  const composition = await selectComposition({ serveUrl, id: "Edicao", inputProps });
  // una tanda completa empieza limpia, para no confundir los fotogramas nuevos con los de una tanda anterior
  if (opcoes.momentos || (opcoes.guias && posicionais.length === 0)) rmSync("out/stills", { recursive: true, force: true });
  mkdirSync("out/stills", { recursive: true });
  for (const t of tempos) {
    const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)));
    const output = `out/stills/${opcoes.guias ? "guias-" : ""}t${t.toFixed(2).padStart(6, "0")}.jpg`;
    await renderStill({ composition, serveUrl, frame, output, inputProps, imageFormat: "jpeg", jpegQuality: 88, scale: 0.5, logLevel: "error" });
    console.log(output);
  }
} finally {
  // el bundle copia la carpeta public; borrarlo evita llenar el disco
  rmSync(serveUrl, { recursive: true, force: true });
}
