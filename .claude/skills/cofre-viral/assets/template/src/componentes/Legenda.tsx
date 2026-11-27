// Subtítulo karaoke de Viral: de 1 a 3 palabras cada vez, en mayúsculas, en una placa oscura;
// la palabra que se está diciendo va en una tarja de color que se desliza de una palabra a otra.
import { useMemo } from "react";
import { interpolate } from "remotion";
import { prog, rapido } from "../anim";
import { esAtona, larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, fonte } from "../tema";

const S_MAX = 66;
const LARGURA = 920;
const F = { peso: 900 as const, caixaAlta: true };

type Grupo = { de: number; ate: number; palavras: Palavra[] };

// Corta cada frase del subtítulo en pantallas cortas (3 palabras como mucho, que quepan en una línea).
// Ninguna pantalla acaba en palabra átona («LA FREIDORA | DE AIRE», no «LA FREIDORA DE | AIRE»).
export const gruposDaLegenda = (frases: Frase[]): Grupo[] => {
  const grupos: Grupo[] = [];
  frases.forEach((f, fi) => {
    const daFrase: Palavra[][] = [];
    let atual: Palavra[] = [];
    const fechar = () => {
      if (atual.length) daFrase.push(atual);
      atual = [];
    };
    f.palavras.forEach((p) => {
      const tentativa = [...atual, p].map((x) => x.w).join(" ");
      const larga = larguraTexto(tentativa, S_MAX, F) > LARGURA - 80;
      if (atual.length && (atual.length >= 3 || larga)) {
        // las átonas del final bajan a la pantalla siguiente; si así la pantalla se quedaría en una sola
        // palabra y caben cuatro, se alarga a cuatro
        const resto = [...atual];
        const baixa: Palavra[] = [];
        while (resto.length > 1 && esAtona(resto[resto.length - 1].w)) baixa.unshift(resto.pop() as Palavra);
        const alarga = baixa.length > 0 && resto.length === 1 && atual.length === 3 && !larga;
        if (!alarga) {
          atual = resto;
          fechar();
          atual = baixa;
        }
      }
      atual.push(p);
      if (/[.?!…,;:]$/.test(p.w) && atual.length >= 2) fechar();
    });
    fechar();
    // si aun así queda una pantalla acabada en átona, se une a la siguiente
    for (let k = daFrase.length - 2; k >= 0; k--) {
      const g = daFrase[k];
      if (esAtona(g[g.length - 1].w)) daFrase.splice(k, 2, [...g, ...daFrase[k + 1]]);
    }
    // cada pantalla se queda hasta que empieza la siguiente; la última, hasta el final de la frase (sin invadir la siguiente)
    const proxima = frases[fi + 1];
    const fimDaFrase = Math.min(f.ate + 0.25, proxima ? proxima.de - 0.02 : f.ate + 0.25);
    daFrase.forEach((ps, k) => {
      const seguinte = daFrase[k + 1];
      grupos.push({ de: ps[0].em, ate: seguinte ? seguinte[0].em - 0.02 : fimDaFrase, palavras: ps });
    });
  });
  return grupos;
};

// `bloqueios`: inicios de los momentos sin subtítulo (la pantalla del subtítulo desaparece cuando empieza uno de ellos)
export const Legenda: React.FC<{ t: number; frases: Frase[]; y: number; bloqueios?: number[] }> = ({ t, frases, y, bloqueios = [] }) => {
  const grupos = useMemo(
    () =>
      gruposDaLegenda(frases).map((g) => {
        const corte = bloqueios.filter((b) => b > g.de + 0.05).sort((a, b) => a - b)[0];
        return corte !== undefined && corte < g.ate ? { ...g, ate: corte } : g;
      }),
    [frases, bloqueios],
  );
  const g = grupos.find((x) => t >= x.de - 0.04 && t < x.ate);
  if (!g) return null;
  // fuera la puntuación del final y también los signos de apertura (¿ ¡), que en el subtítulo se quedarían sin pareja
  const textos = g.palavras.map((p) => p.w.replace(/[.,;:!?…]+$/, "").replace(/^[¿¡]+/, "").toLocaleUpperCase("es-ES"));
  // cuerpo que cabe en una línea
  let S = S_MAX;
  const larguraEm = (s: number) => textos.reduce((a, w) => a + larguraTexto(w, s, F) + s * 0.4, 0) + s * 0.5;
  while (S > 40 && larguraEm(S) > LARGURA) S -= 2;
  const padX = S * 0.2;
  const vao = S * 0.04;
  const larguras = textos.map((w) => larguraTexto(w, S, F) + padX * 2);
  const xs: number[] = [];
  let x = S * 0.2;
  larguras.forEach((l) => {
    xs.push(x);
    x += l + vao;
  });
  const total = x - vao + S * 0.2;
  const altura = S * 1.5;
  // palabra actual: la última que ya ha empezado
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  const entrada = prog(t, g.de - 0.04, 0.12, rapido);
  // la tarja se desliza de la palabra anterior a la actual
  let tx = atual >= 0 ? xs[atual] : 0;
  let tw = atual >= 0 ? larguras[atual] : 0;
  if (atual > 0) {
    const p = prog(t, g.palavras[atual].em - 0.02, 0.09, rapido);
    tx = interpolate(p, [0, 1], [xs[atual - 1], xs[atual]]);
    tw = interpolate(p, [0, 1], [larguras[atual - 1], larguras[atual]]);
  }
  const pTarja = atual >= 0 ? prog(t, g.palavras[0].em - 0.02, 0.08) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - total) / 2,
        top: y - altura / 2,
        width: total,
        height: altura,
        opacity: Math.min(1, entrada * 2),
        transform: entrada >= 1 ? undefined : `scale(${0.88 + 0.12 * entrada})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: S * 0.24, background: cor.placa }} />
      {atual >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: tx,
            top: altura * 0.12,
            width: tw,
            height: altura * 0.76,
            borderRadius: S * 0.16,
            background: cor.tarja,
            opacity: pTarja,
            boxShadow: `0 ${Math.round(S * 0.07)}px 0 ${cor.tarjaBorda}`,
          }}
        />
      ) : null}
      {textos.map((w, k) => (
        <span
          key={k}
          style={{
            position: "absolute",
            left: xs[k] + padX,
            top: 0,
            lineHeight: `${altura}px`,
            fontFamily: fonte,
            fontWeight: 900,
            fontSize: S,
            color: cor.tinta,
            whiteSpace: "nowrap",
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};
