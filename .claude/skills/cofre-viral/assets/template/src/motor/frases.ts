// Monta las líneas de subtítulos a partir de las palabras del plan. Es parte del motor:
// es el mismo en todos los modelos y también lo usa el scripts/legendas.mjs.
import type { Palavra, Plano } from "../plano";

type Faixa = { de: number; ate: number };
export type Frase = { de: number; ate: number; palavras: Palavra[] };

const MAX_CARACTERES = 34;
const dentro = (t: number, faixas: Faixa[]) => faixas.some((f) => t >= f.de && t < f.ate);
// palabras que no pueden cerrar una línea (las átonas del español: artículos, preposiciones, conjunciones,
// pronombres átonos y posesivos) y números sin puntuación, que van pegados a lo que sigue ("60 | mil", "20 | minutos")
const FUNCIONAIS = new Set(
  "a al ante bajo con contra de del desde durante e el en entre hacia hasta la las le les lo los mas me mediante mi mis ni nos o os para pero por que se si sin sino sobre su sus te tras tu tus u un una unas unos y".split(" "),
);
const curta = (p: Palavra) =>
  !/[.?!…,;:]$/.test(p.w) && (FUNCIONAIS.has(p.w.toLowerCase()) || /^(r\$)?\d+([.,]\d+)?%?$/i.test(p.w));
const texto = (f: { palavras: Palavra[] }) => f.palavras.map((p) => p.w).join(" ");

// Dónde no aparecen los subtítulos: durante los momentos que ya muestran lo que se dice.
export const faixasSemLegenda = (plano: Plano): Faixa[] => [
  ...plano.momentos.filter((m) => !m.legenda).map((m) => ({ de: m.de - 0.05, ate: m.ate })),
  ...(plano.semLegenda ?? []),
];

// Aplica `correcoes`: una o varias palabras seguidas pasan a ser otra cosa ("chat GPT" → "ChatGPT");
// sustituir por "" borra. La puntuación pegada a la última palabra se conserva.
export const corrigirPalavras = (palavras: Palavra[], correcoes: Record<string, string> = {}): Palavra[] => {
  const regras = Object.entries(correcoes)
    .map(([de, para]) => ({ de: de.trim().split(/\s+/), para }))
    .filter((r) => r.de[0])
    .sort((a, b) => b.de.length - a.de.length);
  if (regras.length === 0) return palavras;
  const nucleo = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  const saida: Palavra[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const regra = regras.find((r) => r.de.every((w, k) => palavras[i + k] && (nucleo(palavras[i + k].w) || palavras[i + k].w) === (nucleo(w) || w)));
    if (!regra) {
      saida.push(palavras[i]);
      continue;
    }
    const ultima = palavras[i + regra.de.length - 1];
    const pontuacao = ultima.w.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? "";
    // si la corrección ya trae su propia puntuación ("¿Re?", "4-7-8."), vale en lugar de la original
    const temPontuacao = /[^\p{L}\p{N}]$/u.test(regra.para);
    if (regra.para) saida.push({ em: palavras[i].em, ate: ultima.ate, w: temPontuacao ? regra.para : `${regra.para}${pontuacao}` });
    i += regra.de.length - 1;
  }
  return saida;
};

// Agrupa las palabras en líneas: corta en la puntuación, en una pausa o en el límite de ancho,
// sin dejar una palabra corta ("y", "de", "un") colgando al final de la línea.
export const montarFrases = (plano: Plano): Frase[] => {
  const semLegenda = faixasSemLegenda(plano);
  const visiveis = corrigirPalavras(plano.palavras, plano.correcoes).filter((p) => !dentro(p.em, semLegenda));
  const frases: Frase[] = [];
  let atual: Palavra[] = [];
  let caracteres = 0;

  const fechar = (moverCurtas: boolean) => {
    const sobra: Palavra[] = [];
    while (moverCurtas && atual.length > 2 && curta(atual[atual.length - 1]) && sobra.length < 2) {
      sobra.unshift(atual.pop() as Palavra);
    }
    frases.push({ de: atual[0].em, ate: atual[atual.length - 1].ate, palavras: atual });
    atual = sobra;
    caracteres = sobra.reduce((n, x) => n + x.w.length + 1, 0);
  };

  visiveis.forEach((p, i) => {
    atual.push(p);
    caracteres += p.w.length + 1;
    const prox = visiveis[i + 1];
    const fimDeFrase = /[.?!…]$/.test(p.w);
    // una coma entre números ("80, 90, 99 %") no corta
    const virgula = /[,;:]$/.test(p.w) && caracteres > 16 && !(/\d,$/.test(p.w) && prox && /^\d/.test(prox.w));
    const semProxima = !prox || semLegenda.some((f) => f.de >= p.em && f.de < prox.em);
    const pausa = !semProxima && prox.em - p.ate > 0.55;
    const estoura = !!prox && caracteres + prox.w.length > MAX_CARACTERES;
    if (fimDeFrase || virgula || semProxima) fechar(false);
    else if (pausa || estoura) fechar(true);
  });
  if (atual.length) fechar(false);

  // una palabra sola al final de una frase sube a la línea anterior (o la anterior le presta una)
  for (let i = frases.length - 1; i > 0; i--) {
    const [antes, esta] = [frases[i - 1], frases[i]];
    const continua = esta.palavras.length === 1 && esta.de - antes.ate < 0.4 && !/[.?!…]$/.test(texto(antes));
    if (continua && texto(antes).length + texto(esta).length + 1 <= MAX_CARACTERES + 8) {
      antes.palavras.push(...esta.palavras);
      antes.ate = esta.ate;
      frases.splice(i, 1);
    } else if (continua && antes.palavras.length >= 3) {
      // baja una palabra, y además las cortas que se quedarían colgando ("de un")
      do {
        const desce = antes.palavras.pop() as Palavra;
        esta.palavras.unshift(desce);
        esta.de = desce.em;
      } while (antes.palavras.length > 2 && curta(antes.palavras[antes.palavras.length - 1]) && esta.palavras.length < 4);
      antes.ate = antes.palavras[antes.palavras.length - 1].ate;
    }
  }

  // cada línea se queda en pantalla hasta que empieza la siguiente, un instante después de terminar,
  // o hasta que entra un momento
  return frases.map((f, i) => {
    const proxima = frases[i + 1];
    const limite = semLegenda.filter((s) => s.de > f.de).map((s) => s.de);
    return { ...f, ate: Math.min(f.ate + 0.35, proxima ? proxima.de : Infinity, ...limite, plano.duracao) };
  });
};
