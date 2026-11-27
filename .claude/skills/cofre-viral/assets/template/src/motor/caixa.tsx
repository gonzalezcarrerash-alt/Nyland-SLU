// Parte del motor: el vídeo de la persona dentro de una caja que puede cambiar de tamaño y de sitio
// (pantalla completa, media pantalla, ventanita en la esquina…), siempre con la cara encuadrada.
// Funciona con cualquier grabación: no recorta a la persona del fondo, solo reencuadra el vídeo.
//
// Cuando el plan tiene `rosto.rastro` (el cortar.mjs lo guarda solo), la caja sigue la cara: si la
// persona se inclina o cambia de sitio, el vídeo se desliza para que la cara siga donde la puso el layout.
// Las cajas en las que la cara es grande (ventana, círculo) la siguen de cerca; las cajas grandes (pantalla completa)
// solo hacen reencuadres suaves, sin que parezca que la cámara va de paseo. Para una caja que
// necesita el recorte fijo, usa `seguirRosto={false}`.
import { Video } from "@remotion/media";
import { Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type Caixa = {
  // posición y tamaño en el fotograma de 1080×1920, en px
  x: number;
  y: number;
  w: number;
  h: number;
  // redondeo de las esquinas, en px
  raio?: number;
  // 1 = el encuadre más pequeño que cubre la caja; más que eso acerca a la cara
  zoom?: number;
  // dónde queda el centro de la cara dentro de la caja, de 0 (arriba) a 1 (abajo); 0.42 deja aire arriba
  ancoraY?: number;
};

export const CHEIO: Caixa = { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: 1, ancoraY: 0.3 };

const suave = Easing.bezier(0.65, 0, 0.35, 1);

// Estados de la caja a lo largo del tiempo: cada uno vale a partir de `de` y el cambio tarda `dur` segundos.
export type EstadoDaCaixa = { de: number; caixa: Caixa; dur?: number };

export const caixaNoTempo = (t: number, estados: EstadoDaCaixa[]): Caixa => {
  const ordem = [...estados].sort((a, b) => a.de - b.de);
  let i = -1;
  for (let k = 0; k < ordem.length; k++) if (ordem[k].de <= t) i = k;
  if (i <= 0) return { ...CHEIO, ...(ordem[0]?.caixa ?? {}) };
  const antes = { ...CHEIO, ...ordem[i - 1].caixa };
  const agora = { ...CHEIO, ...ordem[i].caixa };
  const p = interpolate(t, [ordem[i].de, ordem[i].de + (ordem[i].dur ?? 0.55)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: suave,
  });
  const mix = (a: number, b: number) => a + (b - a) * p;
  return {
    x: mix(antes.x, agora.x),
    y: mix(antes.y, agora.y),
    w: mix(antes.w, agora.w),
    h: mix(antes.h, agora.h),
    raio: mix(antes.raio ?? 0, agora.raio ?? 0),
    zoom: mix(antes.zoom ?? 1, agora.zoom ?? 1),
    ancoraY: mix(antes.ancoraY ?? 0.3, agora.ancoraY ?? 0.3),
  };
};

// ---------- la cara a lo largo del tiempo ----------

// Lo guarda el cortar.mjs (scripts/rastrear.mjs) dentro de `rosto`. Fracciones del fotograma de 1080×1920.
export type Rastro = {
  // segundos entre muestras (1 fotograma del vídeo de trabajo)
  passo: number;
  // ancho de la cara, en fracción del ancho del fotograma
  largura: number;
  // el `rosto` fijo de cuando se hizo el rastro
  ref: { x: number; y: number };
  // centro de la cara en cada fotograma
  x: number[];
  y: number[];
  // recorrido de la cámara: el mismo centro sin los vaivenes (zona muerta) y con reencuadres suaves
  cx: number[];
  cy: number[];
};
export type Rosto = { x: number; y: number; rastro?: Rastro };

const valido = (r: Rastro | undefined): r is Rastro =>
  !!r &&
  r.passo > 0 &&
  !!r.ref &&
  Array.isArray(r.x) &&
  r.x.length > 1 &&
  r.y?.length === r.x.length &&
  r.cx?.length === r.x.length &&
  r.cy?.length === r.x.length;

const naPosicao = (v: number[], pos: number) => {
  const p = Math.max(0, Math.min(v.length - 1, pos));
  const i = Math.floor(p);
  const j = Math.min(v.length - 1, i + 1);
  return v[i] + (v[j] - v[i]) * (p - i);
};

// media gaussiana alrededor de `pos` (σ en muestras): quita el temblor fino sin retrasar
const suavizado = (v: number[], pos: number, sigma: number) => {
  const c = Math.round(Math.max(0, Math.min(v.length - 1, pos)));
  const r = Math.ceil(sigma * 2.5);
  let a = 0;
  let p = 0;
  for (let k = -r; k <= r; k++) {
    const j = c + k;
    if (j < 0 || j >= v.length) continue;
    const w = Math.exp(-((j - pos) ** 2) / (2 * sigma * sigma));
    a += v[j] * w;
    p += w;
  }
  return p > 0 ? a / p : naPosicao(v, pos);
};

// Centro de la cara en el instante t (segundos del vídeo de trabajo), en fracciones del fotograma de 1080×1920:
// la misma convención que `rosto`. Sin rastro, devuelve la cara fija. Si `rosto` no es el del plan
// (un punto desplazado a partir de él), el punto se mueve junto con la cara.
export const rostoNoTempo = (rosto: Rosto, t: number): { x: number; y: number } => {
  const r = rosto.rastro;
  if (!valido(r)) return { x: rosto.x, y: rosto.y };
  const pos = t / r.passo;
  return { x: naPosicao(r.x, pos) + rosto.x - r.ref.x, y: naPosicao(r.y, pos) + rosto.y - r.ref.y };
};

// El punto que debe seguir una cámara en el instante t (fracciones del fotograma de 1080×1920). `aperto` va de
// 0 (cámara tranquila: quieta en los vaivenes, reencuadra cuando la persona cambia de sitio) a 1 (de cerca:
// acompaña a la cara, solo que sin el temblor fino). Para quien coloca el vídeo con su propia cuenta en vez
// de con VideoNaCaixa (p. ej.: una ventana redonda): pon este punto donde debe quedar la cara.
export const pontoDoRosto = (rosto: Rosto, t: number, aperto = 1): { x: number; y: number } => {
  const r = rosto.rastro;
  if (!valido(r)) return { x: rosto.x, y: rosto.y };
  const pos = t / r.passo;
  const sigma = 0.2 / r.passo;
  const k = Math.min(1, Math.max(0, aperto));
  const camX = naPosicao(r.cx, pos);
  const camY = naPosicao(r.cy, pos);
  return {
    x: camX + k * (suavizado(r.x, pos, sigma) - camX) + rosto.x - r.ref.x,
    y: camY + k * (suavizado(r.y, pos, sigma) - camY) + rosto.y - r.ref.y,
  };
};

// ---------- el encuadre ----------

const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suave01 = (v: number) => {
  const p = entre(v, 0, 1);
  return p * p * (3 - 2 * p);
};
// Desplaza `d` desde la posición fija sin pasar del borde del vídeo, frenando antes (sin tirón).
// `baixo` y `cima` son cuánto se puede avanzar en cada sentido (≥ 0).
const freado = (d: number, baixo: number, cima: number) => {
  if (d >= 0) return cima > 0.5 ? cima * Math.tanh(d / cima) : 0;
  return baixo > 0.5 ? -baixo * Math.tanh(-d / baixo) : 0;
};

// Franja (del 2 % al 98 %) del recorrido de la cámara y del recorrido fino: cuánto margen necesita la caja
type Faixas = { cx: [number, number]; cy: [number, number]; x: [number, number]; y: [number, number] };
const faixasGuardadas = new WeakMap<Rastro, Faixas>();
const faixa = (v: number[]): [number, number] => {
  const o = Float64Array.from(v).sort();
  return [o[Math.floor((o.length - 1) * 0.02)], o[Math.ceil((o.length - 1) * 0.98)]];
};
const faixasDo = (r: Rastro) => {
  let f = faixasGuardadas.get(r);
  if (!f) {
    f = { cx: faixa(r.cx), cy: faixa(r.cy), x: faixa(r.x), y: faixa(r.y) };
    faixasGuardadas.set(r, f);
  }
  return f;
};

// Cuánto puede acercar la caja además de su propio zoom para tener margen para seguir la cara. A pantalla
// completa es poco (8 %): la cámara solo corrige, no pasea. En una ventana donde la cara es grande, hasta el 25 %.
// El margen vale para todo el vídeo (el zoom no «respira» mientras la persona se mueve).
const FOLGA_CHEIO = 1.08;
const FOLGA_JANELA = 1.25;

export type Enquadramento = {
  // escala del vídeo (1 = 1080 px de ancho) y su tamaño en pantalla, en px
  escala: number;
  lv: number;
  av: number;
  // esquina del vídeo respecto a la esquina de la caja, en px (siempre ≤ 0: el vídeo cubre la caja)
  esquerda: number;
  topo: number;
};

// Dónde cae el vídeo dentro de la caja en el instante t (segundos del vídeo de trabajo). Es la cuenta del
// VideoNaCaixa: úsala para dibujar encima de la persona en el sitio correcto. t = null (o seguir = false)
// da el encuadre fijo, igual que cuando no hay rastro.
export const enquadrar = (caixa: Caixa, rosto: Rosto, videoAltura: number, t: number | null, seguir = true): Enquadramento => {
  const W0 = 1080;
  const H0 = videoAltura;
  const fx = rosto.x;
  const fy = (rosto.y * 1920) / H0;
  const s0 = Math.max(caixa.w / W0, caixa.h / H0) * (caixa.zoom ?? 1);
  const lv0 = W0 * s0;
  const av0 = H0 * s0;
  // fijo: la cara en el centro de la caja (en horizontal) y a la altura `ancoraY`, sin borde vacío
  const e0 = entre(caixa.w / 2 - fx * lv0, caixa.w - lv0, 0);
  const t0 = entre(caixa.h * (caixa.ancoraY ?? 0.3) - fy * av0, caixa.h - av0, 0);
  const r = rosto.rastro;
  if (!seguir || t === null || !valido(r) || caixa.w < 2 || caixa.h < 2) return { escala: s0, lv: lv0, av: av0, esquerda: e0, topo: t0 };

  // dónde pone la cara el layout (px dentro de la caja): ahí se queda mientras la persona se mueve
  const X = e0 + fx * lv0;
  const Y = t0 + fy * av0;
  // una caja en la que la cara es grande (ventana, círculo) la sigue de cerca; una caja grande solo reencuadra
  const rostoPx = r.largura * W0 * s0;
  const kx = suave01((rostoPx / caixa.w - 0.42) / 0.33);
  const ky = suave01(((rostoPx * 1.35) / caixa.h - 0.42) / 0.33);
  const alvoX = pontoDoRosto(rosto, t, kx).x;
  const alvoY = (pontoDoRosto(rosto, t, ky).y * 1920) / H0;

  // margen: el zoom extra más pequeño que permite sujetar la cara en (X, Y) en todo el recorrido
  const f = faixasDo(r);
  const mix = (a: [number, number], b: [number, number], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const [x1, x2] = mix(f.cx, f.x, kx).map((v) => v + fx - r.ref.x);
  const [y1, y2] = mix(f.cy, f.y, ky).map((v) => ((v + rosto.y - r.ref.y) * 1920) / H0);
  const precisaL = Math.max(X / Math.max(0.05, x1), (caixa.w - X) / Math.max(0.05, 1 - x2));
  const precisaA = Math.max(Y / Math.max(0.05, y1), (caixa.h - Y) / Math.max(0.05, 1 - y2));
  // cada dirección pide su margen, hasta su límite (la pantalla completa pide poco; la ventana, más)
  const limite = (k: number) => FOLGA_CHEIO + (FOLGA_JANELA - FOLGA_CHEIO) * k;
  const folga = Math.max(1, Math.min(precisaL / lv0, limite(kx)), Math.min(precisaA / av0, limite(ky)));
  const escala = s0 * folga;
  const lv = W0 * escala;
  const av = H0 * escala;

  // lo fijo con la escala nueva (acerca alrededor de la cara) y el desplazamiento que sigue la cara,
  // frenado antes del borde del vídeo
  const eF = entre(X - fx * lv, caixa.w - lv, 0);
  const tF = entre(Y - fy * av, caixa.h - av, 0);
  const esquerda = eF + freado(X - alvoX * lv - eF, eF - (caixa.w - lv), -eF);
  const topo = tF + freado(Y - alvoY * av - tF, tF - (caixa.h - av), -tF);
  return { escala, lv, av, esquerda, topo };
};

// Dónde está la cara en pantalla en el instante t (px en el fotograma de 1080×1920), ya con la caja siguiéndola:
// úsalo para dibujar algo pegado a la cara (marco, flecha, etiqueta). `largura` = ancho de la cara en px.
export const rostoNaTela = (caixa: Caixa, rosto: Rosto, videoAltura: number, t: number, seguir = true) => {
  const e = enquadrar(caixa, rosto, videoAltura, t, seguir);
  const r = seguir ? rostoNoTempo(rosto, t) : { x: rosto.x, y: rosto.y };
  return {
    x: caixa.x + e.esquerda + r.x * e.lv,
    y: caixa.y + e.topo + ((r.y * 1920) / videoAltura) * e.av,
    escala: e.escala,
    largura: (rosto.rastro?.largura ?? 0.36) * e.lv,
  };
};

// `rosto` viene del plan (fracciones del fotograma de 1080×1920, con el `rastro` cuando lo haya);
// `videoAltura` es la altura del vídeo de trabajo.
export const VideoNaCaixa: React.FC<{
  src: string;
  caixa: Caixa;
  rosto: Rosto;
  videoAltura: number;
  filtro?: string;
  estilo?: React.CSSProperties;
  // true en una segunda copia de la persona (p. ej.: una miniatura) para que la voz no salga doblada
  mudo?: boolean;
  // false: recorte fijo, sin seguir la cara (por defecto: la sigue cuando el plan tiene rastro)
  seguirRosto?: boolean;
}> = ({ src, caixa, rosto, videoAltura, filtro, estilo, mudo, seguirRosto = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // el tiempo del vídeo que está en pantalla (dentro de una Sequence, el vídeo también empieza de nuevo en ella)
  const e = enquadrar(caixa, rosto, videoAltura, frame / fps, seguirRosto);

  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        top: caixa.y,
        width: caixa.w,
        height: caixa.h,
        overflow: "hidden",
        borderRadius: caixa.raio ?? 0,
        ...estilo,
      }}
    >
      <Video
        src={staticFile(src)}
        objectFit="fill"
        muted={mudo}
        style={{ position: "absolute", left: e.esquerda, top: e.topo, width: e.lv, height: e.av, filter: filtro }}
      />
    </div>
  );
};
