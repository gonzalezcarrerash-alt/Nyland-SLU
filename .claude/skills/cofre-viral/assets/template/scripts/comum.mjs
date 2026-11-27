// Utilidades del motor. Usa el ffmpeg que ya viene con Remotion: el alumno no instala nada.
import { RenderInternals } from "@remotion/renderer";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const caminho = (type) =>
  RenderInternals.getExecutablePath({ type, indent: false, logLevel: "error", binariesDirectory: null });

const ambiente = () => {
  const lib = path.dirname(caminho("compositor"));
  if (process.platform === "darwin") return { ...process.env, DYLD_LIBRARY_PATH: lib };
  if (process.platform === "win32") return { ...process.env, PATH: `${lib};${process.env.PATH}` };
  return { ...process.env, LD_LIBRARY_PATH: lib };
};

const rodar = (type, args, { tolerarErro = false } = {}) => {
  const bin = caminho(type);
  RenderInternals.makeFileExecutableIfItIsNot(bin);
  const r = spawnSync(bin, args, { env: ambiente(), encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 && !tolerarErro) {
    const fim = String(r.stderr ?? "").trim().split("\n").slice(-12).join("\n");
    throw new Error(`${type} ha fallado (código ${r.status}):\n${fim}`);
  }
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
};

// ffmpeg escribe los informes (loudnorm, silencedetect) en stderr.
export const ffmpeg = (args, opcoes) => rodar("ffmpeg", ["-hide_banner", "-nostdin", ...args], opcoes);
export const ffprobe = (args) => rodar("ffprobe", args).stdout;

// Lee fotogramas en crudo uno tras otro, sin guardar el vídeo entero en memoria. `args` son las opciones
// de entrada y de filtro de ffmpeg; cada fotograma tiene que salir con `bytes` bytes. Llama a
// `aoQuadro(buffer, indice)` por cada fotograma; el buffer se reutiliza (cópialo si lo vas a guardar).
export const lerQuadros = (args, bytes, aoQuadro) =>
  new Promise((resolve, reject) => {
    const bin = caminho("ffmpeg");
    RenderInternals.makeFileExecutableIfItIsNot(bin);
    const p = spawn(bin, ["-hide_banner", "-nostdin", "-loglevel", "error", ...args, "-f", "image2pipe", "-c:v", "rawvideo", "pipe:1"], {
      env: ambiente(),
    });
    const quadro = Buffer.alloc(bytes);
    let cheio = 0;
    let indice = 0;
    let erro = "";
    let falhou = null;
    p.stdout.on("data", (pedaco) => {
      let k = 0;
      while (k < pedaco.length && !falhou) {
        const n = Math.min(bytes - cheio, pedaco.length - k);
        pedaco.copy(quadro, cheio, k, k + n);
        cheio += n;
        k += n;
        if (cheio === bytes) {
          try {
            aoQuadro(quadro, indice++);
          } catch (e) {
            falhou = e;
            p.kill();
          }
          cheio = 0;
        }
      }
    });
    p.stderr.on("data", (d) => {
      erro += d;
    });
    p.on("error", reject);
    p.on("close", (codigo) => {
      if (falhou) reject(falhou);
      else if (codigo !== 0) reject(new Error(`ffmpeg ha fallado (código ${codigo}):\n${erro.trim().split("\n").slice(-6).join("\n")}`));
      else resolve(indice);
    });
  });

export const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, "utf8"));
// Las listas solo de números (el rastro de la cara, la onda del audio…) van en una sola línea: el archivo
// sigue siendo fácil de leer y de editar.
export const gravarJson = (arquivo, dados) => {
  mkdirSync(path.dirname(arquivo), { recursive: true });
  const texto = JSON.stringify(dados, null, 2).replace(/\[\s*(-?[\d.e+-]+(?:,\s*-?[\d.e+-]+)*)\s*\]/g, (_, corpo) => `[${corpo.split(/,\s*/).join(", ")}]`);
  writeFileSync(arquivo, `${texto}\n`);
};

// Lee opciones con el formato --nombre valor; lo que sobra son argumentos posicionales.
// Estas no llevan valor (lo que va detrás de ellas es posicional):
const SEM_VALOR = new Set(["guias", "momentos", "manter-plano", "sem-rastro", "sem-ajuste", "desligar", "conferir", "forcar", "mapa", "folha", "limpar", "offline"]);
export const argumentos = (argv = process.argv.slice(2)) => {
  const opcoes = {};
  const posicionais = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const nome = argv[i].slice(2);
      const proximo = argv[i + 1];
      if (SEM_VALOR.has(nome) || proximo === undefined || proximo.startsWith("--")) opcoes[nome] = true;
      else opcoes[nome] = argv[++i];
    } else posicionais.push(argv[i]);
  }
  return { opcoes, posicionais };
};

export const exigirProjeto = () => {
  if (!existsSync("src/plano.json") || !existsSync("package.json")) {
    throw new Error("Ejecuta este script desde dentro de la carpeta del proyecto (la copia de la plantilla), no desde dentro de la skill.");
  }
};

export const mmss = (t) => {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(2).padStart(5, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
};

// Mide el volumen para normalizar a -14 LUFS (el estándar de las redes).
export const medirVolume = (arquivo) => {
  const { stderr } = ffmpeg(["-i", arquivo, "-map", "0:a:0", "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]);
  const inicio = stderr.lastIndexOf("{");
  const fim = stderr.lastIndexOf("}");
  return JSON.parse(stderr.slice(inicio, fim + 1));
};
