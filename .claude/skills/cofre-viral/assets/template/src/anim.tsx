import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

// Movimiento de retención: entra rápido, pasándose un poco del punto; sale todavía más rápido.
export const rapido = Easing.bezier(0.16, 1, 0.3, 1);
export const salto = Easing.bezier(0.34, 1.45, 0.5, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progreso 0→1 a partir de `inicio`, durante `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = rapido) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progreso de la salida (0 = en pantalla, 1 = ha salido), terminando en `ate`.
export const saindo = (t: number, ate: number, dur = 0.16) => prog(t, ate - dur, dur, saida);

// Entrada de pegatina: escala y opacidad. Al terminar la entrada, devuelve un transform vacío
// (el texto se queda dibujado sin más, sin capa de animación encima).
export const entradaAdesivo = (t: number, em: number, { dur = 0.26, de = 0.6, giro = 0 } = {}) => {
  const p = prog(t, em, dur, salto);
  const o = prog(t, em, Math.min(0.1, dur));
  if (t >= em + dur) return { opacity: 1, transform: giro ? `rotate(${giro}deg)` : undefined, visivel: true };
  return {
    opacity: o,
    transform: `scale(${de + (1 - de) * p}) rotate(${giro}deg)`,
    visivel: t >= em,
  };
};

// "Sello": llega más grande y se asienta (destacados, números)
export const carimbo = (t: number, em: number, giro = 0, dur = 0.2) => {
  if (t >= em + dur) return { opacity: 1, transform: giro ? `rotate(${giro}deg)` : undefined, visivel: true };
  const p = prog(t, em, dur, rapido);
  return { opacity: prog(t, em, 0.06), transform: `scale(${1.45 - 0.45 * p}) rotate(${giro}deg)`, visivel: t >= em };
};

// ——— tiempo de las palabras dichas, para los textos que se montan al ritmo de la voz ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Instante de cada palabra de `texto`: busca la misma secuencia en lo que se dice a partir de `em`;
// una palabra que no se ha dicho igual entra justo después de la anterior (ritmo de 0,14 s).
export const temposDoTexto = (texto: string, em: number, palavras: Palavra[], ate = Infinity): number[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= em - 0.3 && p.em < ate + 0.3);
  const tempos: number[] = [];
  let cursor = 0;
  let ultimo = em;
  for (const w of ws) {
    const alvo = nucleo(w);
    let achou = -1;
    for (let k = cursor; k < Math.min(fala.length, cursor + 4); k++) {
      if (nucleo(fala[k].w) === alvo) {
        achou = k;
        break;
      }
    }
    if (achou >= 0) {
      ultimo = Math.max(ultimo, fala[achou].em);
      cursor = achou + 1;
    } else ultimo = tempos.length ? ultimo + 0.14 : em;
    tempos.push(ultimo);
  }
  return tempos;
};

// Número en español de España: miles con punto también en los de 4 cifras (2.112) y decimales con
// coma (1,5). `useGrouping: "always"` porque es-ES no agrupa los de 4 cifras por defecto.
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("es-ES", { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: "always" } as unknown as Intl.NumberFormatOptions);
