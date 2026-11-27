// Texto en tarjas: cada línea en una placa (oscura o de color); las palabras entran una a una,
// el `destaque` lleva la tarja de color detrás y el `risco` se tacha cuando se dice.
// Todo se mide antes (medida.ts): el bloque cabe en el ancho pedido, con cualquier texto.
import { prog, rapido } from "../anim";
import { encaixar, larguraTexto, trechoNoTexto } from "../medida";
import { cor, fonte } from "../tema";

export type PropsTarjado = {
  t: number;
  texto: string;
  // instante de cada palabra (mismo tamaño que las palabras del texto)
  tempos: number[];
  largura: number;
  max: number;
  min: number;
  linhas?: number;
  peso?: 800 | 900;
  caixaAlta?: boolean;
  // fondo de cada línea; null = sin placa (texto sobre la tarja de color)
  placa?: string | null;
  corTexto?: string;
  destaque?: string;
  corDestaque?: string;
  corTextoDestaque?: string;
  risco?: string;
  riscoEm?: number;
  alinhar?: "centro" | "esquerda";
};

export const medirTarjado = (texto: string, largura: number, max: number, min: number, linhas = 3, peso: 800 | 900 = 900, caixaAlta = true) => {
  const f = { peso, caixaAlta } as const;
  const enc = encaixar(texto, { largura: largura - 0.6 * max, max, min, linhas, fonte: f });
  const S = enc.tamanho;
  const alturaLinha = S * 1.32;
  return { S, linhas: enc.linhas, alturaLinha, altura: enc.linhas.length * alturaLinha + (enc.linhas.length - 1) * S * 0.1 };
};

export const Tarjado: React.FC<PropsTarjado> = ({
  t,
  texto,
  tempos,
  largura,
  max,
  min,
  linhas = 3,
  peso = 900,
  caixaAlta = true,
  placa = cor.placa,
  corTexto = cor.tinta,
  destaque,
  corDestaque = cor.tarja,
  corTextoDestaque = cor.tinta,
  risco,
  riscoEm,
  alinhar = "centro",
}) => {
  const f = { peso, caixaAlta } as const;
  const { S, linhas: ls, alturaLinha } = medirTarjado(texto, largura, max, min, linhas, peso, caixaAlta);
  const espaco = larguraTexto(" ", S, f) + S * 0.04;
  const padX = S * 0.3;
  const dest = trechoNoTexto(texto, destaque);
  const rsc = trechoNoTexto(texto, risco);
  let indice = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "centro" ? "center" : "flex-start", gap: S * 0.1 }}>
      {ls.map((linha, li) => {
        const ws = linha.split(" ");
        const inicio = indice;
        indice += ws.length;
        const larguras = ws.map((w) => larguraTexto(w, S, f));
        const xs: number[] = [];
        let x = padX;
        larguras.forEach((l) => {
          xs.push(x);
          x += l + espaco;
        });
        const total = x - espaco + padX;
        // la placa crece hasta la última palabra que ya ha entrado
        let ate = -1;
        ws.forEach((_, k) => {
          if (t >= (tempos[inicio + k] ?? 0)) ate = k;
        });
        if (ate < 0) return <div key={li} style={{ height: alturaLinha, width: total }} />;
        const larguraPlaca = xs[ate] + larguras[ate] + padX;
        const pPlaca = prog(t, tempos[inicio] ?? 0, 0.14);
        // trozo destacado en esta línea
        const dIni = dest ? Math.max(dest[0], inicio) - inicio : -1;
        const dFim = dest ? Math.min(dest[1], indice - 1) - inicio : -2;
        const temDest = dest && dFim >= dIni && dIni >= 0 && dIni < ws.length;
        const pDest = temDest ? prog(t, tempos[inicio + dIni] ?? 0, 0.2) : 0;
        const rIni = rsc ? Math.max(rsc[0], inicio) - inicio : -1;
        const rFim = rsc ? Math.min(rsc[1], indice - 1) - inicio : -2;
        const temRisco = rsc && rFim >= rIni && rIni >= 0 && rIni < ws.length;
        const pRisco = temRisco ? prog(t, riscoEm ?? tempos[inicio + rIni] ?? 0, 0.28) : 0;
        return (
          <div key={li} style={{ position: "relative", width: total, height: alturaLinha }}>
            {placa ? (
              <div
                style={{
                  position: "absolute",
                  left: alinhar === "centro" ? (total - larguraPlaca) / 2 : 0,
                  top: 0,
                  width: larguraPlaca,
                  height: alturaLinha,
                  borderRadius: S * 0.2,
                  background: placa,
                  opacity: pPlaca,
                }}
              />
            ) : null}
            {temDest && pDest > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: (alinhar === "centro" ? (total - larguraPlaca) / 2 : 0) + xs[dIni] - padX * 0.55,
                  top: alturaLinha * 0.08,
                  width: (xs[Math.min(dFim, ate)] + larguras[Math.min(dFim, ate)] - xs[dIni] + padX * 1.1) * (0.3 + 0.7 * pDest),
                  height: alturaLinha * 0.84,
                  borderRadius: S * 0.16,
                  background: corDestaque,
                  boxShadow: `0 ${Math.round(S * 0.07)}px 0 ${corDestaque === cor.alerta ? cor.alertaBorda : cor.tarjaBorda}`,
                }}
              />
            ) : null}
            {ws.map((w, k) => {
              const em = tempos[inicio + k] ?? 0;
              if (t < em) return null;
              const p = prog(t, em, 0.16, rapido);
              const naTarja = temDest && k >= dIni && k <= dFim;
              const deslocX = alinhar === "centro" ? (total - larguraPlaca) / 2 : 0;
              return (
                <span
                  key={k}
                  style={{
                    position: "absolute",
                    left: deslocX + xs[k],
                    top: 0,
                    height: alturaLinha,
                    lineHeight: `${alturaLinha}px`,
                    fontFamily: fonte,
                    fontWeight: peso,
                    fontSize: S,
                    color: naTarja ? corTextoDestaque : corTexto,
                    textTransform: caixaAlta ? "uppercase" : "none",
                    whiteSpace: "nowrap",
                    opacity: p >= 1 ? 1 : Math.min(1, p * 2.5),
                    transform: p >= 1 ? undefined : `scale(${0.72 + 0.28 * p})`,
                    transformOrigin: "50% 60%",
                  }}
                >
                  {w}
                </span>
              );
            })}
            {temRisco && pRisco > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: (alinhar === "centro" ? (total - larguraPlaca) / 2 : 0) + xs[rIni] - S * 0.08,
                  top: alturaLinha * 0.47,
                  width: (xs[Math.min(rFim, ate)] + larguras[Math.min(rFim, ate)] - xs[rIni] + S * 0.16) * pRisco,
                  height: Math.max(6, S * 0.11),
                  borderRadius: 4,
                  background: cor.tarja,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
