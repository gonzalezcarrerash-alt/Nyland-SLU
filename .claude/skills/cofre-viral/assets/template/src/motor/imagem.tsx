// Parte del motor: fotos y objetos que entran al ritmo de la voz («dice "miel" y aparece el tarro»).
//
// El scripts/imagens.mjs busca, descarga y guarda la elección en `plano.imagens`; aquí están las piezas
// que usan los modelos para mostrarlas:
//   <Foto>       foto encuadrada por el punto de foco, con acercamiento lento (Ken Burns) y entrada a tiempo
//   <Recorte>    PNG transparente (objeto 3D, recorte del alumno) que entra como una pegatina
//   <SemImagem>  la tarjeta tipográfica para cuando no hay una imagen buena (nunca queda un hueco)
// Lo visual (borde, sombra, esquinas, colores, fuente) es de cada modelo, por props: estas piezas solo
// se ocupan del encuadre, del movimiento y del tiempo.
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// ---------- tipos ----------

// punto de foco en fracciones de la imagen entera (0,0 = esquina de arriba a la izquierda)
export type Foco = { x: number; y: number };

// lo que el imagens.mjs guarda en `plano.imagens[id]`
export type ImagemEscolhida = {
  // ruta dentro de public/: "img/miel.jpg"
  arquivo?: string;
  largura?: number;
  altura?: number;
  foco?: Foco;
  transparente?: boolean;
  // true = ninguna imagen buena: el modelo dibuja la tarjeta
  sem?: boolean;
  // la palabra dicha (la usa la tarjeta)
  palavra?: string;
};
export type ImagensDoPlano = Record<string, ImagemEscolhida>;

export type Efeito = "aproximar" | "afastar" | "panoramica" | "parado";
export type Direcao = "esquerda" | "direita" | "cima" | "baixo";
export type EntradaFoto = "corte" | "fade" | "subir" | "escala" | "revelar";
export type SaidaFoto = "corte" | "fade" | "escala";
export type EntradaRecorte = "escala" | "salto" | "cair" | "subir" | "corte";

// el campo que usa un momento del plan para pedir una imagen: `imagem: { id: "miel", efeito: "aproximar" }`
export type ImagemNoMomento = { id: string; foco?: Foco; efeito?: Efeito };

// la imagen lista para las piezas: lo que viene del plan más el id
export type Imagem = ImagemEscolhida & { id?: string };

// ---------- funciones ----------

const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
export const suaveEntrada = Easing.bezier(0.16, 1, 0.3, 1);
const progresso = (t: number, inicio: number, dur: number, easing: (n: number) => number = suaveEntrada) =>
  dur <= 0 ? (t >= inicio ? 1 : 0) : interpolate(t, [inicio, inicio + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Encuentra la imagen de un momento en el plan: `imagemDoPlano(plano, momento.imagem)` o `imagemDoPlano(plano, "miel")`.
// Devuelve null cuando el id no está en el plan (ejecuta `node scripts/imagens.mjs --escolher ...`).
// El `foco` del momento, si lo hay, manda sobre el foco elegido.
export const imagemDoPlano = (plano: { imagens?: ImagensDoPlano }, ref: string | ImagemNoMomento | undefined | null): Imagem | null => {
  if (!ref) return null;
  const id = typeof ref === "string" ? ref : ref.id;
  const achada = plano.imagens?.[id];
  if (!achada) return null;
  const foco = typeof ref === "string" ? undefined : ref.foco;
  return { ...achada, id, ...(foco ? { foco } : {}) };
};

// true cuando hay un archivo que mostrar
export const temImagem = (img: Imagem | null | undefined): img is Imagem & { arquivo: string } => !!img && !img.sem && !!img.arquivo;

// Dónde queda la foto dentro de una caja de `W`×`H` (px) en "cover", con el foco lo más cerca posible
// del centro sin dejar borde vacío. Devuelve el rectángulo de la imagen y dónde cayó el foco (px en la caja).
export const enquadrarFoto = (W: number, H: number, iw: number, ih: number, foco: Foco = { x: 0.5, y: 0.5 }) => {
  const s = Math.max(W / iw, H / ih);
  const w = iw * s;
  const h = ih * s;
  const x = limitar(W / 2 - foco.x * w, W - w, 0);
  const y = limitar(H / 2 - foco.y * h, H - h, 0);
  return { x, y, w, h, escala: s, focoX: x + foco.x * w, focoY: y + foco.y * h };
};

// El movimiento lento dentro de la caja, en unidades de la caja (1 = ancho/alto de la caja).
// `p` va de 0 a 1 a lo largo del tiempo de la foto. `ox`,`oy`: el punto que se queda quieto en el zoom (el foco).
// `ret`: el rectángulo de la imagen en la caja (izquierda, derecha, arriba, abajo), para no mostrar nunca el borde.
export const kenBurns = (
  efeito: Efeito,
  p: number,
  intensidade: number,
  direcao: Direcao,
  ox: number,
  oy: number,
  ret: { e: number; d: number; t: number; b: number } = { e: 0, d: 1, t: 0, b: 1 },
) => {
  const i = Math.max(0, intensidade);
  if (efeito === "parado") return { z: 1, tx: 0, ty: 0 };
  if (efeito === "aproximar") return { z: 1 + i * p, tx: 0, ty: 0 };
  if (efeito === "afastar") return { z: 1 + i * (1 - p), tx: 0, ty: 0 };
  // panorámica: acerca un poco para tener margen y se desliza dentro del margen
  const z = 1 + Math.max(i, 0.06);
  const horizontal = direcao === "esquerda" || direcao === "direita";
  const [o, a, b] = horizontal ? [ox, ret.e, ret.d] : [oy, ret.t, ret.b];
  // límites del desplazamiento para que la imagen siga cubriendo la caja
  const min = 1 - o - (b - o) * z;
  const max = -o - (a - o) * z;
  const curso = Math.min(Math.max(0, max - min), i * 1.4);
  const centro = limitar(0, min + curso / 2, max - curso / 2);
  // "direita" = la cámara va hacia la derecha (la imagen va hacia la izquierda)
  const ida = direcao === "direita" || direcao === "baixo";
  const d = ida ? centro + curso / 2 - curso * p : centro - curso / 2 + curso * p;
  return horizontal ? { z, tx: d, ty: 0 } : { z, tx: 0, ty: d };
};

// Opacidad y transformación de la entrada y de la salida (para modelos que montan su propio marco).
export const entradaSaida = (
  t: number,
  de: number,
  ate: number | undefined,
  entrada: EntradaFoto,
  durEntrada: number,
  saida: SaidaFoto,
  durSaida: number,
) => {
  const pe = entrada === "corte" ? (t >= de ? 1 : 0) : progresso(t, de, durEntrada);
  const ps = ate === undefined || saida === "corte" ? 0 : progresso(t, ate - durSaida, durSaida, Easing.in(Easing.cubic));
  let opacidade = 1;
  let transform = "";
  let clipPath: string | undefined;
  if (entrada === "fade") opacidade *= pe;
  if (entrada === "subir") {
    opacidade *= pe;
    transform += ` translateY(${(1 - pe) * 8}%)`;
  }
  if (entrada === "escala") {
    opacidade *= pe;
    transform += ` scale(${0.92 + 0.08 * pe})`;
  }
  if (entrada === "revelar") clipPath = `inset(0 ${(1 - pe) * 100}% 0 0)`;
  if (saida === "fade") opacidade *= 1 - ps;
  if (saida === "escala") {
    opacidade *= 1 - ps;
    transform += ` scale(${1 - 0.06 * ps})`;
  }
  return { opacidade, transform: transform.trim() || undefined, clipPath, entrou: pe };
};

const useRelogio = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, agora: frame / fps };
};

// ---------- <SemImagem>: la tarjeta tipográfica ----------

// palabras átonas del español (artículos, preposiciones, conjunciones, pronombres átonos y posesivos):
// ninguna línea puede acabar en una de ellas
const ATONAS = new Set(
  "a al ante bajo con contra de del desde durante e el en entre hacia hasta la las le les lo los mas me mediante mi mis ni nos o os para pero por que se si sin sino sobre su sus te tras tu tus u un una unas unos y".split(" "),
);
const atona = (w: string) => ATONAS.has(w.toLowerCase().replace(/[^\p{L}]/gu, ""));

// corta en hasta 3 líneas equilibradas y busca el cuerpo más grande que cabe
const caberTexto = (texto: string, W: number, H: number, larguraDaLetra = 0.58, entrelinha = 1.08) => {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  let melhor = { linhas: [texto], corpo: 10 };
  for (let n = 1; n <= Math.min(3, Math.max(1, palavras.length)); n++) {
    // corte voraz con un objetivo de caracteres por línea
    const alvo = Math.ceil(texto.length / n);
    const linhas: string[] = [];
    let atual = "";
    for (const p of palavras) {
      if (atual && (atual + " " + p).length > alvo && linhas.length < n - 1) {
        linhas.push(atual);
        atual = p;
      } else atual = atual ? `${atual} ${p}` : p;
    }
    if (atual) linhas.push(atual);
    // "de", "y", "la" solos en una línea quedan raros: se juntan con la línea de abajo
    for (let k = linhas.length - 2; k >= 0; k--)
      if (linhas[k].length <= 3) {
        linhas[k + 1] = `${linhas[k]} ${linhas[k + 1]}`;
        linhas.splice(k, 1);
      }
    if (linhas.length > 1 && linhas[linhas.length - 1].length <= 3) linhas.splice(-2, 2, `${linhas[linhas.length - 2]} ${linhas[linhas.length - 1]}`);
    // ninguna línea (salvo la última) acaba en átona: «La casa de | mi madre» no; «La casa | de mi madre» sí
    for (let k = 0; k < linhas.length - 1; k++) {
      const ps = linhas[k].split(" ");
      while (ps.length > 1 && atona(ps[ps.length - 1])) linhas[k + 1] = `${ps.pop()} ${linhas[k + 1]}`;
      linhas[k] = ps.join(" ");
    }
    const maior = Math.max(...linhas.map((l) => l.length), 1);
    const corpo = Math.min((W * 0.84) / (maior * larguraDaLetra), (H * 0.74) / (linhas.length * entrelinha), H * 0.34);
    if (corpo > melhor.corpo) melhor = { linhas, corpo };
  }
  return melhor;
};

export type PropsSemImagem = {
  texto: string;
  largura: number;
  altura: number;
  de?: number;
  ate?: number;
  entrada?: EntradaFoto;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // lo visual del modelo
  fundo?: string;
  cor?: string;
  fonte?: string;
  peso?: number;
  // texto pequeño encima de la palabra (p. ej.: "imagina:")
  rotulo?: string;
  // true = etiqueta naranja "sin imagen · id", para las guías de comprobación (nunca en el vídeo final)
  aviso?: boolean;
  id?: string;
  style?: React.CSSProperties;
  t?: number;
};

export const SemImagem: React.FC<PropsSemImagem> = ({
  texto,
  largura,
  altura,
  de = 0,
  ate,
  entrada = "fade",
  durEntrada = 0.3,
  saida = "corte",
  durSaida = 0.25,
  fundo = "#161616",
  cor = "#F4F1EA",
  fonte = "inherit",
  peso = 800,
  rotulo,
  aviso = false,
  id,
  style,
  t,
}) => {
  const { agora } = useRelogio();
  const tempo = t ?? agora;
  if (tempo < de || (ate !== undefined && tempo > ate)) return null;
  const { linhas, corpo } = caberTexto(texto || "?", largura, altura * (rotulo ? 0.8 : 1));
  const es = entradaSaida(tempo, de, ate, entrada, durEntrada, saida, durSaida);
  // la palabra crece un poco mientras está en pantalla: la tarjeta nunca se queda quieta
  const vida = ate !== undefined ? Math.min(1, (tempo - de) / Math.max(0.5, ate - de)) : Math.min(1, (tempo - de) / 4);
  return (
    <div
      style={{
        position: "relative",
        width: largura,
        height: altura,
        overflow: "hidden",
        background: fundo,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: es.opacidade,
        transform: es.transform,
        clipPath: es.clipPath,
        ...style,
      }}
    >
      {rotulo ? (
        <div style={{ fontFamily: fonte, color: cor, opacity: 0.7, fontSize: Math.max(18, corpo * 0.28), fontWeight: 600, marginBottom: corpo * 0.12 }}>{rotulo}</div>
      ) : null}
      <div style={{ transform: `scale(${1 + 0.04 * vida})`, textAlign: "center" }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: peso, fontSize: corpo, lineHeight: 1.08, color: cor, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {aviso ? (
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            background: "#FF8A00",
            color: "#000",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            padding: "3px 8px",
          }}
        >
          sin imagen{id ? ` · ${id}` : ""}
        </div>
      ) : null}
    </div>
  );
};

// ---------- <Foto> ----------

export type PropsFoto = {
  // la imagen del plan (imagemDoPlano) o una ruta dentro de public/ ("img/miel.jpg")
  imagem?: Imagem | null;
  src?: string;
  // por encima del foco guardado
  foco?: Foco;
  // tiempo en que la foto entra y sale (segundos, con el mismo reloj del componente; mira `t`)
  de?: number;
  ate?: number;
  // movimiento lento: "aproximar" (por defecto), "afastar", "panoramica" o "parado"
  efeito?: Efeito;
  // cuánto avanza el movimiento en el tiempo de la foto: 0,1 = 10 % de zoom
  intensidade?: number;
  // panorámica: hacia dónde va la cámara
  direcao?: Direcao;
  entrada?: EntradaFoto;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // tamaño de la caja en px. Con los dos, el foco queda centrado de verdad; sin ellos la foto
  // llena el padre (100 %) y el foco se ve, pero no necesariamente en el centro.
  largura?: number;
  altura?: number;
  // lo visual del modelo: borde, sombra, radio, posición…
  style?: React.CSSProperties;
  // en la propia imagen (p. ej.: un filter para igualar el color con el modelo)
  estiloDaImagem?: React.CSSProperties;
  // cuando no hay imagen: tarjeta con la palabra (por defecto) o lo que quiera el modelo
  semImagem?: React.ReactNode;
  // props de la tarjeta por defecto (colores y fuente del modelo)
  cartao?: Partial<PropsSemImagem>;
  // tiempo actual en segundos; sin esto, usa el fotograma actual (dentro de <Sequence>, el tiempo de la Sequence)
  t?: number;
  // segundos antes de `de` en los que la imagen ya está montada (invisible), para que cargue sin parpadear
  antes?: number;
};

export const Foto: React.FC<PropsFoto> = ({
  imagem,
  src,
  foco,
  de = 0,
  ate,
  efeito = "aproximar",
  intensidade = 0.1,
  direcao = "direita",
  entrada = "corte",
  durEntrada = 0.35,
  saida = "corte",
  durSaida = 0.25,
  largura,
  altura,
  style,
  estiloDaImagem,
  semImagem,
  cartao,
  t,
  antes = 0.5,
}) => {
  const { agora } = useRelogio();
  const tempo = t ?? agora;
  if (tempo < de - antes || (ate !== undefined && tempo > ate)) return null;
  const arquivo = src ?? (temImagem(imagem) ? imagem.arquivo : undefined);

  if (!arquivo) {
    if (tempo < de) return null;
    if (semImagem !== undefined) return <>{semImagem}</>;
    return (
      <SemImagem
        texto={imagem?.palavra ?? imagem?.id ?? ""}
        largura={largura ?? 1080}
        altura={altura ?? 1920}
        de={de}
        ate={ate}
        entrada={entrada}
        durEntrada={durEntrada}
        saida={saida}
        durSaida={durSaida}
        id={imagem?.id}
        style={style}
        t={tempo}
        {...cartao}
      />
    );
  }

  const f = foco ?? imagem?.foco ?? { x: 0.5, y: 0.5 };
  const iw = imagem?.largura;
  const ih = imagem?.altura;
  const exato = !!(largura && altura && iw && ih);
  const dur = ate !== undefined ? Math.max(0.1, ate - de) : 4;
  const p = limitar((tempo - de) / dur, 0, 1);
  const es = entradaSaida(tempo, de, ate, entrada, durEntrada, saida, durSaida);
  const visivel = tempo >= de;

  let estiloImg: React.CSSProperties;
  if (exato) {
    const W = largura as number;
    const H = altura as number;
    const q = enquadrarFoto(W, H, iw as number, ih as number, f);
    const kb = kenBurns(efeito, p, intensidade, direcao, q.focoX / W, q.focoY / H, {
      e: q.x / W,
      d: (q.x + q.w) / W,
      t: q.y / H,
      b: (q.y + q.h) / H,
    });
    estiloImg = {
      position: "absolute",
      left: q.x,
      top: q.y,
      width: q.w,
      height: q.h,
      maxWidth: "none",
      transformOrigin: `${q.focoX - q.x}px ${q.focoY - q.y}px`,
      transform: `translate(${kb.tx * W}px, ${kb.ty * H}px) scale(${kb.z})`,
    };
  } else {
    // sin el tamaño de la caja: objectPosition en el foco deja el foco en el mismo sitio relativo de la caja
    const kb = kenBurns(efeito, p, intensidade, direcao, f.x, f.y);
    estiloImg = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: `${f.x * 100}% ${f.y * 100}%`,
      transformOrigin: `${f.x * 100}% ${f.y * 100}%`,
      transform: `translate(${kb.tx * 100}%, ${kb.ty * 100}%) scale(${kb.z})`,
    };
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: largura ?? "100%",
        height: altura ?? "100%",
        opacity: visivel ? es.opacidade : 0,
        transform: es.transform,
        clipPath: es.clipPath,
        ...style,
      }}
    >
      <Img src={staticFile(arquivo)} style={{ ...estiloImg, ...estiloDaImagem }} />
    </div>
  );
};

// ---------- <Recorte>: objeto con fondo transparente, como una pegatina ----------

export type PropsRecorte = {
  imagem?: Imagem | null;
  src?: string;
  de?: number;
  ate?: number;
  // ancho de la pegatina en px (la altura sigue la proporción de la imagen)
  largura?: number;
  // "escala" (por defecto, sin rebote), "salto" (muelle que se pasa un poco del punto), "cair", "subir", "corte"
  entrada?: EntradaRecorte;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // balanceo lento mientras está en pantalla (la pegatina nunca se queda quieta); false lo desactiva
  flutuar?: boolean;
  // inclinación en reposo, en grados
  giro?: number;
  // filtro de sombra (CSS drop-shadow); false la quita
  sombra?: string | false;
  style?: React.CSSProperties;
  estiloDaImagem?: React.CSSProperties;
  // cuando no hay imagen: lo que quiera el modelo (por defecto: nada; el modelo decide si muestra una tarjeta)
  semImagem?: React.ReactNode;
  t?: number;
  antes?: number;
};

export const Recorte: React.FC<PropsRecorte> = ({
  imagem,
  src,
  de = 0,
  ate,
  largura = 360,
  entrada = "escala",
  durEntrada = 0.45,
  saida = "escala",
  durSaida = 0.22,
  flutuar = true,
  giro = 0,
  sombra = "drop-shadow(0 18px 28px rgba(0,0,0,0.35))",
  style,
  estiloDaImagem,
  semImagem = null,
  t,
  antes = 0.5,
}) => {
  const { fps, agora } = useRelogio();
  const tempo = t ?? agora;
  if (tempo < de - antes || (ate !== undefined && tempo > ate)) return null;
  const arquivo = src ?? (temImagem(imagem) ? imagem.arquivo : undefined);
  if (!arquivo) return tempo >= de ? <>{semImagem}</> : null;

  const proporcao = imagem?.largura && imagem?.altura ? imagem.altura / imagem.largura : 1;
  const altura = largura * proporcao;
  const desde = tempo - de;

  let escala = 1;
  let dy = 0;
  let rot = giro;
  let opacidade = 1;
  if (entrada === "escala") {
    const pe = progresso(tempo, de, durEntrada);
    escala = 0.55 + 0.45 * pe;
    opacidade = Math.min(1, pe * 2.5);
  } else if (entrada === "salto") {
    const s = spring({ frame: Math.round(desde * fps), fps, config: { damping: 13, stiffness: 170, mass: 0.8 } });
    escala = Math.max(0, s);
    opacidade = Math.min(1, s * 3);
  } else if (entrada === "cair") {
    const pe = progresso(tempo, de, durEntrada, Easing.bezier(0.3, 0.9, 0.35, 1));
    dy = -(1 - pe) * altura * 0.9;
    rot = giro - 10 * (1 - pe);
    opacidade = Math.min(1, pe * 3);
  } else if (entrada === "subir") {
    const pe = progresso(tempo, de, durEntrada);
    dy = (1 - pe) * altura * 0.35;
    opacidade = pe;
  } else if (desde < 0) opacidade = 0;

  if (ate !== undefined && saida !== "corte") {
    const ps = progresso(tempo, ate - durSaida, durSaida, Easing.in(Easing.cubic));
    opacidade *= 1 - ps;
    if (saida === "escala") escala *= 1 - 0.35 * ps;
  }
  if (flutuar && desde > 0) {
    dy += Math.sin((desde / 3.2) * Math.PI * 2) * largura * 0.018;
    rot += Math.sin((desde / 4.1) * Math.PI * 2) * 1.6;
  }
  if (desde < 0) opacidade = 0;

  return (
    <div style={{ position: "relative", width: largura, height: altura, ...style }}>
      <Img
        src={staticFile(arquivo)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: opacidade,
          transform: `translateY(${dy}px) rotate(${rot}deg) scale(${escala})`,
          filter: sombra || undefined,
          ...estiloDaImagem,
        }}
      />
    </div>
  );
};
