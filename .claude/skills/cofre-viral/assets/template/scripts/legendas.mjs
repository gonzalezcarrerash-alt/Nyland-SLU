// Lista todas las líneas de subtítulos del plan, con el tiempo de cada una, sin renderizar nada.
// Sirve para encontrar cortes de línea malos, palabras sueltas y palabras erróneas antes del render.
//
// Uso:  node scripts/legendas.mjs
import { transform } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { exigirProjeto, lerJson, mmss } from "./comum.mjs";

exigirProjeto();
// la lógica es la misma que usa el vídeo (src/motor/frases.ts), solo que convertida para ejecutarse en Node
const { code } = await transform(readFileSync("src/motor/frases.ts", "utf8"), { loader: "ts", format: "esm" });
mkdirSync("work", { recursive: true });
const destino = path.resolve("work/.frases.mjs");
writeFileSync(destino, code);
const { montarFrases } = await import(`file://${destino}?v=${Date.now()}`);

const plano = lerJson("src/plano.json");
const frases = montarFrases(plano);
// palabras átonas del español que no deberían cerrar una línea (las mismas de src/motor/frases.ts)
const CURTAS = /^(a|al|ante|bajo|con|contra|de|del|desde|durante|e|el|en|entre|hacia|hasta|la|las|le|les|lo|los|mas|me|mediante|mi|mis|ni|nos|o|os|para|pero|por|que|se|si|sin|sino|sobre|su|sus|te|tras|tu|tus|u|un|una|unas|unos|y)$/i;
for (const f of frases) {
  const texto = f.palavras.map((p) => p.w).join(" ");
  const ultima = f.palavras[f.palavras.length - 1].w;
  const avisos = [];
  if (f.palavras.length === 1) avisos.push("palabra sola");
  if (CURTAS.test(ultima)) avisos.push(`termina en "${ultima}"`);
  console.log(`${mmss(f.de)} → ${mmss(f.ate)}  ${texto}${avisos.length ? `   [${avisos.join(", ")}]` : ""}`);
}
console.log(`\n${frases.length} línea(s). Las líneas de los tramos sin subtítulos (momentos) no aparecen aquí.`);
