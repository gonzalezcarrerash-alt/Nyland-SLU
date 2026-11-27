// Parte del motor: sigue la cara en el vídeo de trabajo (public/base.mp4) y guarda su recorrido en
// `rosto.rastro` en el src/plano.json. Se ejecuta solo al final del cortar.mjs; el VideoNaCaixa usa el rastro
// para que la caja de la persona acompañe a la cara cuando se mueve (pantalla completa, ventana, círculo…).
//
// Uso (solo para rehacerlo; el cortar.mjs ya lo ejecuta):
//   node scripts/rastrear.mjs
//   node scripts/rastrear.mjs --largura 0.42                  (ancho de la cara, de mejilla a mejilla, en fracción del fotograma)
//   node scripts/rastrear.mjs --conferir 2 6 10               (fotogramas con la cuadrícula y la cara encontrada marcada, en out/rastro)
//   node scripts/rastrear.mjs --em 6.5 --x 0.49 --y 0.25      (referencia exacta medida en un fotograma del --conferir)
//   node scripts/rastrear.mjs --desligar                      (quita el rastro: la persona vuelve a quedarse quieta)
//
// Cómo funciona: recorta ojos y nariz en un fotograma de referencia y busca ese recorte fotograma a
// fotograma (correlación normalizada, en tres escalas, para la persona que se acerca o se aleja), con
// una búsqueda amplia justo después de cada corte y cuando pierde la cara. Sin internet y sin bibliotecas extra:
// usa el ffmpeg de Remotion. Cuando la coincidencia es demasiado débil, ese tramo se queda quieto
// (la cara fija de antes): nunca sigue una suposición mala.
//
// El plan recibe, dentro de `rosto`:
//   rastro.passo        segundos entre muestras (1 fotograma)
//   rastro.x / .y       centro de la cara en cada fotograma (fracciones del fotograma de 1080×1920, como `rosto`)
//   rastro.cx / .cy     el recorrido de la «cámara»: el mismo centro sin los vaivenes pequeños (zona muerta)
//                       y con los cambios suavizados. Es lo que sigue la caja de la persona.
//   rastro.largura      ancho de la cara (fracción del ancho del fotograma)
//   rastro.ref          el `rosto` fijo de cuando se hizo el rastro (la posición más habitual)
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { argumentos, exigirProjeto, ffmpeg, gravarJson, lerJson, lerQuadros, mmss } from "./comum.mjs";

// ---------- ajustes ----------
const LARGURA_ALVO = 64; // ancho de la cara (px) en la escala reducida en la que se hace el seguimiento
const RAIO_LOCAL = 4; // búsqueda fotograma a fotograma (px en la escala reducida)
const BOA = 0.55; // correlación a partir de la cual el fotograma es fiable
const ACEITA = 0.45; // por debajo de esto la cara se da por perdida en ese fotograma
const PASSO_ESCALA = 1.04;
const ESCALAS = 6; // de 1.04^-5 (0,82) a 1.04^5 (1,22) del tamaño de referencia (acercarse o alejarse)
const ZONA_MORTA = 0.1; // en anchos de cara: los vaivenes menores que esto no mueven la cámara
const QUANTOS_AMOSTRAS = 12;

// ---------- utilidades numéricas ----------
const mediana = (v) => {
  if (!v.length) return NaN;
  const o = Float64Array.from(v).sort();
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};
const percentil = (v, p) => {
  if (!v.length) return 0;
  const o = Float64Array.from(v).sort();
  return o[Math.min(o.length - 1, Math.max(0, Math.round((o.length - 1) * p)))];
};
// gaussiana que no cruza los bordes del tramo (renormaliza el núcleo cortado)
const gaussiana = (v, sigma) => {
  if (sigma <= 0.01) return Float64Array.from(v);
  const r = Math.ceil(sigma * 3);
  const nucleo = Array.from({ length: 2 * r + 1 }, (_, k) => Math.exp(-((k - r) ** 2) / (2 * sigma * sigma)));
  const s = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    let a = 0;
    let p = 0;
    for (let k = -r; k <= r; k++) {
      const j = i + k;
      if (j < 0 || j >= v.length) continue;
      a += v[j] * nucleo[k + r];
      p += nucleo[k + r];
    }
    s[i] = a / p;
  }
  return s;
};
// mediana móvil: quita los vaivenes rápidos (menores que la ventana) y mantiene los escalones en su sitio
const medianaCorrida = (v, meia) => {
  const s = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const a = Math.max(0, i - meia);
    const b = Math.min(v.length, i + meia + 1);
    s[i] = mediana(v.subarray ? v.subarray(a, b) : v.slice(a, b));
  }
  return s;
};

// ---------- imagen ----------
const integrais = (img, L, A, soma, soma2) => {
  const L1 = L + 1;
  for (let y = 0; y < A; y++) {
    let s = 0;
    let s2 = 0;
    const linha = y * L;
    const o = (y + 1) * L1;
    const ant = y * L1;
    for (let x = 0; x < L; x++) {
      const v = img[linha + x];
      s += v;
      s2 += v * v;
      soma[o + x + 1] = soma[ant + x + 1] + s;
      soma2[o + x + 1] = soma2[ant + x + 1] + s2;
    }
  }
};
const amostra = (img, L, A, x, y) => {
  const xx = Math.min(L - 1.001, Math.max(0, x));
  const yy = Math.min(A - 1.001, Math.max(0, y));
  const x0 = Math.floor(xx);
  const y0 = Math.floor(yy);
  const fx = xx - x0;
  const fy = yy - y0;
  const i = y0 * L + x0;
  return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + L] * (1 - fx) + img[i + L + 1] * fx) * fy;
};

// Plantilla (recorte de ojos y nariz) centrada en la cara en (cx, cy), con el tamaño `fator`
const gabarito = (img, L, A, cx, cy, Wt, fator) => {
  const W = Wt * fator;
  const w = Math.max(9, Math.round(W * 0.8));
  const h = Math.max(7, Math.round(W * 0.6));
  const hx = w >> 1;
  // el recorte sube un poco: queda entre las cejas y la nariz, lejos de la boca (que se mueve al hablar)
  const oy = Math.round(W * 0.1) + (h >> 1);
  const d = new Float32Array(w * h);
  let media = 0;
  for (let v = 0; v < h; v++)
    for (let u = 0; u < w; u++) {
      const val = amostra(img, L, A, cx - hx + u, cy - oy + v);
      d[v * w + u] = val;
      media += val;
    }
  media /= d.length;
  let norma = 0;
  for (let k = 0; k < d.length; k++) {
    d[k] -= media;
    norma += d[k] * d[k];
  }
  return { w, h, hx, oy, d, norma: Math.sqrt(norma) || 1, n: w * h };
};

// Correlación normalizada de la plantilla con el fotograma, con el centro de la cara en el píxel (px, py)
const ncc = (q, g, px, py) => {
  const { img, L, A, soma, soma2 } = q;
  const x0 = px - g.hx;
  const y0 = py - g.oy;
  if (x0 < 0 || y0 < 0 || x0 + g.w > L || y0 + g.h > A) return -1;
  let cruz = 0;
  const d = g.d;
  for (let v = 0; v < g.h; v++) {
    const linha = (y0 + v) * L + x0;
    const base = v * g.w;
    for (let u = 0; u < g.w; u++) cruz += img[linha + u] * d[base + u];
  }
  const L1 = L + 1;
  const a = y0 * L1 + x0;
  const b = (y0 + g.h) * L1 + x0;
  const s = soma[b + g.w] - soma[b] - soma[a + g.w] + soma[a];
  const s2 = soma2[b + g.w] - soma2[b] - soma2[a + g.w] + soma2[a];
  const variancia = s2 - (s * s) / g.n;
  // región lisa (pared, fondo quemado): no es una cara
  if (variancia < g.n * 9) return -1;
  return cruz / (Math.sqrt(variancia) * g.norma);
};

// ---------- el centro real (simetría) ----------
// La cara de frente es especular: alrededor del centro real, el lado izquierdo es el reflejo del
// derecho. En un solo fotograma eso engaña (luz de un lado, cabeza girada, cada cristal de las gafas también
// es simétrico), así que el perfil de simetría se suma a lo largo del vídeo, en posiciones relativas al
// recorte que sigue el seguimiento, y el centro se encuentra por el «trío»: el pico del centro y los dos picos
// de los ojos (cada ojo es simétrico alrededor de sí mismo), a ~0,23 anchos de cara a cada lado.
const PERFIL_DE = -0.6;
const PERFIL_PASSO = 0.025;
const PERFIL_N = 49; // de -0,6 a +0,6 anchos de cara
const novoPerfil = () => ({ soma: new Float64Array(PERFIL_N), cont: new Float64Array(PERFIL_N), n: 0 });
const somarPerfil = (perfil, img, L, A, cx, cy, W) => {
  // recorte local con paso alto (quita el sombreado y deja ojos, cejas, gafas, nariz)
  const raio = Math.max(2, Math.round(W * 0.08));
  // (cerca del borde del fotograma, solo cuentan los ejes que caben)
  const x0 = Math.max(0, Math.round(cx - 1.05 * W) - raio);
  const x1 = Math.min(L - 1, Math.round(cx + 1.05 * W) + raio);
  const y0 = Math.max(0, Math.round(cy - 0.5 * W) - raio);
  const y1 = Math.min(A - 1, Math.round(cy + 0.25 * W) + raio);
  if (x1 - x0 < W || y1 - y0 < 0.4 * W) return;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) {
      s += img[(y0 + y) * L + x0 + x];
      ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + s;
    }
  }
  const pa = new Float32Array(w * h);
  for (let y = raio; y < h - raio; y++)
    for (let x = raio; x < w - raio; x++) {
      const a = (y - raio) * (w + 1) + (x - raio);
      const b = (y + raio + 1) * (w + 1) + (x - raio);
      const m = (ii[b + 2 * raio + 1] - ii[b] - ii[a + 2 * raio + 1] + ii[a]) / ((2 * raio + 1) ** 2);
      pa[y * w + x] = img[(y0 + y) * L + x0 + x] - m;
    }
  const ccx = cx - x0;
  const yA = raio;
  const yB = h - raio - 1;
  const nota = (eixo, hw) => {
    const a2 = Math.round(2 * eixo);
    const xl0 = a2 % 2 === 0 ? a2 / 2 - 1 : (a2 - 1) / 2;
    const xr0 = a2 % 2 === 0 ? a2 / 2 + 1 : (a2 + 1) / 2;
    if (xl0 - hw + 1 < raio || xr0 + hw - 1 >= w - raio) return null;
    let sl = 0;
    let sr = 0;
    let sll = 0;
    let srr = 0;
    let slr = 0;
    let n = 0;
    for (let y = yA; y <= yB; y++) {
      const linha = y * w;
      for (let j = 0; j < hw; j++) {
        const l = pa[linha + xl0 - j];
        const r = pa[linha + xr0 + j];
        sl += l;
        sr += r;
        sll += l * l;
        srr += r * r;
        slr += l * r;
        n++;
      }
    }
    const vl = sll - (sl * sl) / n;
    const vr = srr - (sr * sr) / n;
    return vl > n && vr > n ? (slr - (sl * sr) / n) / Math.sqrt(vl * vr) : 0;
  };
  for (let k = 0; k < PERFIL_N; k++) {
    const eixo = ccx + (PERFIL_DE + k * PERFIL_PASSO) * W;
    const notas = [0.2, 0.3, 0.4].map((h) => nota(eixo, Math.round(h * W)));
    if (notas.some((v) => v === null)) continue;
    perfil.soma[k] += (notas[0] + notas[1] + notas[2]) / 3;
    perfil.cont[k]++;
  }
  perfil.n++;
};
// Devuelve el desplazamiento del centro real respecto al recorte seguido (en anchos de cara)
const centroDoPerfil = (perfil) => {
  if (perfil.n < 10) return null;
  // un eje sin muestras suficientes (fuera del fotograma) no cuenta a favor
  const p = Array.from(perfil.soma, (v, k) => (perfil.cont[k] >= perfil.n * 0.3 ? v / perfil.cont[k] : 0));
  const P = (d) => {
    const x = (d - PERFIL_DE) / PERFIL_PASSO;
    const i = Math.floor(x);
    if (i < 0 || i >= PERFIL_N - 1) return 0;
    return p[i] + (p[i + 1] - p[i]) * (x - i);
  };
  let melhor = { c: 0, v: -Infinity };
  for (let c = -0.35; c <= 0.3501; c += 0.0125) {
    let olhos = -Infinity;
    for (let e = 0.18; e <= 0.2801; e += 0.0125) olhos = Math.max(olhos, Math.min(P(c - e), P(c + e)));
    const v = P(c) + 2 * olhos;
    if (v > melhor.v) melhor = { c, v };
  }
  if (melhor.v < 0.45) return null;
  // el centro también tiene que ser el pico de simetría más fuerte de su entorno (un patrón de tres picos
  // formado por el pelo, la montura o el fondo no pasa)
  let pico = { d: melhor.c, v: -Infinity };
  for (let d = melhor.c - 0.3; d <= melhor.c + 0.3001; d += 0.0125) if (P(d) > pico.v) pico = { d, v: P(d) };
  return pico.v >= 0.35 && Math.abs(pico.d - melhor.c) <= 0.075 ? melhor : null;
};

const buscar = (q, g, cx, cy, raio, passo) => {
  let melhor = { x: Math.round(cx), y: Math.round(cy), v: -2 };
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let dy = -raio; dy <= raio; dy += passo)
    for (let dx = -raio; dx <= raio; dx += passo) {
      const v = ncc(q, g, x0 + dx, y0 + dy);
      if (v > melhor.v) melhor = { x: x0 + dx, y: y0 + dy, v };
    }
  return melhor;
};

// refinamiento por debajo del píxel: parábola por los vecinos
const refinar = (q, g, m) => {
  const c = m.v;
  const e = ncc(q, g, m.x - 1, m.y);
  const d = ncc(q, g, m.x + 1, m.y);
  const s = ncc(q, g, m.x, m.y - 1);
  const b = ncc(q, g, m.x, m.y + 1);
  const ox = e > -1 && d > -1 && e + d - 2 * c < 0 ? (e - d) / (2 * (e + d - 2 * c)) : 0;
  const oy = s > -1 && b > -1 && s + b - 2 * c < 0 ? (s - b) / (2 * (s + b - 2 * c)) : 0;
  return { x: m.x + Math.max(-0.5, Math.min(0.5, ox)), y: m.y + Math.max(-0.5, Math.min(0.5, oy)), v: c };
};

// ---------- el recorrido de la cámara ----------
// Dentro de cada tramo (entre cortes) la cámara se queda quieta mientras la cara se mueve dentro de la zona
// muerta. Cuando sale de ella y se queda fuera (la persona se inclinó, cambió de sitio), la cámara hace un
// reencuadre suave hasta donde se va a quedar la persona y vuelve a pararse, como un operador de cámara,
// sin ir «nadando» detrás de cada movimiento. En cada corte la cámara empieza ya en el sitio correcto.
const suaveSeno = (p) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, p)));
const caminhoDaCamera = (xs, ys, fps, W) => {
  const n = xs.length;
  const cx = new Float64Array(n);
  const cy = new Float64Array(n);
  // mediana móvil larga (~2,5 s, centrada): los vaivenes y los gestos desaparecen; un cambio de sitio que
  // dura aparece en el instante exacto en que ocurrió
  const meia = Math.max(2, Math.round(fps * 1.25));
  const mx = medianaCorrida(xs, meia);
  const my = medianaCorrida(ys, meia);
  const trecho = (de, ate) => ({ x: mediana(mx.subarray(de, ate)), y: mediana(my.subarray(de, ate)) });
  if (n < Math.round(fps * 1.5)) {
    const m = { x: mediana(xs), y: mediana(ys) };
    return { cx: cx.fill(m.x), cy: cy.fill(m.y) };
  }
  // zona muerta: elipse un poco más ancha que alta (moverse hacia los lados es lo más habitual)
  const zx = ZONA_MORTA * W;
  const zy = ZONA_MORTA * 0.8 * W;
  const fora = (i, h) => Math.hypot((mx[i] - h.x) / zx, (my[i] - h.y) / zy) > 1;
  const insiste = Math.round(fps * 0.4); // tiempo fuera de la zona antes de reencuadrar
  const olhar = Math.round(fps * 1.0); // adónde fue la persona: mediana del segundo siguiente
  let h = trecho(0, Math.min(n, Math.round(fps)));
  let i = 0;
  let foraHa = 0;
  while (i < n) {
    cx[i] = h.x;
    cy[i] = h.y;
    foraHa = fora(i, h) ? foraHa + 1 : 0;
    if (foraHa >= insiste && i < n - 2) {
      // empieza en el instante en que la persona salió de la zona (sin retraso de «reacción»)
      const inicio = Math.max(0, i - foraHa + 1);
      const alvo = trecho(i, Math.min(n, i + olhar));
      const dist = Math.hypot(alvo.x - h.x, alvo.y - h.y);
      const dur = Math.max(1, Math.round(fps * Math.min(1.2, Math.max(0.6, 0.45 + dist / (2 * W)))));
      for (let j = 1; j <= dur && inicio + j < n; j++) {
        const p = suaveSeno(j / dur);
        cx[inicio + j] = h.x + (alvo.x - h.x) * p;
        cy[inicio + j] = h.y + (alvo.y - h.y) * p;
      }
      h = alvo;
      i = inicio + dur + 1;
      foraHa = 0;
      continue;
    }
    i++;
  }
  return { cx, cy };
};

// ---------- seguimiento ----------
// Devuelve { rastro, relatorio } o { rastro: null, relatorio } cuando no es fiable.
export const rastrearRosto = async (plano, opcoes = {}) => {
  const fps = plano.fps;
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const arquivo = path.join("public", plano.video ?? "base.mp4");
  if (!existsSync(arquivo)) throw new Error(`No encuentro ${arquivo}. Ejecuta antes el cortar.mjs.`);
  const rostoFixo = { x: plano.rosto.x, y: plano.rosto.y };

  // ancho de la cara en fracción del ancho del fotograma: medido > rastro anterior > estimado por la barbilla
  let largura = Number(opcoes.largura ?? plano.rostoLargura ?? plano.rosto.rastro?.largura ?? opcoes.larguraEstimada ?? NaN);
  if (!Number.isFinite(largura) && plano.zona?.topo) {
    const queixo = plano.zona.topo - 170;
    largura = (queixo - plano.rosto.y * 1920) / 0.66 / 1080;
  }
  if (!Number.isFinite(largura)) largura = 0.36;
  largura = Math.min(0.75, Math.max(0.14, largura));

  // escala reducida: la cara queda con ~64 px de ancho
  const L = Math.round(Math.min(400, Math.max(110, (1080 * LARGURA_ALVO) / (largura * 1080))));
  const A = Math.round((L * H0) / 1080);
  const f = 1080 / L; // px del fotograma de 1080 por px de la escala reducida
  const Wt = (largura * 1080) / f;
  const filtro = ["-an", "-vf", `scale=${L}:${A}:flags=area,format=gray`];
  const bytes = L * A;
  const novoQuadro = () => ({ img: new Uint8Array(bytes), L, A, soma: new Float64Array((L + 1) * (A + 1)), soma2: new Float64Array((L + 1) * (A + 1)) });
  const preparar = (q) => integrais(q.img, L, A, q.soma, q.soma2);
  // cara (fracciones del plan) ↔ px en la escala reducida
  const paraPx = (r) => ({ x: (r.x * 1080) / f, y: (r.y * 1920) / f });
  const paraFracao = (p) => ({ x: (p.x * f) / 1080, y: (p.y * f) / 1920 });

  // 1. Referencia: entre varios fotogramas repartidos, el recorte alrededor de `rosto` que más se
  // parece a los demás (el aspecto más habitual de la cara). Con --em/--x/--y, el fotograma medido.
  const duracao = plano.duracao;
  const tempos =
    opcoes.em !== undefined
      ? [Number(opcoes.em)]
      : Array.from({ length: QUANTOS_AMOSTRAS }, (_, k) => Math.min(duracao - 0.1, 0.25 + ((duracao - 0.5) * (k + 0.5)) / QUANTOS_AMOSTRAS));
  const amostras = [];
  for (const t of tempos) {
    const q = novoQuadro();
    await lerQuadros(["-ss", t.toFixed(3), "-i", arquivo, "-frames:v", "1", ...filtro], bytes, (b) => q.img.set(b));
    preparar(q);
    amostras.push({ t, q });
  }
  // --x/--y son fracciones de la imagen del vídeo de trabajo (la cuadrícula del --conferir); `rosto.y` es fracción de 1920
  const refRosto = opcoes.em !== undefined ? { x: Number(opcoes.x ?? rostoFixo.x), y: opcoes.y !== undefined ? (Number(opcoes.y) * H0) / 1920 : rostoFixo.y } : rostoFixo;
  const pRef = paraPx(refRosto);
  // 2. Cortes: el fotograma exacto de cada corte es el de mayor diferencia cerca del tiempo anotado
  const cortesNominais = (plano.cortesEm ?? []).map((c) => Math.round(c * fps));
  const pertoDeCorte = new Set(cortesNominais.flatMap((c) => [c - 2, c - 1, c, c + 1, c + 2]));

  const K0 = ESCALAS - 1;
  const kMin = 0;
  const kMax = 2 * ESCALAS - 2;

  // 3. Sigue la cara fotograma a fotograma, a partir del recorte de referencia alrededor de p0
  const passada = async (p0) => {
    let escolhida = amostras[0];
    if (amostras.length > 1) {
      let melhor = -Infinity;
      for (const a of amostras) {
        const g = gabarito(a.q.img, L, A, p0.x, p0.y, Wt, 1);
        const notas = amostras.filter((b) => b !== a).map((b) => buscar(b.q, g, p0.x, p0.y, Math.round(Wt * 0.35), 1).v);
        const nota = mediana(notas);
        if (nota > melhor) {
          melhor = nota;
          escolhida = a;
        }
      }
    }
    const banco = Array.from({ length: 2 * ESCALAS - 1 }, (_, k) => gabarito(escolhida.q.img, L, A, p0.x, p0.y, Wt, PASSO_ESCALA ** (k - K0)));

    // 3. Sigue la cara fotograma a fotograma
    const X = [];
    const Y = [];
    const C = [];
    const S = [];
    const diferenca = [];
    let pos = { ...p0 };
    let k = K0;
    let perdido = 0;
    let anterior = null;
    let ultimoBom = null;
    const q = novoQuadro();
    const sub = new Uint8Array(bytes);
    const perfil = novoPerfil();

    const buscaLarga = (centros, raio, ks) => {
      let m = { v: -2 };
      for (const c of centros)
        for (const kk of ks) {
          const g = banco[kk];
          const r = buscar(q, g, c.x, c.y, raio, 2);
          if (r.v > m.v) m = { ...r, k: kk };
        }
      if (m.v > -2) {
        const r = buscar(q, banco[m.k], m.x, m.y, 2, 1);
        if (r.v >= m.v) m = { ...r, k: m.k };
      }
      return m;
    };
    const buscaGlobal = () => {
      let m = { v: -2 };
      for (const kk of [k - 3, k, k + 3].filter((x) => x >= kMin && x <= kMax)) {
        const g = banco[kk];
        for (let y = g.oy; y < A - (g.h - g.oy); y += 3)
          for (let x = g.hx; x < L - (g.w - g.hx); x += 3) {
            const v = ncc(q, g, x, y);
            if (v > m.v) m = { x, y, v, k: kk };
          }
      }
      if (m.v > -2) {
        const r = buscar(q, banco[m.k], m.x, m.y, 3, 1);
        if (r.v >= m.v) m = { ...r, k: m.k };
      }
      return m;
    };

    const total = await lerQuadros(["-i", arquivo, ...filtro], bytes, (b, i) => {
      q.img.set(b);
      preparar(q);
      // diferencia media con el fotograma anterior (encuentra el fotograma exacto de los cortes)
      if (anterior) {
        let d = 0;
        for (let j = 0; j < bytes; j += 3) d += Math.abs(q.img[j] - anterior[j]);
        diferenca.push(d / (bytes / 3));
      } else diferenca.push(0);
      sub.set(q.img);
      anterior = sub;

      const reacha = i === 0 || pertoDeCorte.has(i);
      let m = { v: -2 };
      if (!reacha) {
        // búsqueda local en la escala actual y comprueba las vecinas en el mejor punto
        const r = buscar(q, banco[k], pos.x, pos.y, RAIO_LOCAL, 1);
        m = { ...r, k };
        for (const kk of [k - 1, k + 1]) {
          if (kk < kMin || kk > kMax) continue;
          const r2 = buscar(q, banco[kk], r.x, r.y, 1, 1);
          // el tamaño de la cara cambia despacio: solo cambia de escala con una ganancia clara
          if (r2.v > m.v + 0.01) m = { ...r2, k: kk };
        }
      }
      if (reacha || m.v < BOA) {
        const centros = [pos, p0];
        const ks = [k - 2, k - 1, k, k + 1, k + 2].filter((x) => x >= kMin && x <= kMax);
        const r = buscaLarga(centros, Math.round(Wt * 0.6), ks);
        if (r.v > m.v) m = r;
      }
      if (m.v < ACEITA && (reacha || perdido % 6 === 0)) {
        const r = buscaGlobal();
        if (r.v > m.v) m = r;
      }
      // dentro de un tramo la cara no se teletransporta: un «hallazgo» demasiado lejos del último sitio
      // bueno (un reflejo, la luz del espejo, otra cara) se rechaza, salvo que sea muy fuerte
      if (m.v >= ACEITA && !reacha && ultimoBom) {
        const Wk = Wt * PASSO_ESCALA ** (k - K0);
        const parado = (i - ultimoBom.i) / fps;
        const limite = Wk * (0.3 + 0.8 * parado);
        const longe = Math.hypot(m.x - ultimoBom.x, m.y - ultimoBom.y) > limite;
        // perdida desde hace mucho (la persona salió y volvió): solo acepta un hallazgo fuerte
        const forte = m.v >= 0.8 || (parado > 1.5 && m.v >= 0.7);
        if (longe && !forte) m = { ...m, v: Math.min(m.v, ACEITA - 0.01) };
      }
      if (m.v >= ACEITA) {
        const r = refinar(q, banco[m.k], m);
        pos = { x: r.x, y: r.y };
        k = m.k;
        perdido = 0;
        if (m.v >= BOA) ultimoBom = { x: pos.x, y: pos.y, i };
      } else perdido++;
      X.push(pos.x);
      Y.push(pos.y);
      C.push(Math.max(-1, m.v));
      S.push(k);
      // de vez en cuando, suma el perfil de simetría alrededor del recorte seguido (da el centro real)
      if (m.v >= 0.65 && i % Math.max(1, Math.round(fps / 5)) === 0) somarPerfil(perfil, q.img, L, A, pos.x, pos.y, Wt * PASSO_ESCALA ** (k - K0));
    });
    return { X, Y, C, S, perfil, diferenca, total, escolhida };
  };
  // primera pasada alrededor de la cara medida; si la simetría muestra que la medida falló el centro,
  // una segunda pasada con el recorte ya centrado en la cara (el seguimiento queda más firme)
  // (la segunda pasada tiene que confirmar el centro; si no lo confirma, vale la medida del alumno)
  let resultado = await passada(pRef);
  let centro = null;
  if (opcoes.em === undefined) {
    const c1 = centroDoPerfil(resultado.perfil);
    if (c1 && Math.abs(c1.c) <= 0.08) centro = c1;
    else if (c1) {
      const segunda = await passada({ x: pRef.x + c1.c * Wt, y: pRef.y });
      const c2 = centroDoPerfil(segunda.perfil);
      if (c2 && Math.abs(c2.c) <= 0.05) {
        resultado = segunda;
        centro = c2;
      }
    }
  }
  const { X, Y, C, S, perfil, diferenca, total, escolhida } = resultado;
  if (total === 0) throw new Error("No he podido leer los fotogramas del vídeo.");

  // 4. Tramos entre cortes (en el fotograma exacto del corte)
  const cortes = cortesNominais
    .map((c) => {
      let melhor = c;
      for (let j = c - 2; j <= c + 2; j++) if (j > 0 && j < total && diferenca[j] > (diferenca[melhor] ?? -1)) melhor = j;
      return melhor;
    })
    .filter((c) => c > 0 && c < total);
  const limites = [0, ...new Set(cortes), total].sort((a, b) => a - b);
  const trechos = [];
  for (let j = 0; j < limites.length - 1; j++) if (limites[j + 1] > limites[j]) trechos.push({ de: limites[j], ate: limites[j + 1] });

  // 5. Fotogramas débiles: salen del recorrido (interpolado entre los vecinos buenos del mismo tramo).
  // Un tramo con poca cosa fiable se queda quieto.
  const bom = C.map((c) => c >= ACEITA + 0.05);
  const fx = new Float64Array(total);
  const fy = new Float64Array(total);
  for (let i = 0; i < total; i++) {
    const p = paraFracao({ x: X[i], y: Y[i] });
    fx[i] = p.x;
    fy[i] = p.y;
  }
  // escapadas cortas (el seguimiento saltó a otra cosa y volvió): lejos de la mediana móvil de
  // ~1 s del propio tramo, salen del recorrido
  for (const t of trechos) {
    const idx = [];
    for (let i = t.de; i < t.ate; i++) if (bom[i]) idx.push(i);
    if (idx.length < 5) continue;
    const xs = Float64Array.from(idx, (i) => X[i]);
    const ys = Float64Array.from(idx, (i) => Y[i]);
    const meia = Math.max(2, Math.round(fps * 0.5));
    const mx = medianaCorrida(xs, meia);
    const my = medianaCorrida(ys, meia);
    idx.forEach((i, j) => {
      if (Math.hypot(xs[j] - mx[j], ys[j] - my[j]) > Wt * PASSO_ESCALA ** (S[i] - K0) * 0.3) bom[i] = false;
    });
    // quien habla a cámara casi no sube ni baja más de ~media cara: un trozo del recorrido
    // muy por encima o por debajo del resto del tramo es un error (pelo, un objeto, otra cosa)
    const meioY = mediana(ys);
    idx.forEach((i, j) => {
      if (Math.abs(ys[j] - meioY) > Wt * 0.7) bom[i] = false;
    });
  }
  const validos = [];
  for (const t of trechos) {
    const idx = [];
    for (let i = t.de; i < t.ate; i++) if (bom[i]) idx.push(i);
    t.confiavel = idx.length >= (t.ate - t.de) * 0.6 && idx.length >= 3;
    if (!t.confiavel) continue;
    validos.push(...idx);
    let ultimo = -1;
    for (let i = t.de; i < t.ate; i++) {
      if (bom[i]) {
        if (ultimo >= 0 && i - ultimo > 1)
          for (let j = ultimo + 1; j < i; j++) {
            const a = (j - ultimo) / (i - ultimo);
            fx[j] = fx[ultimo] + (fx[i] - fx[ultimo]) * a;
            fy[j] = fy[ultimo] + (fy[i] - fy[ultimo]) * a;
          }
        else if (ultimo < 0) for (let j = t.de; j < i; j++) ((fx[j] = fx[i]), (fy[j] = fy[i]));
        ultimo = i;
      }
    }
    for (let j = ultimo + 1; j < t.ate; j++) ((fx[j] = fx[ultimo]), (fy[j] = fy[ultimo]));
  }

  const confiaveis = validos.length / total;
  if (process.env.RASTRO_DEPURAR) gravarJson("work/rastro-depurar.json", { L, A, f, Wt, X, Y, C, S, perfil: Array.from(perfil.soma, (v, k) => (perfil.cont[k] ? v / perfil.cont[k] : 0)), cortes, referencia: escolhida.t });
  const relatorio = {
    quadros: total,
    confiaveis,
    trechos: trechos.length,
    trechosParados: trechos.filter((t) => !t.confiavel).map((t) => [t.de / fps, t.ate / fps]),
    largura,
    escalaReferencia: escolhida.t,
  };
  if (confiaveis < 0.6) return { rastro: null, relatorio };

  // 6. Posición absoluta. El recorte de referencia se tomó alrededor del `rosto` medido, que puede
  // haber fallado un poco. En horizontal, el eje de simetría de la cara da el centro real; en
  // vertical (y sin simetría fiable), la posición más habitual del recorrido es el `rosto` medido.
  // Con --em/--x/--y, vale el punto medido en ese fotograma.
  let dx;
  let dy;
  relatorio.simetria = { amostras: perfil.n, nota: centro?.v ?? null };
  // el desplazamiento es del recorte seguido, con el tamaño más habitual de la cara
  const escalaComum = mediana(validos.map((i) => PASSO_ESCALA ** (S[i] - K0)));
  const deslocamento = centro ? (centro.c * Wt * escalaComum * f) / 1080 : 0;
  if (opcoes.em !== undefined) {
    const iRef = Math.min(total - 1, Math.max(0, Math.round(Number(opcoes.em) * fps)));
    dx = refRosto.x - fx[iRef];
    dy = refRosto.y - fy[iRef];
  } else {
    dy = rostoFixo.y - mediana(validos.map((i) => fy[i]));
    if (centro) {
      for (let i = 0; i < total; i++) fx[i] += deslocamento;
      dx = 0;
    } else dx = rostoFixo.x - mediana(validos.map((i) => fx[i]));
  }
  relatorio.centroX = mediana(validos.map((i) => fx[i] + dx));
  relatorio.centroPorSimetria = !!centro;

  // 7. Recorrido fino (para lo que va encima de la cara) y recorrido de la cámara (para la caja)
  const ox = new Float64Array(total);
  const oy = new Float64Array(total);
  const cx = new Float64Array(total);
  const cy = new Float64Array(total);
  const larguraPx = largura * 1080;
  for (const t of trechos) {
    const n = t.ate - t.de;
    if (!t.confiavel) {
      for (let i = t.de; i < t.ate; i++) ((ox[i] = cx[i] = rostoFixo.x), (oy[i] = cy[i] = rostoFixo.y));
      continue;
    }
    // en px del fotograma de 1080×1920 (las dos direcciones con la misma medida)
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      px[j] = (fx[t.de + j] + dx) * 1080;
      py[j] = (fy[t.de + j] + dy) * 1920;
    }
    const fino = { x: gaussiana(medianaCorrida(px, 2), fps * 0.05), y: gaussiana(medianaCorrida(py, 2), fps * 0.05) };
    const cam = caminhoDaCamera(fino.x, fino.y, fps, larguraPx);
    for (let j = 0; j < n; j++) {
      ox[t.de + j] = fino.x[j] / 1080;
      oy[t.de + j] = fino.y[j] / 1920;
      cx[t.de + j] = cam.cx[j] / 1080;
      cy[t.de + j] = cam.cy[j] / 1920;
    }
  }

  const r4 = (v) => Number(v.toFixed(4));
  const lista = (v) => Array.from(v, r4);
  const rastro = {
    passo: Number((1 / fps).toFixed(6)),
    largura: Number(largura.toFixed(3)),
    ref: { ...rostoFixo },
    x: lista(ox),
    y: lista(oy),
    cx: lista(cx),
    cy: lista(cy),
  };
  // cuánto se mueven la persona y la cámara alrededor de la posición más habitual (para el informe)
  const comumX = mediana(ox);
  const comumY = mediana(oy);
  relatorio.movimento = {
    x: percentil(Array.from(cx, (v) => Math.abs(v - comumX) * 1080), 0.98),
    y: percentil(Array.from(cy, (v) => Math.abs(v - comumY) * 1920), 0.98),
    rostoX: percentil(Array.from(ox, (v) => Math.abs(v - comumX) * 1080), 0.98),
    rostoY: percentil(Array.from(oy, (v) => Math.abs(v - comumY) * 1920), 0.98),
  };
  relatorio.confianca = { mediana: mediana(C), p10: percentil(C, 0.1) };
  return { rastro, relatorio };
};

// Dentro del cortar: el centro real (medido por la simetría de la cara) pasa a ser el `rosto` del plan
export const ajustarCentro = (relatorio) => {
  const plano = lerJson("src/plano.json");
  if (!relatorio?.centroPorSimetria || !plano.rosto?.rastro || Math.abs(relatorio.centroX - plano.rosto.x) <= 0.01) return;
  const novo = Number(relatorio.centroX.toFixed(3));
  console.log(`Centro de la cara en el fotograma, comprobado por la simetría: x ${plano.rosto.x} → ${novo}.`);
  plano.rosto.x = novo;
  plano.rosto.rastro.ref.x = novo;
  gravarJson("src/plano.json", plano);
};

// Ejecuta el seguimiento y lo guarda en el plan. Nunca tumba a quien lo llamó: si sale mal, la cara se queda fija.
export const rastrearNoPlano = async (opcoes = {}) => {
  const plano = lerJson("src/plano.json");
  const semRastro = () => {
    const { rastro, ...resto } = plano.rosto ?? {};
    return resto;
  };
  if (opcoes.desligar) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log("Rastro de la cara desactivado: la persona se queda quieta en el encuadre (como la cara fija del plan).");
    return null;
  }
  const inicio = Date.now();
  let resultado;
  try {
    resultado = await rastrearRosto(plano, opcoes);
  } catch (e) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log(`Aviso: no he podido seguir la cara (${e.message.split("\n")[0]}). La persona se queda en el encuadre fijo.`);
    return null;
  }
  const { rastro, relatorio: r } = resultado;
  r.rostoAntes = plano.rosto.x;
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  if (!rastro) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log(
      `Cara: solo el ${Math.round(r.confiaveis * 100)} % de los fotogramas con la cara bien encontrada; he mantenido el encuadre fijo (la caja no sigue la cara).`,
    );
    console.log("Si la cara se ve y está de frente, mide el centro en un fotograma de guías y ejecuta: node scripts/rastrear.mjs --em <s> --x <fracción> --y <fracción>");
    return null;
  }
  plano.rosto = { ...semRastro(), rastro };
  gravarJson("src/plano.json", plano);
  // el centro real (simetría de la cara) pasa a ser el `rosto` del plan (el cortar decide antes
  // si vale la pena rehacer el recorte, por eso pide no ajustarlo aquí)
  if (opcoes.ajustarCentro !== false) ajustarCentro(r);
  const m = r.movimento;
  console.log(
    `Cara seguida en ${r.quadros} fotogramas (${segundos} s): ${Math.round(r.confiaveis * 100)} % fiables · la persona se mueve hasta ~${Math.round(m.rostoX)} px en horizontal y ~${Math.round(m.rostoY)} px en vertical; la caja de la persona la acompaña.`,
  );
  if (r.trechosParados.length) {
    console.log(
      `Aviso: los tramos sin cara fiable se quedan con el encuadre fijo: ${r.trechosParados.map(([a, b]) => `${mmss(a)}–${mmss(b)}`).join(", ")}.`,
    );
  }
  if (opcoes.ajustarCentro !== false && r.centroPorSimetria && Math.abs(r.centroX - (r.rostoAntes ?? r.centroX)) > 0.03) {
    console.log("Para que el recorte también centre la cara, vuelve a ejecutar el cortar.mjs (con --manter-plano): rehace el corte con el centro correcto.");
  }
  return { rastro, relatorio: r };
};

// Fotogramas del vídeo de trabajo con la cuadrícula (la misma del medir-*.jpg) y la cara encontrada por el seguimiento
// marcada: comprueba el rastro y sirve para medir una referencia exacta (--em/--x/--y).
const conferir = async (tempos) => {
  const plano = lerJson("src/plano.json");
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const r = plano.rosto.rastro;
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const altura = 960;
  const largura = Math.round(((1080 / H0) * altura) / 2) * 2;
  const lista = tempos.length ? tempos : [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => plano.duracao * f);
  mkdirSync("public/medir", { recursive: true });
  mkdirSync("out/rastro", { recursive: true });
  lista.forEach((t, i) =>
    ffmpeg(["-y", "-ss", t.toFixed(3), "-i", path.join("public", plano.video ?? "base.mp4"), "-frames:v", "1", "-vf", `scale=${largura}:${altura}`, `public/medir/rastro-${i}.jpg`]),
  );
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  try {
    for (const [i, t] of lista.entries()) {
      const pos = (v) => {
        const p = Math.max(0, Math.min(v.length - 1, t / r.passo));
        const a = Math.floor(p);
        const b = Math.min(v.length - 1, a + 1);
        return v[a] + (v[b] - v[a]) * (p - a);
      };
      const pontos = [{ x: plano.rosto.x, y: (plano.rosto.y * 1920) / H0, rotulo: "fixo", cor: "#FF3BD4" }];
      if (r) pontos.push({ x: pos(r.x), y: (pos(r.y) * 1920) / H0, rotulo: "rastro", cor: "#7CFC00" });
      const inputProps = { imagem: `medir/rastro-${i}.jpg`, largura, altura, pontos };
      const composition = await selectComposition({ serveUrl, id: "Medir", inputProps });
      const saida = `out/rastro/rastro-t${t.toFixed(2).padStart(6, "0")}.jpg`;
      await renderStill({ composition, serveUrl, frame: 0, output: saida, inputProps, imageFormat: "jpeg", logLevel: "error" });
      console.log(saida);
    }
  } finally {
    rmSync(serveUrl, { recursive: true, force: true });
    rmSync("public/medir", { recursive: true, force: true });
  }
  console.log(
    r
      ? "La cruz verde (rastro) debe caer entre los ojos y la punta de la nariz. Si falla, mide el centro de la cara en uno de estos fotogramas (la cuadrícula es la del vídeo de trabajo) y ejecuta: node scripts/rastrear.mjs --em <segundos> --x <fracción> --y <fracción>"
      : "Sin rastro en el plan: la persona se queda en el encuadre fijo (cruz rosa).",
  );
};

// Llamada directa: node scripts/rastrear.mjs [--largura 0.4] [--em 6.5 --x 0.49 --y 0.25] [--desligar] [--conferir 2 6 10]
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  exigirProjeto();
  const { opcoes, posicionais } = argumentos();
  if (opcoes.conferir) {
    await conferir(posicionais.map(Number).filter((n) => Number.isFinite(n)));
    process.exit(0);
  }
  if (opcoes.largura !== undefined && !(Number(opcoes.largura) > 0.08 && Number(opcoes.largura) < 0.95)) {
    throw new Error("--largura es el ancho de la cara en fracción del ancho del fotograma (p. ej.: 0.42).");
  }
  if (opcoes.em !== undefined && (opcoes.x === undefined || opcoes.y === undefined)) {
    throw new Error("Con --em, indica también --x y --y (el centro de la cara en ese fotograma, en fracciones).");
  }
  await rastrearNoPlano({ largura: opcoes.largura, em: opcoes.em, x: opcoes.x, y: opcoes.y, desligar: opcoes.desligar === true });
}
