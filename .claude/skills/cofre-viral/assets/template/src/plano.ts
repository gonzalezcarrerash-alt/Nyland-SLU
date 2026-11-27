// Formato del plan de edición del modelo Viral. La plantilla renderiza cualquier vídeo a partir de él.
// Todos los tiempos van en segundos, en la línea de tiempo del vídeo ya cortado.
//
// Los 11 bloques universales (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) tienen los mismos campos en todos los modelos del pack
// (references/plano.md). Aquí toman el lenguaje de Viral. La firma es `corte`
// (imagen a pantalla completa) y `pop` (tarjeta de imagen encima de la cabeza).
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = el subtítulo sigue apareciendo durante este momento (en `corte` y `pop` ya aparece;
  // `false` lo esconde)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— pantalla completa: la persona entera, el texto a la altura del pecho ———

// Gancho escrito: entra entero en el primer ~1 s a partir de `em` (por defecto: `de`).
// `destaque` = trozo exacto que lleva la tarja. `imagem` (opcional) = el gancho encima de una foto a pantalla completa.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento };

export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  // la foto a pantalla completa detrás del número (pasa a ser un corte con el número encima)
  imagem?: ImagemNoMomento;
};

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  imagem?: ImagemNoMomento;
};

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— imagen arriba, persona abajo: la persona baja a la mitad de abajo ———

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; imagem?: ImagemNoMomento };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— la firma ———

// Corte: la imagen ocupa toda la pantalla de 0,8 a 1,2 s y se acerca despacio (el subtítulo sigue).
// `rotulo` (opcional): una etiqueta corta arriba, con palabras de lo que se dice.
// `zoom` (opcional, de 1 a 2): empieza más cerca del foco, para un sujeto pequeño en una foto ancha.
export type Corte = Base & { tipo: "corte"; imagem: ImagemNoMomento; rotulo?: string; zoom?: number };

// Pop: la persona baja y una tarjeta con la imagen salta encima de la cabeza (el subtítulo sigue, en la costura).
// `em` = cuándo salta la tarjeta (por defecto: `de`); `rotulo` = etiqueta en la esquina de la tarjeta (entra en `rotuloEm`).
export type Pop = Base & { tipo: "pop"; imagem: ImagemNoMomento; em?: number; rotulo?: string; rotuloEm?: number };

export type Momento = Abertura | Numero | Destaque | Frase | Cta | Topicos | Passos | Comparacao | Grafico | Definicao | Pergunta | Corte | Pop;

// tipos que llevan a la persona a la mitad de abajo
export const TIPOS_EMBAIXO = ["pop", "topicos", "passos", "comparacao", "grafico", "definicao", "pergunta"] as const;
export const pessoaEmbaixo = (m: Momento) => (TIPOS_EMBAIXO as readonly string[]).includes(m.tipo);
// tipos que cubren la pantalla con una imagen
export const telaCheia = (m: Momento) =>
  m.tipo === "corte" || ((m.tipo === "numero" || m.tipo === "destaque" || m.tipo === "abertura") && !!m.imagem);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que ocupa el vídeo en el fotograma, desde arriba (1920 = pantalla completa)
  videoAltura?: number;
  // centro de la cara en el fotograma (0–1); el `rastro` viene con él cuando el motor ha seguido la cara
  rosto: { x: number; y: number };
  // franja debajo de la barbilla (px, fotograma de 1080×1920): ahí van el subtítulo y los textos de pantalla completa
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // dónde hay corte en el vídeo de trabajo (lo rellena el motor): cada corte lleva un salto de zoom
  cortesEm?: number[];
  // instantes de palabras fuertes (fuera de los momentos) que llevan el zoom de impacto
  impactos?: number[];
  // false = sin barra de progreso arriba
  progresso?: boolean;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
