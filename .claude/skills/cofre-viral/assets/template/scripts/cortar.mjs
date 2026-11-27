// Paso 3: aplica los cortes de work/cortes.json, encuadra y genera el vídeo de trabajo
// (public/base.mp4) más el esqueleto del plan (src/plano.json), con las palabras ya en la
// línea de tiempo cortada y la cara/zona calculadas.
//
// Uso:  node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.32 --queixo-y 0.42 [--recorte 4:5] [--manter-plano]
//   --rosto-x / --rosto-y  centro de la cara en el vídeo ORIGINAL, en fracciones (0 = izquierda/arriba, 1 = derecha/abajo).
//                          Mídelo en work/medir-*.jpg, que ya vienen con la cuadrícula.
//   --queixo-y             altura de la barbilla en el original, en fracción. Con ella el script decide el recorte y
//                          coloca los componentes justo debajo de la barbilla.
//   --recorte              fuerza 9:16 (pantalla completa), 3:4, 4:5 o 1:1. Sin ella: el horizontal pasa a 3:4; el vertical
//                          se queda en 9:16, salvo que la barbilla esté demasiado baja (entonces pasa a 3:4 y sube a la persona).
//                          Fuera del 9:16 el vídeo ocupa la parte de arriba y la de abajo pasa a fondo oscuro.
//   --manter-plano         rehace los cortes sin borrar momentos, marca y correcciones ya escritos en el plan
//   --sem-ajuste           usa el --rosto-x tal como se midió (sin ajustar el centro por la simetría de la cara)
//   --sem-rastro           no sigue la cara (la persona se queda quieta en el encuadre)
//
// Al final, el script sigue la cara por todo el vídeo (scripts/rastrear.mjs) y guarda el recorrido en
// `rosto.rastro`: la caja de la persona acompaña a la cara cuando se mueve. El seguimiento también mide el
// centro real de la cara (por la simetría); si el --rosto-x leído en la cuadrícula falló, el corte se rehace
// una vez con la cara en el centro.
import { existsSync, mkdirSync } from "node:fs";
import { argumentos, exigirProjeto, ffmpeg, ffprobe, gravarJson, lerJson, mmss } from "./comum.mjs";
import { ajustarCentro, rastrearNoPlano } from "./rastrear.mjs";

exigirProjeto();
const { opcoes } = argumentos();
const analise = lerJson("work/analise.json");
const { largura: L, altura: A } = analise;
const horizontal = L > A;
const rx = Number(opcoes["rosto-x"] ?? 0.5);
const ry = Number(opcoes["rosto-y"] ?? (horizontal ? 0.4 : 0.3));
const qy = Number(opcoes["queixo-y"] ?? ry + (horizontal ? 0.16 : 0.1));
if (![rx, ry, qy].every((v) => v >= 0 && v <= 1)) throw new Error("--rosto-x, --rosto-y y --queixo-y son fracciones entre 0 y 1.");

// Tramos que se mantienen. Los vecinos con una pausa natural entre ellos pasan a ser un solo tramo (sin corte).
const JUNTA_SE_PAUSA_MENOR = 0.3;
const segmentos = [];
lerJson("work/cortes.json").forEach((c, i) => {
  if (c.manter === false || c.ate - c.de <= 0.08) return;
  const ultimo = segmentos[segmentos.length - 1];
  const vizinho = ultimo && ultimo.indice === i - 1 && c.de - ultimo.ate < JUNTA_SE_PAUSA_MENOR;
  if (vizinho) {
    ultimo.ate = c.ate;
    ultimo.indice = i;
  } else segmentos.push({ de: c.de, ate: c.ate, indice: i });
});
if (segmentos.length === 0) throw new Error("No hay ningún tramo marcado para mantener en work/cortes.json.");

// Recorte: elige el formato y la ventana del original alrededor de la cara
const FORMATOS = {
  "9:16": { alvo: 9 / 16, altura: 1920 },
  "3:4": { alvo: 3 / 4, altura: 1440 },
  "4:5": { alvo: 4 / 5, altura: 1350 },
  "1:1": { alvo: 1, altura: 1080 },
};
const QUEIXO_IDEAL = 800; // px en el fotograma final: deja libre la altura del pecho para los componentes
// parte de arriba de la cabeza estimada en el original (fracción): por encima del centro de la cara cabe ~1,3× la distancia hasta la barbilla
const topoCabeca = Math.max(0, ry - (qy - ry) * 1.3);
// El modelo puede fijar el recorte en modelo.json (en la raíz del proyecto), por ejemplo
// { "recorte": { "vertical": "9:16" } } en modelos que recolocan a la persona y no
// necesitan espacio debajo de la barbilla. Sin eso: en 9:16 completo, una barbilla por debajo de ~47 %
// de la altura empujaría los componentes hacia la interfaz de la app, así que pasa a 3:4.
const doModelo = existsSync("modelo.json") ? (lerJson("modelo.json").recorte ?? {}) : {};
const automatico = horizontal ? (doModelo.horizontal ?? "3:4") : (doModelo.vertical ?? (qy > 0.47 ? "3:4" : "9:16"));
const escolhido = opcoes.recorte ?? automatico;
if (!FORMATOS[escolhido]) throw new Error("--recorte acepta 9:16, 3:4, 4:5 o 1:1.");
const { alvo, altura: videoAltura } = FORMATOS[escolhido];
const fps = analise.fps >= 49 ? Math.round(analise.fps / 2) : Math.round(analise.fps);

// La ventana del original con la cara en `rx` en el centro (en lo posible), el vídeo de trabajo y dónde
// caen la cara y la barbilla en el fotograma final de 1080×1920.
const recortar = (rx) => {
  const larguraMaxima = Math.min(L, A * alvo);
  // la ventana más ancha que todavía deja la cara en el centro…
  let w = Math.min(2 * Math.min(rx * L, (1 - rx) * L), larguraMaxima);
  // …pero sin acercar demasiado solo para centrar (pierde definición)
  w = Math.floor(Math.max(w, 0.78 * larguraMaxima) / 2) * 2;
  const h = Math.min(A, Math.floor(w / alvo / 2) * 2);
  const x0 = Math.round(Math.min(L - w, Math.max(0, rx * L - w / 2)));
  // Grabación muy cerca de la cámara: con la barbilla en el sitio ideal, la parte de arriba de la cabeza se saldría del fotograma.
  // Baja la barbilla hasta 120 px para salvar la cabeza; más que eso invadiría la zona de los componentes,
  // y entonces se queda el corte de la frente (lo normal en un vídeo selfie; las ventanas del modelo muestran la cabeza).
  const cabecaNoQuadro = ((qy - topoCabeca) * A / h) * videoAltura;
  const queixoAlvo = Math.min(Math.max(QUEIXO_IDEAL, cabecaNoQuadro + 40), QUEIXO_IDEAL + 120);
  const y0 = Math.round(Math.min(A - h, Math.max(0, qy * A - (queixoAlvo / videoAltura) * h)));
  const rosto = {
    x: Number(((rx * L - x0) / w).toFixed(3)),
    y: Number((((ry * A - y0) / h) * videoAltura / 1920).toFixed(3)),
  };
  const queixoFinal = ((qy * A - y0) / h) * videoAltura;
  const topo = Math.round(Math.min(1100, Math.max(900, queixoFinal + 170)));
  const testaCortada = cabecaNoQuadro + 40 > queixoFinal + 1;
  return { w, h, x0, y0, rosto, queixoFinal, testaCortada, zona: { topo, altura: Math.min(465, 1508 - topo) }, ampliacao: videoAltura / h };
};

// Cada tramo entra como una lectura separada del mismo archivo; el concat lo junta todo.
const codificarBase = (c) => {
  const entradas = segmentos.flatMap((s) => ["-ss", String(s.de), "-t", String((s.ate - s.de).toFixed(3)), "-i", analise.origem]);
  const pares = segmentos.map((_, i) => `[${i}:v:0][${i}:a:0]`).join("");
  const montar = (tonemap) =>
    `${pares}concat=n=${segmentos.length}:v=1:a=1[v][a];[v]crop=${c.w}:${c.h}:${c.x0}:${c.y0},${tonemap}scale=1080:${videoAltura},format=yuv420p[vo]`;
  const codificar = (grafo) => [
    "-y",
    ...entradas,
    "-filter_complex",
    grafo,
    "-map",
    "[vo]",
    "-map",
    "[a]",
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-crf",
    "17",
    "-preset",
    "veryfast",
    "-g",
    String(fps),
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "public/base.mp4",
  ];
  mkdirSync("public", { recursive: true });
  const HDR_PARA_SDR = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,";
  if (analise.hdr) {
    const r = ffmpeg(codificar(montar(HDR_PARA_SDR)), { tolerarErro: true });
    if (!r.ok) {
      console.log("Aviso: no he podido convertir el HDR; los colores pueden salir lavados. Si pasa, graba sin HDR.");
      ffmpeg(codificar(montar("")));
    }
  } else ffmpeg(codificar(montar("")));
};

let corte = recortar(rx);
console.log(`Cortando ${segmentos.length} tramo(s)…`);
codificarBase(corte);

// Palabras en la línea de tiempo cortada
const palavras = [];
const cortesEm = [];
let deslocamento = 0;
for (const s of segmentos) {
  if (deslocamento > 0) cortesEm.push(Number(deslocamento.toFixed(2)));
  for (const p of analise.palavras) {
    const meio = (p.em + p.ate) / 2;
    if (meio < s.de || meio > s.ate) continue;
    const em = Math.max(s.de, p.em) - s.de + deslocamento;
    const ate = Math.min(s.ate, p.ate) - s.de + deslocamento;
    palavras.push({ em: Number(em.toFixed(2)), ate: Number(Math.max(ate, em + 0.06).toFixed(2)), w: p.w });
  }
  deslocamento += s.ate - s.de;
}
// palabra que toca un tramo mantenido pero se ha quedado fuera (tiempo de Whisper sospechoso): avisa
const perdidas = analise.palavras.filter((p) => {
  const meio = (p.em + p.ate) / 2;
  if (segmentos.some((s) => meio >= s.de && meio <= s.ate)) return false;
  return segmentos.some((s) => Math.min(s.ate, p.ate) - Math.max(s.de, p.em) >= 0.05);
});
if (perdidas.length) {
  console.log(`Aviso: ${perdidas.length} palabra(s) en el borde de un tramo mantenido se han quedado fuera: ${perdidas.map((p) => `"${p.w}" (${p.em.toFixed(2)} s)`).join(", ")}.`);
  console.log("Si se dijeron en el tramo mantenido, comprueba su tiempo en work/analise.json.");
}
// la duración que vale es la del vídeo (al audio le pueden sobrar unas centésimas)
const medida = JSON.parse(ffprobe(["-v", "error", "-print_format", "json", "-show_streams", "-show_format", "public/base.mp4"]));
const faixaDeVideo = medida.streams.find((x) => x.codec_type === "video");
const duracao = Number(faixaDeVideo.duration ?? medida.format.duration);

const anterior = opcoes["manter-plano"] && existsSync("src/plano.json") ? lerJson("src/plano.json") : {};
const gravarPlano = (c) =>
  gravarJson("src/plano.json", {
    // los campos propios del modelo (zonas, ancho de la cara…) pasan tal cual; los de abajo se recalculan
    ...anterior,
    video: "base.mp4",
    fps,
    largura: 1080,
    altura: 1920,
    duracao: Number((Math.floor(duracao * fps) / fps).toFixed(3)),
    videoAltura,
    rosto: c.rosto,
    zona: c.zona,
    marca: anterior.marca ?? { nome: "", area: "" },
    sfx: anterior.sfx ?? true,
    cortesEm,
    ...(anterior.enquadramentos?.length ? { enquadramentos: anterior.enquadramentos } : {}),
    momentos: anterior.momentos ?? [],
    semLegenda: anterior.semLegenda ?? [],
    correcoes: anterior.correcoes ?? {},
    palavras,
  });
gravarPlano(corte);
gravarJson("work/palavras.json", palavras);

// Sigue la cara por todo el vídeo: la caja de la persona la acompaña cuando se mueve.
// Si el seguimiento no es fiable, el plan se queda con la cara fija.
if (!opcoes["sem-rastro"]) {
  console.log("\nSiguiendo la cara por el vídeo…");
  const seguir = (c) => rastrearNoPlano({ larguraEstimada: (c.queixoFinal - c.rosto.y * 1920) / 0.66 / 1080, ajustarCentro: false });
  let r = await seguir(corte);
  // el --rosto-x leído en la cuadrícula falló el centro de la cara: rehace el corte una vez, con ella en el centro
  const medido = r?.relatorio;
  if (!opcoes["sem-ajuste"] && medido?.centroPorSimetria && Math.abs(medido.centroX - corte.rosto.x) > 0.025) {
    const rxReal = Number(((corte.x0 + medido.centroX * corte.w) / L).toFixed(3));
    const novo = recortar(rxReal);
    if (Math.abs(novo.x0 - corte.x0) >= 0.01 * corte.w || Math.abs(novo.w - corte.w) >= 0.01 * corte.w) {
      console.log(`El centro de la cara está en x ${rxReal} del original (la cuadrícula decía ${rx}). Rehaciendo el corte con la cara en el centro…`);
      corte = novo;
      codificarBase(corte);
      gravarPlano(corte);
      r = await seguir(corte);
    }
  }
  // la diferencia que quede (el recorte no tenía adónde ir) se ajusta en el plan
  if (!opcoes["sem-ajuste"]) ajustarCentro(r?.relatorio);
}
const rostoFinal = lerJson("src/plano.json").rosto;
const { queixoFinal, zona, ampliacao } = corte;

console.log(`\nVídeo de trabajo: public/base.mp4 — 1080×${videoAltura} (recorte ${escolhido}), ${fps} fps, ${duracao.toFixed(2)} s`);
if (ampliacao > 1.5) {
  console.log(`Aviso: el original se ha ampliado ${ampliacao.toFixed(1)}× para que quepa; puede verse menos nítido.`);
}
console.log(
  `Cara en el fotograma: x ${rostoFinal.x}, y ${rostoFinal.y}${rostoFinal.rastro ? " (seguida fotograma a fotograma)" : " (fija)"} · barbilla en ${Math.round(queixoFinal)} px · zona a partir de ${zona.topo} px`,
);
if (corte.testaCortada) {
  console.log("Aviso: la grabación está muy cerca de la cámara; a pantalla completa la parte de arriba de la cabeza queda un poco cortada (normal en un vídeo selfie). En las ventanas y marcos del modelo la cabeza sale entera.");
}
if (queixoFinal + 60 > zona.topo) {
  console.log("Aviso: la barbilla ha quedado muy cerca de la zona. Prueba con --recorte 4:5 (o 1:1) para subir y alejar a la persona.");
}
console.log(`Cortes en: ${cortesEm.map(mmss).join(", ") || "ninguno"}`);
console.log("\nVoz (tiempo en el vídeo cortado):");
let frase = [];
palavras.forEach((p, i) => {
  frase.push(p);
  const prox = palavras[i + 1];
  if (!prox || /[.?!]$/.test(p.w) || prox.em - p.ate > 0.6) {
    console.log(`${mmss(frase[0].em)} → ${mmss(p.ate)}  ${frase.map((x) => x.w).join(" ")}`);
    frase = [];
  }
});
console.log("\nEl tiempo exacto de cada palabra está en work/palavras.json.");
console.log("Siguiente paso: node scripts/stills.mjs --guias   (comprueba cara, zona y subtítulos encima del vídeo)");
