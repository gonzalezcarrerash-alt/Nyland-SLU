// Paso 1: analiza el vídeo en bruto: lo mide, lo transcribe con tiempo por palabra,
// encuentra los silencios y propone los cortes. No modifica el vídeo.
//
// Uso:  node scripts/preparar.mjs "/ruta/del/video.mp4" [--idioma es] [--modelo large-v3-turbo]
// Genera: work/analise.json, work/cortes.json, work/medir-1..3.jpg (fotogramas con cuadrícula para medir la cara)
import { bundle } from "@remotion/bundler";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, ffprobe, gravarJson, medirVolume, mmss } from "./comum.mjs";

// 1.7.2: la última versión que compila solo con `make` y ya conoce el modelo turbo.
const VERSAO_WHISPER = "1.7.2";
// Se queda fuera del proyecto para que el modelo (1,6 GB) se descargue una sola vez.
const CACHE = path.join(os.homedir(), ".cache", "modelos-edicao");
const PASTA_WHISPER = path.join(CACHE, `whisper.cpp-${VERSAO_WHISPER}`);
const PASTA_MODELOS = path.join(CACHE, "modelos");

const { opcoes, posicionais } = argumentos();
const origem = posicionais[0] ? path.resolve(posicionais[0]) : null;
if (!origem || !existsSync(origem)) {
  console.error('Uso: node scripts/preparar.mjs "/ruta/del/video.mp4" [--idioma es] [--modelo large-v3-turbo]');
  process.exit(1);
}
exigirProjeto();
const idioma = opcoes.idioma ?? "es";
const modelo = opcoes.modelo ?? "large-v3-turbo";
mkdirSync("work", { recursive: true });

// 1. Medidas del vídeo
const info = JSON.parse(ffprobe(["-v", "error", "-print_format", "json", "-show_streams", "-show_format", origem]));
const v = info.streams.find((s) => s.codec_type === "video");
const a = info.streams.find((s) => s.codec_type === "audio");
if (!v || !a) throw new Error("El archivo tiene que tener vídeo y audio.");
const rotacao = Math.abs(Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0));
const deitado = rotacao === 90 || rotacao === 270;
const largura = deitado ? v.height : v.width;
const altura = deitado ? v.width : v.height;
const [num, den] = String(v.avg_frame_rate || v.r_frame_rate).split("/").map(Number);
const fps = den ? num / den : num;
const duracao = Number(info.format.duration);
const hdr = ["arib-std-b67", "smpte2084"].includes(v.color_transfer);

// 2. Silencios, con un umbral adaptado al volumen de la grabación
ffmpeg(["-y", "-i", origem, "-map", "0:a:0", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "work/audio.wav"]);
const volume = medirVolume(origem);
const limiar = Math.min(-28, Number(volume.input_thresh));
const { stderr } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", `silencedetect=noise=${limiar}dB:d=0.35`, "-f", "null", "-"]);
const silencios = [];
let inicio = null;
for (const linha of stderr.split("\n")) {
  const s = linha.match(/silence_start: ([\d.-]+)/);
  const e = linha.match(/silence_end: ([\d.-]+)/);
  if (s) inicio = Math.max(0, Number(s[1]));
  if (e && inicio !== null) {
    silencios.push({ de: inicio, ate: Number(e[1]) });
    inicio = null;
  }
}
if (inicio !== null) silencios.push({ de: inicio, ate: duracao });

// 3. Transcripción con tiempo por palabra, un tramo de voz («isla») cada vez.
// Si escucha el archivo entero, Whisper mete palabras dentro de las pausas y se inventa frases en el
// silencio; si escucha la voz seguida, junta tomas repetidas en una sola. Isla a isla, cada
// intento aparece por separado y con el tiempo correcto.
const TAXA = 16000;
const wav = readFileSync("work/audio.wav");
const pcm = wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
const ilhas = [];
let cursorFala = 0;
for (const s of [...silencios, { de: duracao, ate: duracao }]) {
  if (s.de - cursorFala > 0.2) {
    const de = Math.max(0, cursorFala - 0.2);
    const ate = Math.min(duracao, s.de + 0.2);
    const anterior = ilhas[ilhas.length - 1];
    if (anterior && de <= anterior.ate) anterior.ate = ate;
    else ilhas.push({ de, ate });
  }
  cursorFala = s.ate;
}

const gravarWav = (arquivo, dados) => {
  const c = Buffer.alloc(44);
  c.write("RIFF", 0);
  c.writeUInt32LE(36 + dados.length, 4);
  c.write("WAVEfmt ", 8);
  c.writeUInt32LE(16, 16);
  c.writeUInt16LE(1, 20);
  c.writeUInt16LE(1, 22);
  c.writeUInt32LE(TAXA, 24);
  c.writeUInt32LE(TAXA * 2, 28);
  c.writeUInt16LE(2, 32);
  c.writeUInt16LE(16, 34);
  c.write("data", 36);
  c.writeUInt32LE(dados.length, 40);
  writeFileSync(arquivo, Buffer.concat([c, dados]));
};

console.log(`Transcribiendo la voz en ${ilhas.length} bloque(s) (${modelo}, ${idioma})…`);
console.log("La primera vez se compila Whisper y se descarga el modelo (1,6 GB): tarda unos minutos.");
await installWhisperCpp({ to: PASTA_WHISPER, version: VERSAO_WHISPER, printOutput: false });
mkdirSync(PASTA_MODELOS, { recursive: true });
await downloadWhisperModel({ model: modelo, folder: PASTA_MODELOS, printOutput: false });

// Pausas cortas (desde 0,2 s): sirven para sacar palabras de dentro de una pausa y para
// redistribuir las palabras de un tramo en el que Whisper devolvió tiempos rotos
const pausasCurtas = [];
{
  const { stderr: saidaCurta } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", `silencedetect=noise=${limiar}dB:d=0.2`, "-f", "null", "-"]);
  let comeco = null;
  for (const linha of saidaCurta.split("\n")) {
    const a = linha.match(/silence_start: ([\d.-]+)/);
    const b = linha.match(/silence_end: ([\d.-]+)/);
    if (a) comeco = Math.max(0, Number(a[1]));
    if (b && comeco !== null) {
      pausasCurtas.push({ de: comeco, ate: Number(b[1]) });
      comeco = null;
    }
  }
}

// A veces Whisper devuelve rotos los tiempos de un tramo: varias palabras apretadas en
// centésimas de segundo y otra «durando» segundos. Entonces el corte descartaba palabras y los subtítulos
// salían fuera de tiempo. En esos tramos las palabras se redistribuyen por la voz del tramo (sin las
// pausas), en proporción a las sílabas: un error de ~0,1–0,2 s en vez de palabras perdidas.
const silabas = (w) => {
  // un número escrito en cifras ("1/4", "2007") se dice con varias sílabas
  const digitos = (w.match(/\d/g) ?? []).length;
  const vogais = (w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[aeiouy]+/gi) ?? []).length;
  return Math.max(1, vogais + Math.ceil(digitos * 1.5));
};
const temposQuebrados = (lista) => {
  if (lista.some((p) => p.ate - p.em > 1.5)) return true;
  let seguidas = 0;
  for (const p of lista) {
    seguidas = p.ate - p.em <= 0.06 ? seguidas + 1 : 0;
    if (seguidas >= 3) return true;
  }
  return false;
};
const redistribuir = (lista, de, ate) => {
  let partes = [{ de, ate }];
  for (const z of pausasCurtas) {
    partes = partes.flatMap((q) =>
      z.ate <= q.de || z.de >= q.ate
        ? [q]
        : [...(z.de > q.de ? [{ de: q.de, ate: z.de }] : []), ...(z.ate < q.ate ? [{ de: z.ate, ate: q.ate }] : [])],
    );
  }
  partes = partes.filter((q) => q.ate - q.de > 0.05);
  const total = partes.reduce((soma, q) => soma + q.ate - q.de, 0);
  if (total <= 0) return false;
  const pesos = lista.map((p) => silabas(p.w));
  const acum = [0];
  pesos.forEach((w, i) => acum.push(acum[i] + w));
  const ritmo = acum[acum.length - 1] / total; // sílabas por segundo de voz
  // Cada trozo de voz (entre pausas) recibe un grupo seguido de palabras: elige la división en la que
  // cada trozo queda con el ritmo más parecido al del tramo, y prefiere una pausa después de coma/punto
  const P = partes.length;
  const N = lista.length;
  const custo = (i, j, k) => {
    const d = partes[k].ate - partes[k].de;
    if (j === i) return d < 0.3 ? 0 : 4;
    let c = Math.log((acum[j] - acum[i]) / d / ritmo) ** 2;
    if (k < P - 1 && !/[,.;:!?…]$/.test(lista[j - 1].w)) c += 0.3;
    return c;
  };
  const melhor = Array.from({ length: P + 1 }, () => new Array(N + 1).fill(Infinity));
  const volta = Array.from({ length: P + 1 }, () => new Array(N + 1).fill(-1));
  melhor[0][0] = 0;
  for (let k = 0; k < P; k++)
    for (let i = 0; i <= N; i++) {
      if (!Number.isFinite(melhor[k][i])) continue;
      for (let j = i; j <= N; j++) {
        const v = melhor[k][i] + custo(i, j, k);
        if (v < melhor[k + 1][j]) {
          melhor[k + 1][j] = v;
          volta[k + 1][j] = i;
        }
      }
    }
  const cortes = [N];
  for (let k = P; k > 0; k--) cortes.unshift(volta[k][cortes[0]]);
  // dentro de cada trozo, las palabras se reparten el tiempo en proporción a las sílabas
  for (let k = 0; k < P; k++) {
    const [i, j] = [cortes[k], cortes[k + 1]];
    const d = partes[k].ate - partes[k].de;
    for (let n = i; n < j; n++) {
      const p = lista[n];
      p.em = Number((partes[k].de + ((acum[n] - acum[i]) / (acum[j] - acum[i])) * d + 0.001).toFixed(3));
      p.ate = Number(Math.max(partes[k].de + ((acum[n + 1] - acum[i]) / (acum[j] - acum[i])) * d, p.em + 0.05).toFixed(3));
    }
  }
  return true;
};

// frases que Whisper se inventa en tramos sin voz de verdad, en portugués y en español: «Subtítulos
// realizados por la comunidad de Amara.org», «Suscríbete al canal» o un «¡Suscríbete!» que es todo el texto del tramo
const ALUCINACAO = /amara\.org|legendas pela comunidade|inscreva-se no canal|subt[ií]tulos (realizados )?por la comunidad|subtitulado por la comunidad|suscr[ií]bete al canal|^[¡¿]*suscr[ií]bete[.!?,…]*$/i;
const palavras = [];
mkdirSync("work/ilhas", { recursive: true });
for (const [n, ilha] of ilhas.entries()) {
  const arquivo = path.resolve(`work/ilhas/${String(n).padStart(4, "0")}.wav`);
  // Whisper descarta el audio de menos de 1 s (una palabra suelta entre pausas volvía vacía):
  // al tramo corto se le añade silencio al final hasta 1,5 s. El tiempo de las palabras no cambia.
  const janela = { de: ilha.de, ate: ilha.ate };
  const trecho = pcm.subarray(Math.floor(ilha.de * TAXA) * 2, Math.floor(ilha.ate * TAXA) * 2);
  const completar = Math.max(0, Math.floor(1.5 * TAXA) * 2 - trecho.length);
  gravarWav(arquivo, Buffer.concat([trecho, Buffer.alloc(completar)]));
  const saida = await transcribe({
    inputPath: arquivo,
    whisperPath: PASTA_WHISPER,
    whisperCppVersion: VERSAO_WHISPER,
    model: modelo,
    modelFolder: PASTA_MODELOS,
    language: idioma,
    tokenLevelTimestamps: true,
    printOutput: false,
  });
  const { captions } = toCaptions({ whisperCppOutput: saida });
  const daIlha = [];
  for (const c of captions) {
    const texto = c.text;
    if (!texto.trim()) continue;
    const em = Number(Math.min(janela.ate, janela.de + c.startMs / 1000).toFixed(3));
    const ate = Number(Math.min(janela.ate, janela.de + c.endMs / 1000).toFixed(3));
    if (texto.startsWith(" ") || daIlha.length === 0) daIlha.push({ em, ate: Math.max(ate, em + 0.05), w: texto.trim() });
    else {
      const ultima = daIlha[daIlha.length - 1];
      ultima.w += texto.trim();
      ultima.ate = Math.max(ate, ultima.ate);
    }
  }
  // nada fuera del tramo (el silencio de relleno no tiene voz)
  const doTrecho = daIlha.filter((p) => p.em < ilha.ate);
  // el orden de las palabras es el de la transcripción; a veces los tiempos vuelven desordenados en palabras
  // cortas, así que cada palabra empieza después de la anterior y la anterior termina donde empieza esta
  const ultimaAntes = palavras[palavras.length - 1];
  doTrecho.forEach((p, k) => {
    const anterior = k > 0 ? doTrecho[k - 1] : ultimaAntes;
    if (anterior) {
      p.em = Number(Math.max(p.em, anterior.em + 0.02).toFixed(3));
      anterior.ate = Number(Math.min(Math.max(anterior.ate, anterior.em + 0.02), p.em).toFixed(3));
    }
    p.ate = Number(Math.max(p.ate, p.em + 0.05).toFixed(3));
  });
  if (doTrecho.length >= 2 && temposQuebrados(doTrecho) && redistribuir(doTrecho, ilha.de, ilha.ate)) {
    console.log(`  aviso: tiempos de Whisper rotos en ${mmss(ilha.de)}–${mmss(ilha.ate)}; palabras redistribuidas por la voz del tramo (compruébalo en los fotogramas)`);
  }
  // (probado: pasar el texto anterior como --prompt mejora alguna palabra suelta, pero adelanta
  // el tiempo de las palabras hasta 0,5 s; vale más el tiempo correcto: los errores de palabra van en `correcoes`)
  // un tramo corto que se queda solo en «Obrigado.», «Gracias.», «¡Gracias por ver!», «Adiós» o una muletilla suelta
  // (las del patrón de abajo, en portugués y en español) suele ser una respiración o un ruido completado con silencio
  const textoCurto = doTrecho.map((p) => p.w).join(" ");
  const inventado = ilha.ate - ilha.de < 0.9 && /^[¡¿]*(obrigad[oa]|e aí|aí|tchau|valeu|hum+|ah+|é|tá|(muchas )?gracias( por ver( el v[ií]deo)?)?|adi[oó]s|chao|hasta luego|eh+|mm+)[.!?,…]*$/i.test(textoCurto.trim());
  if (!ALUCINACAO.test(textoCurto) && !inventado) palavras.push(...doTrecho);
  if ((n + 1) % 10 === 0) console.log(`  ${n + 1}/${ilhas.length}`);
}
// Una palabra no empieza en mitad de una pausa: si el tiempo cayó dentro de una pausa, empieza cuando vuelve la voz
for (const p of palavras) {
  const pausa = pausasCurtas.find((z) => p.em > z.de + 0.03 && p.em < z.ate - 0.03);
  if (pausa) p.em = Number(Math.min(pausa.ate, p.ate - 0.03).toFixed(3));
}
palavras.forEach((p, k) => {
  const anterior = palavras[k - 1];
  if (anterior && p.em <= anterior.em) p.em = Number((anterior.em + 0.02).toFixed(3));
  if (anterior && anterior.ate > p.em) anterior.ate = p.em;
  p.ate = Number(Math.max(p.ate, p.em + 0.05).toFixed(3));
});
rmSync("work/ilhas", { recursive: true, force: true });
rmSync("work/audio.wav", { force: true });

// 4. Propuesta de cortes: un ítem por tramo de voz (entre pausas de 0,35 s o más).
// Un ítem por tramo deja cada intento por separado: basta con marcar "manter": false en los que salen.
// El cortar vuelve a juntar los tramos vecinos que se mantienen cuando la pausa entre ellos es natural.
const FOLGA_ANTES = 0.1;
const FOLGA_DEPOIS = 0.16;
const falas = [];
let cursor = 0;
for (const s of [...silencios, { de: duracao, ate: duracao }]) {
  if (s.de - cursor > 0.12) {
    falas.push({ de: Math.max(0, cursor - FOLGA_ANTES), ate: Math.min(duracao, s.de + FOLGA_DEPOIS) });
  }
  cursor = s.ate;
}
// el último tramo recibe un respiro al final, para que el vídeo no acabe encima de la última sílaba
if (falas.length > 0) falas[falas.length - 1].ate = Math.min(duracao, falas[falas.length - 1].ate + 0.45);

// frases dentro de cada tramo, con su tiempo de inicio, para dividir un tramo cuando solo vale una parte
const frasesDe = (lista) => {
  const frases = [];
  let atual = [];
  lista.forEach((p, i) => {
    atual.push(p);
    const prox = lista[i + 1];
    if (!prox || /[.?!…]$/.test(p.w) || prox.em - p.ate > 0.3) {
      frases.push({ em: Number(atual[0].em.toFixed(2)), texto: atual.map((x) => x.w).join(" ") });
      atual = [];
    }
  });
  return frases;
};
// cada palabra va al tramo más cercano (las que caen en el hueco entre dos tramos no desaparecen)
const distancia = (t, f) => (t < f.de ? f.de - t : t > f.ate ? t - f.ate : 0);
const donoDe = palavras.map((p) => {
  const meio = (p.em + p.ate) / 2;
  let melhor = 0;
  falas.forEach((f, k) => {
    if (distancia(meio, f) < distancia(meio, falas[melhor])) melhor = k;
  });
  return melhor;
});
// volumen medio (dB) de un tramo del audio de 16 kHz que se quedó en memoria
const volumeDb = (de, ate) => {
  const a = Math.max(0, Math.floor(de * TAXA));
  const b = Math.min(Math.floor(pcm.length / 2), Math.floor(ate * TAXA));
  let soma = 0;
  for (let i = a; i < b; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    soma += v * v;
  }
  return b > a ? 10 * Math.log10(soma / (b - a) + 1e-12) : -120;
};
const comTexto = falas.filter((_, k) => donoDe.includes(k)).map((f) => volumeDb(f.de, f.ate)).sort((x, y) => x - y);
const volumeDaFala = comTexto.length ? comTexto[Math.floor(comTexto.length / 2)] : -30;
const cortes = falas.map((f, k) => {
  const dela = palavras.filter((_, i) => donoDe[i] === k);
  const frases = frasesDe(dela);
  // sin palabras reconocidas: puede ser una respiración/ruido (sale) o una palabra corta y suelta que la
  // transcripción perdió, como un «Uno:» de una lista. Un tramo con volumen de voz se queda y pide comprobación.
  const semTexto = dela.length === 0;
  const longo = f.ate - f.de >= 0.7;
  const temVozDeFala = semTexto && volumeDb(f.de, f.ate) >= volumeDaFala - 9;
  const fica = !semTexto || longo || temVozDeFala;
  return {
    de: Number(f.de.toFixed(3)),
    ate: Number(f.ate.toFixed(3)),
    manter: fica,
    ...(semTexto && fica
      ? { conferir: longo ? "sin transcripción: escúchalo antes de quitarlo" : "palabra corta sin transcripción (p. ej.: \"Uno:\"): escúchala y, si es voz, pon la palabra en el plan" }
      : {}),
    texto: frases.map((x) => x.texto).join(" "),
    frases,
  };
});

// 5. Tres fotogramas del original (principio, medio y final) con una cuadrícula en fracciones encima,
// para medir dónde quedan la cara y la barbilla (y cuánto se mueve la persona)
mkdirSync("public/medir", { recursive: true });
const alturaQuadro = 960;
const larguraQuadro = Math.round((largura / altura) * alturaQuadro / 2) * 2;
[0.15, 0.5, 0.85].forEach((fracao, i) => {
  ffmpeg(["-y", "-ss", String(duracao * fracao), "-i", origem, "-frames:v", "1", "-vf", `scale=${larguraQuadro}:${alturaQuadro}`, `public/medir/quadro-${i + 1}.jpg`]);
});
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  for (const i of [1, 2, 3]) {
    const inputProps = { imagem: `medir/quadro-${i}.jpg`, largura: larguraQuadro, altura: alturaQuadro };
    const composition = await selectComposition({ serveUrl, id: "Medir", inputProps });
    await renderStill({ composition, serveUrl, frame: 0, output: `work/medir-${i}.jpg`, inputProps, imageFormat: "jpeg", logLevel: "error" });
  }
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
  rmSync("public/medir", { recursive: true, force: true });
}

gravarJson("work/analise.json", { origem, largura, altura, rotacao, fps, duracao, hdr, volume, palavras, silencios });
gravarJson("work/cortes.json", cortes);

console.log(`\nVídeo: ${largura}×${altura}, ${fps.toFixed(2)} fps, ${duracao.toFixed(1)} s${hdr ? ", HDR" : ""}`);
console.log(
  `Formato: ${
    largura > altura
      ? "horizontal: el cortar recorta alrededor de la cara"
      : "vertical"
  }`,
);
console.log(`\nTramos de voz (work/cortes.json); cada línea sangrada es una frase, con el tiempo en que empieza:`);
cortes.forEach((c, i) => {
  // una voz normal tiene de 2 a 4 palabras por segundo; mucho menos que eso suele esconder tomas repetidas
  const porSegundo = c.texto ? c.texto.split(" ").length / (c.ate - c.de) : 0;
  const aviso = c.manter && c.ate - c.de > 3 && porSegundo < 1.4 ? "  [comprobar: poca voz para la duración]" : "";
  const marca = c.conferir ? `  [${c.conferir}]` : c.manter ? "" : "  [sin voz, sale]";
  console.log(`${String(i + 1).padStart(3)}. ${mmss(c.de)} → ${mmss(c.ate)}${marca}${aviso}`);
  c.frases.forEach((f) => console.log(`        ${mmss(f.em)}  ${f.texto}`));
});
const mantido = cortes.filter((c) => c.manter).reduce((t, c) => t + c.ate - c.de, 0);
console.log(`\nSi no sale nada: ${mantido.toFixed(1)} s de ${duracao.toFixed(1)} s.`);
console.log("Para medir la cara y la barbilla: work/medir-1.jpg, -2 y -3 (la cuadrícula marca fracciones de 0,05 en 0,05).");
console.log(
  cortes.length === 1
    ? "Un solo tramo: la grabación es continua y no hay nada que cortar aparte de los extremos. Sigue con: node scripts/cortar.mjs"
    : 'Revisa work/cortes.json: marca "manter": false en los intentos repetidos o fallidos (se queda el último completo) y después ejecuta: node scripts/cortar.mjs',
);
