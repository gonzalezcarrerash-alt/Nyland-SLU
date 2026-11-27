// Medir y encajar texto: cualquier texto que mande el plan cabe en su caja.
// Mide con los anchos reales de la Montserrat (larguras.ts), corta en líneas y reduce el cuerpo
// hasta un mínimo legible. Nunca corta ni se sale: como mucho, acepta una línea más.
import { CARACTERES, MONTSERRAT_700, MONTSERRAT_800, MONTSERRAT_900 } from "./larguras";

export type Fonte = { peso?: 700 | 800 | 900; caixaAlta?: boolean; espacamento?: number };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS = { 700: MONTSERRAT_700, 800: MONTSERRAT_800, 900: MONTSERRAT_900 };

// Ancho del texto en px con un cuerpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toLocaleUpperCase("es-ES") : texto;
  const letras = [...t];
  const tabela = TABELAS[fonte.peso ?? 900];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    soma += i === undefined ? 700 : tabela[i];
  }
  // 3 % de margen: el navegador redondea y aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Palabras átonas del español (artículos, preposiciones, conjunciones, pronombres átonos y posesivos): ninguna
// línea puede acabar en una de ellas («Freidora de | aire» pasa a «Freidora | de aire»). Con un signo de
// puntuación detrás ya no cuentan (la pausa justifica el corte).
const ATONAS = new Set(
  "a al ante bajo con contra de del desde durante e el en entre hacia hasta la las le les lo los mas me mediante mi mis ni nos o os para pero por que se si sin sino sobre su sus te tras tu tus u un una unas unos y".split(" "),
);
export const esAtona = (w: string) => !/[,.;:!?…]$/.test(w) && ATONAS.has(w.toLocaleLowerCase("es-ES").replace(/[^\p{L}]/gu, ""));
const acabaEmAtona = (linhas: string[]) => linhas.slice(0, -1).some((l) => esAtona(l.split(" ").pop() ?? ""));

// Corta en líneas que caben en `largura` (palabra a palabra). Una palabra más larga que la línea se queda sola.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    const tentativa = [...atual, p].join(" ");
    if (!atual.length || larguraTexto(tentativa, tamanho, fonte) <= largura) atual.push(p);
    else {
      // la línea no se cierra con una átona: esa palabra baja con la siguiente
      const baixa: string[] = [];
      while (atual.length > 1 && esAtona(atual[atual.length - 1])) baixa.unshift(atual.pop() as string);
      linhas.push(atual.join(" "));
      atual = [...baixa, p];
    }
  }
  if (atual.length) linhas.push(atual.join(" "));
  // no deja una palabra corta sola al final si se puede equilibrar con la línea anterior; si la palabra que
  // bajaría deja una átona al final de la anterior, bajan las dos («¿FREIDORA DE AIRE / U HORNO ELÉCTRICO?»)
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      let k = 1;
      while (k < penultima.length - 1 && esAtona(penultima[penultima.length - 1 - k])) k++;
      const moveu = `${penultima.slice(-k).join(" ")} ${ultima}`;
      if (penultima.length - k >= 2 && larguraTexto(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -k).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

// El cuerpo más grande (de `max` a `min`, de 2 en 2 px) con el que el texto cabe en `linhas` líneas.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
) => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  // primero sin ninguna línea acabada en átona; si no hay forma, se admite
  const melhorEm = (k: number, aceitaAtona = false): { tamanho: number; linhas: string[] } | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura) && (aceitaAtona || !acabaEmAtona(quebra)))
        return { tamanho, linhas: quebra };
    }
    return aceitaAtona ? null : melhorEm(k, true);
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos líneas compensa si cuesta poco cuerpo (hasta un ~15 % menos)
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      // nunca se cambia un corte limpio por otro con una átona al final de una línea
      if (menos && menos.tamanho >= melhor.tamanho * 0.85 && (!acabaEmAtona(menos.linhas) || acabaEmAtona(melhor.linhas))) return menos;
    }
    return melhor;
  }
  // una sola palabra enorme («criptomonedas» en una caja estrecha): reduce hasta que quepa en el ancho
  let tamanho = min;
  const maior = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 22 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// ——— trozos dentro de un texto (destacado, tachado) ———

export const nucleo = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices (en la lista de palabras de `texto`) del trozo `alvo`, o null si no lo encuentra.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};
