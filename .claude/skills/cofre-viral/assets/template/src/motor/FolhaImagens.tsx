// Parte del motor: la hoja de comprobación de las imágenes (work/imagens.jpg) y el conversor de
// formatos que el ffmpeg de Remotion no lee (WebP, AVIF, SVG). No entra en el vídeo final.
//
// Este archivo tiene su propia raíz (registerRoot): el scripts/imagens.mjs empaqueta solo este, sin
// depender del Root del modelo. Ninguna plantilla importa este archivo.
import { AbsoluteFill, type CalculateMetadataFunction, Composition, Img, registerRoot, staticFile } from "remotion";

// ---------- la hoja ----------

export type CandidataNaFolha = {
  n: number;
  // ruta dentro de la carpeta servida (public/img): "candidatas/miel-1.jpg"
  src: string;
  largura: number;
  altura: number;
  transparente?: boolean;
  fonte: string;
  licenca: string;
  // true = CC BY: necesita crédito en la publicación
  credito?: boolean;
  escolhida?: boolean;
  foco?: { x: number; y: number };
};

export type PedidoNaFolha = {
  numero: number;
  id: string;
  palavra: string;
  busca: string;
  tipo: string;
  em?: number;
  avisos: string[];
  candidatas: CandidataNaFolha[];
};

export type PropsDaFolha = { titulo: string; pedidos: PedidoNaFolha[]; largura: number; altura: number };

// medidas de la hoja (px). La hoja tiene 1900 de ancho; la altura depende del número de pedidos.
export const FOLHA = { largura: 1900, margem: 32, rotulo: 300, celula: 240, vao: 14, legenda: 50, linha: 330, topo: 92 };
export const alturaDaFolha = (pedidos: number) => FOLHA.topo + pedidos * FOLHA.linha + 16;

const FONTE = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const AMARELO = "#FFD400";
const LARANJA = "#FF9A3C";
const VERDE = "#3DDC84";
const CIANO = "rgba(0,229,255,0.55)";

const segundos = (t: number) => `${t.toFixed(1).replace(".", ",")} s`;

// damero detrás de las imágenes transparentes, para que se vea el recorte
const XADREZ: React.CSSProperties = {
  backgroundColor: "#d9d9d9",
  backgroundImage:
    "linear-gradient(45deg,#bdbdbd 25%,transparent 25%),linear-gradient(-45deg,#bdbdbd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bdbdbd 75%),linear-gradient(-45deg,transparent 75%,#bdbdbd 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
};

const Celula: React.FC<{ c: CandidataNaFolha }> = ({ c }) => {
  const L = FOLHA.celula;
  // la imagen entera (contain): el foco marcado vale para toda la imagen
  const s = Math.min(L / c.largura, L / c.altura);
  const w = c.largura * s;
  const h = c.altura * s;
  const x0 = (L - w) / 2;
  const y0 = (L - h) / 2;
  const pequena = Math.max(c.largura, c.altura) < 1000 && !c.transparente;
  const linhas = [0.25, 0.5, 0.75];
  return (
    <div style={{ width: L, display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          position: "relative",
          width: L,
          height: L,
          background: "#262626",
          outline: c.escolhida ? `5px solid ${VERDE}` : "none",
          outlineOffset: 2,
        }}
      >
        <div style={{ position: "absolute", left: x0, top: y0, width: w, height: h, ...(c.transparente ? XADREZ : {}) }}>
          <Img src={staticFile(c.src)} style={{ width: "100%", height: "100%", display: "block" }} />
          {/* cuadrícula de foco: 0,25 / 0,5 / 0,75 de la imagen */}
          {linhas.map((f) => (
            <div key={`v${f}`}>
              <div style={{ position: "absolute", left: `${f * 100}%`, top: 0, bottom: 0, width: f === 0.5 ? 2 : 1, background: CIANO }} />
              <div style={{ position: "absolute", top: `${f * 100}%`, left: 0, right: 0, height: f === 0.5 ? 2 : 1, background: CIANO }} />
            </div>
          ))}
          {c.escolhida && c.foco ? (
            <div
              style={{
                position: "absolute",
                left: `calc(${c.foco.x * 100}% - 13px)`,
                top: `calc(${c.foco.y * 100}% - 13px)`,
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: `4px solid ${VERDE}`,
                boxShadow: "0 0 0 2px rgba(0,0,0,0.6)",
              }}
            />
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            minWidth: 54,
            height: 54,
            background: AMARELO,
            color: "#000",
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 42,
            lineHeight: "54px",
            textAlign: "center",
          }}
        >
          {c.n}
        </div>
        {c.escolhida ? (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              background: VERDE,
              color: "#000",
              fontFamily: FONTE,
              fontWeight: 800,
              fontSize: 18,
              padding: "4px 8px",
            }}
          >
            ELEGIDA
          </div>
        ) : null}
      </div>
      <div style={{ fontFamily: FONTE, fontSize: 17, lineHeight: 1.2, color: "#ddd" }}>
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: c.credito ? LARANJA : "#9be7a8", fontWeight: 700 }}>{c.licenca}</span>
          <span style={{ color: pequena ? LARANJA : "#bbb" }}>
            {" · "}
            {c.largura}×{c.altura}
            {c.transparente ? " · transparente" : ""}
            {pequena ? " · pequeña" : ""}
          </span>
        </div>
        <div style={{ color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.fonte.replace("Wikimedia Commons", "Commons")}</div>
      </div>
    </div>
  );
};

const Linha: React.FC<{ p: PedidoNaFolha }> = ({ p }) => (
  <div style={{ display: "flex", gap: 24, height: FOLHA.linha - 22, borderTop: "1px solid #333", paddingTop: 14 }}>
    <div style={{ width: FOLHA.rotulo, flexShrink: 0, fontFamily: FONTE, color: "#fff", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 18, color: "#888", fontWeight: 700 }}>PEDIDO {p.numero}</div>
      <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.05, overflowWrap: "anywhere" }}>{p.palavra}</div>
      <div style={{ fontSize: 19, fontFamily: "Menlo, Consolas, monospace", color: AMARELO }}>id: {p.id}</div>
      <div style={{ fontSize: 18, color: "#bbb", overflowWrap: "anywhere" }}>búsqueda: {p.busca || "—"}</div>
      <div style={{ fontSize: 18, color: "#bbb" }}>
        {p.tipo}
        {p.em !== undefined ? ` · ${segundos(p.em)}` : ""}
      </div>
      {p.avisos.slice(0, 3).map((a, i) => (
        <div key={i} style={{ fontSize: 16, color: LARANJA, lineHeight: 1.2 }}>
          {a}
        </div>
      ))}
    </div>
    {p.candidatas.length ? (
      <div style={{ display: "flex", gap: FOLHA.vao }}>
        {p.candidatas.map((c) => (
          <Celula key={c.n} c={c} />
        ))}
      </div>
    ) : (
      <div
        style={{
          width: 6 * FOLHA.celula + 5 * FOLHA.vao,
          height: FOLHA.celula,
          border: "3px dashed #555",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTE,
          fontSize: 30,
          fontWeight: 700,
          color: "#aaa",
        }}
      >
        SIN CANDIDATAS: pasa a tarjeta tipográfica (o el alumno manda la imagen)
      </div>
    )}
  </div>
);

export const Folha: React.FC<PropsDaFolha> = ({ titulo, pedidos }) => (
  <AbsoluteFill style={{ backgroundColor: "#111", padding: FOLHA.margem, paddingTop: 22 }}>
    <div style={{ fontFamily: FONTE, color: "#fff", height: FOLHA.topo - 22, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 30, fontWeight: 800 }}>{titulo}</div>
      <div style={{ fontSize: 19, color: "#bbb" }}>
        Número amarillo = candidata. Líneas finas = 0,25 / 0,5 / 0,75 de la imagen (para el foco). Naranja = necesita crédito o es pequeña.
        Elige: <span style={{ color: AMARELO, fontFamily: "Menlo, Consolas, monospace" }}>--escolher &lt;id&gt; &lt;n&gt; --foco x,y</span> (0 = sin imagen)
      </div>
    </div>
    {pedidos.map((p) => (
      <Linha key={p.id} p={p} />
    ))}
  </AbsoluteFill>
);

const metadadosDaFolha: CalculateMetadataFunction<PropsDaFolha> = ({ props }) => ({ width: props.largura, height: props.altura });

// ---------- el conversor ----------
// Dibuja la imagen a su tamaño natural (hasta `lado` en el lado mayor) con fondo transparente. El
// imagens.mjs la guarda como PNG y después la normaliza con ffmpeg, como cualquier otra.

export type PropsDoConversor = { src: string; lado: number; vetor?: boolean };

const medirNoNavegador = (src: string) =>
  new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error(`no se ha abierto ${src}`));
    img.src = staticFile(src);
  });

const metadadosDoConversor: CalculateMetadataFunction<PropsDoConversor> = async ({ props }) => {
  let { w, h } = await medirNoNavegador(props.src);
  // SVG sin ancho/alto declarados: cuadrado
  if (!w || !h) {
    w = props.lado;
    h = props.lado;
  }
  // un vector puede crecer hasta el lado; una foto solo encoge
  const s = props.vetor ? props.lado / Math.max(w, h) : Math.min(1, props.lado / Math.max(w, h));
  return { width: Math.max(2, Math.round(w * s)), height: Math.max(2, Math.round(h * s)) };
};

export const Conversor: React.FC<PropsDoConversor> = ({ src }) => (
  <AbsoluteFill>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
  </AbsoluteFill>
);

const Raiz: React.FC = () => (
  <>
    <Composition
      id="Folha"
      component={Folha}
      durationInFrames={1}
      fps={30}
      width={FOLHA.largura}
      height={alturaDaFolha(4)}
      defaultProps={{ titulo: "Imágenes", pedidos: [], largura: FOLHA.largura, altura: alturaDaFolha(4) }}
      calculateMetadata={metadadosDaFolha}
    />
    <Composition
      id="Conversor"
      component={Conversor}
      durationInFrames={1}
      fps={30}
      width={1600}
      height={1600}
      defaultProps={{ src: "", lado: 1600 }}
      calculateMetadata={metadadosDoConversor}
    />
  </>
);

registerRoot(Raiz);
