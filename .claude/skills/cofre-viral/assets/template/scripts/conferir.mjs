// Comprueba si el plan es una edición de verdad, y no «subtítulos y nada más».
//
// Uso:  node scripts/conferir.mjs            (desde dentro de la carpeta del proyecto)
//       node scripts/conferir.mjs --mapa     (además lista cada momento con el tramo hablado)
//
// El render.mjs pasa esta comprobación antes de renderizar y se detiene si el plan no la aprueba.
// Los límites vienen de `modelo.json` → "conferir" (cada modelo puede ajustarlos) o de los valores por defecto de abajo.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PADRAO = {
  // fracción del vídeo cubierta por momentos (el resto es solo persona + subtítulos)
  cobertura: 0.7,
  // tramo seguido más largo solo con subtítulos, en segundos
  vao: 3.5,
  // tiempo máximo sin nada nuevo dentro de un momento (ítem que entra, palabra del título, cambio)
  parado: 4.5,
  // como mínimo un momento cada N segundos de vídeo
  segundosPorMomento: 8,
};

// Tipos que se montan palabra por palabra con la voz: cada palabra cuenta como novedad en pantalla.
const PALAVRA_POR_PALAVRA = ["abertura", "gancho", "frase", "cta", "citacao", "pergunta", "manchete", "titulo", "fala", "letreiro", "cartaz"];

const ler = (arquivo) => JSON.parse(readFileSync(arquivo, "utf8"));
const s = (t) => `${t.toFixed(1).replace(".", ",")} s`;

// todos los instantes "em"/"…Em" dentro de un momento (ítems, etapas, opciones, subrayados…)
const instantes = (obj, de, ate, saida = []) => {
  if (Array.isArray(obj)) obj.forEach((v) => instantes(v, de, ate, saida));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") {
        if (v >= de - 0.5 && v <= ate + 0.5) saida.push(v);
      } else if (v && typeof v === "object") instantes(v, de, ate, saida);
    }
  }
  return saida;
};

export const tiposDoModelo = () => {
  if (!existsSync("src/plano.ts")) return null;
  const fonte = readFileSync("src/plano.ts", "utf8");
  const achados = [...fonte.matchAll(/tipo\s*:\s*"([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]);
  return achados.length ? new Set(achados) : null;
};

const trecho = (palavras, de, ate) =>
  palavras
    .filter((p) => p.em >= de - 0.05 && p.em < ate)
    .map((p) => p.w)
    .join(" ");

// Los 11 bloques universales (motor/BLOCOS.md) tienen los mismos campos en todos los modelos.
const num = (v) => typeof v === "number" && Number.isFinite(v);
const txt = (v) => typeof v === "string" && v.trim().length > 0;
const camposUniversais = (m) => {
  const itens = (lista, min, max) =>
    !Array.isArray(lista) || lista.length < min || lista.length > max
      ? `necesita entre ${min} y ${max} ítems`
      : lista.some((i) => !txt(i.texto) || !num(i.em))
        ? "cada ítem necesita \"texto\" y \"em\""
        : null;
  switch (m.tipo) {
    case "abertura":
    case "frase":
      return txt(m.texto) ? null : "falta \"texto\"";
    case "pergunta":
      if (!txt(m.texto)) return "falta \"texto\"";
      return m.opcoes && (m.opcoes.length < 2 || m.opcoes.length > 4 || m.opcoes.some((o) => !txt(o.texto) || !num(o.em)))
        ? "\"opcoes\" necesita entre 2 y 4 ítems, cada uno con \"texto\" y \"em\""
        : null;
    case "cta":
      if (!txt(m.texto)) return "falta \"texto\"";
      return m.icone && !["salvar", "seguir", "comentar", "link"].includes(m.icone) ? "\"icone\" tiene que ser salvar, seguir, comentar o link" : null;
    case "topicos":
    case "passos":
      return itens(m.itens, 2, 5);
    case "numero":
      return num(m.valor) && num(m.em) && txt(m.rotulo) ? null : "necesita \"valor\" (número), \"em\" y \"rotulo\"";
    case "comparacao":
      return Array.isArray(m.lados) && m.lados.length === 2 && m.lados.every((l) => txt(l.rotulo) && txt(l.texto) && num(l.em))
        ? null
        : "necesita \"lados\" con 2 ítems, cada uno con \"rotulo\", \"texto\" y \"em\"";
    case "grafico":
      if (!["barras", "linha", "pizza"].includes(m.forma)) return "\"forma\" tiene que ser barras, linha o pizza";
      if (m.dados?.length) {
        if (m.dados.length < 2 || m.dados.length > 6) return "\"dados\" necesita entre 2 y 6 números dichos (con uno solo, usa el bloque numero)";
        return m.dados.some((d) => !txt(d.rotulo) || !num(d.valor) || !num(d.em)) ? "cada dato necesita \"rotulo\", \"valor\" y \"em\"" : null;
      }
      return m.tendencia ? (m.ilustrativo ? null : "un gráfico sin números dichos necesita \"ilustrativo\": true") : "necesita \"dados\" (números dichos) o \"tendencia\"";
    case "destaque":
      return txt(m.texto) && num(m.em) ? null : "necesita \"texto\" y \"em\"";
    case "definicao":
      return txt(m.termo) && num(m.em) && txt(m.significado) && num(m.significadoEm) ? null : "necesita \"termo\", \"em\", \"significado\" y \"significadoEm\"";
    default:
      return null;
  }
};

export const conferirPlano = (plano, modelo = {}, tiposValidos = null) => {
  const lim = { ...PADRAO, ...(modelo.conferir ?? {}) };
  const palavraPorPalavra = new Set([...(modelo.palavraPorPalavra ?? []), ...PALAVRA_POR_PALAVRA]);
  const dur = plano.duracao;
  const palavras = plano.palavras ?? [];
  const momentos = [...(plano.momentos ?? [])].sort((a, b) => a.de - b.de);
  const erros = [];
  const avisos = [];

  // 1. tipos que conoce el modelo
  if (tiposValidos) {
    for (const m of momentos) {
      if (!tiposValidos.has(m.tipo)) erros.push(`El momento en ${s(m.de)} usa el tipo "${m.tipo}", que este modelo no tiene (mira references/plano.md).`);
    }
  }
  for (const m of momentos) {
    if (!(m.ate > m.de)) erros.push(`El momento "${m.tipo}" en ${s(m.de)} termina antes de empezar.`);
    const falta = camposUniversais(m);
    if (falta) erros.push(`El momento "${m.tipo}" en ${s(m.de)}: ${falta} (mira references/plano.md).`);
  }

  // 2. cobertura y tramos solo con subtítulos
  const blocos = momentos.map((m) => [Math.max(0, m.de), Math.min(dur, m.ate)]).filter(([a, b]) => b > a);
  const uniao = [];
  for (const [a, b] of blocos) {
    const u = uniao[uniao.length - 1];
    if (u && a <= u[1] + 0.05) u[1] = Math.max(u[1], b);
    else uniao.push([a, b]);
  }
  const coberto = uniao.reduce((soma, [a, b]) => soma + (b - a), 0);
  const cobertura = dur > 0 ? coberto / dur : 0;
  const vaos = [];
  let cursor = 0;
  for (const [a, b] of uniao) {
    if (a - cursor > 0.05) vaos.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (dur - cursor > 0.05) vaos.push([cursor, dur]);
  const vaosLongos = vaos.filter(([a, b]) => b - a > lim.vao);

  if (cobertura < lim.cobertura) {
    erros.push(`Solo el ${Math.round(cobertura * 100)} % del vídeo tiene un momento en pantalla (mínimo ${Math.round(lim.cobertura * 100)} %). Convierte más tramos de la voz en bloques.`);
  }
  for (const [a, b] of vaosLongos) {
    const fala = trecho(palavras, a, b);
    erros.push(`De ${s(a)} a ${s(b)} (${s(b - a)}) solo están la persona y los subtítulos: "${fala.slice(0, 140)}${fala.length > 140 ? "…" : ""}". Elige un bloque para ese tramo (references/adaptar.md, paso A).`);
  }

  // 3. cantidad y variedad
  const minimo = Math.max(2, Math.ceil(dur / lim.segundosPorMomento));
  if (momentos.length < minimo) erros.push(`${momentos.length} momentos para ${s(dur)} de vídeo; el mínimo es ${minimo} (uno cada ${lim.segundosPorMomento} s).`);
  const tipos = new Set(momentos.map((m) => m.tipo));
  const variedade = dur > 40 ? 4 : dur > 20 ? 3 : 2;
  if (tipos.size < variedade) erros.push(`Solo ${tipos.size} tipo(s) de bloque (${[...tipos].join(", ")}); usa al menos ${variedade} distintos para que el vídeo no sea repetitivo.`);
  for (let i = 2; i < momentos.length; i++) {
    if (momentos[i].tipo === momentos[i - 1].tipo && momentos[i].tipo === momentos[i - 2].tipo) {
      avisos.push(`Tres "${momentos[i].tipo}" seguidos (a partir de ${s(momentos[i - 2].de)}). Varía, si la voz lo permite.`);
    }
  }

  // 4. aparece la firma del modelo
  const assinatura = modelo.blocos?.assinatura ?? [];
  if (assinatura.length && dur > 15 && !momentos.some((m) => assinatura.includes(m.tipo))) {
    erros.push(`La firma del modelo (${assinatura.join(" o ")}) no aparece. Es lo que da al vídeo la cara de este modelo: úsala al menos una vez, de forma metafórica si el tema es otro (mira «La firma en cualquier tema» en el SKILL.md).`);
  }

  // 4b. el estilo entero, no solo un trozo: efectos propios del modelo (además de los bloques universales)
  if (tiposValidos && dur > 20) {
    const UNIVERSAIS = new Set(["abertura", "topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta", "cta", "gancho", "capa", "titulo"]);
    const proprios = [...new Set([...[...tiposValidos].filter((t) => !UNIVERSAIS.has(t)), ...assinatura])];
    const usados = new Set(momentos.map((m) => m.tipo).filter((t) => proprios.includes(t)));
    const minimo = Math.min(2, proprios.length);
    if (usados.size < minimo) {
      erros.push(`Solo ${usados.size} efecto(s) propio(s) del modelo; usa al menos ${minimo} distintos para que el vídeo tenga el estilo entero, no solo un trozo. Los efectos de este modelo: ${proprios.join(", ")}. Mira cómo los usa el ejemplo en references/ejemplo/fotogramas.jpg y plan-comentado.md.`);
    }
  }

  // 5. nada parado dentro de un momento
  for (const m of momentos) {
    const marcas = [m.de, m.ate, ...instantes(m, m.de, m.ate)];
    if (palavraPorPalavra.has(m.tipo)) marcas.push(...palavras.filter((p) => p.em >= m.de && p.em < m.ate).map((p) => p.em));
    marcas.sort((a, b) => a - b);
    let maior = 0;
    let onde = m.de;
    for (let i = 1; i < marcas.length; i++) {
      if (marcas[i] - marcas[i - 1] > maior) {
        maior = marcas[i] - marcas[i - 1];
        onde = marcas[i - 1];
      }
    }
    if (maior > lim.parado) {
      erros.push(`El momento "${m.tipo}" (${s(m.de)}–${s(m.ate)}) pasa ${s(maior)} sin nada nuevo a partir de ${s(onde)}. Divídelo en dos momentos o añade ítems con "em" en las palabras dichas.`);
    }
  }

  // 6. lo que entra en pantalla entra cuando se dice
  const inicios = palavras.map((p) => p.em);
  let fora = 0;
  const exemplos = [];
  for (const m of momentos) {
    for (const t of instantes(m, m.de, m.ate)) {
      const perto = inicios.some((w) => Math.abs(w - t) <= 0.35);
      if (!perto) {
        fora++;
        if (exemplos.length < 3) exemplos.push(`${m.tipo} ${s(t)}`);
      }
    }
  }
  if (fora) avisos.push(`${fora} instante(s) "em" no caen al principio de ninguna palabra (p. ej.: ${exemplos.join("; ")}). Usa el "em" de la palabra que nombra el ítem en work/palavras.json.`);

  return { ok: erros.length === 0, erros, avisos, cobertura, vaos, momentos: momentos.length, tipos: [...tipos], minimo };
};

const principal = () => {
  if (!existsSync("src/plano.json")) {
    console.error("Ejecútalo desde dentro de la carpeta del proyecto (donde está src/plano.json).");
    process.exit(2);
  }
  const plano = ler("src/plano.json");
  const modelo = existsSync("modelo.json") ? ler("modelo.json") : {};
  const r = conferirPlano(plano, modelo, tiposDoModelo());
  console.log(`Comprobación del plan (${s(plano.duracao)}):`);
  console.log(`  momentos: ${r.momentos} (mínimo ${r.minimo}) · tipos: ${r.tipos.join(", ") || "ninguno"}`);
  console.log(`  cobertura: ${Math.round(r.cobertura * 100)} % · tramo más largo solo con subtítulos: ${s(Math.max(0, ...r.vaos.map(([a, b]) => b - a)))}`);
  if (process.argv.includes("--mapa")) {
    console.log("\nMapa:");
    for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
      console.log(`  ${s(m.de).padStart(7)}–${s(m.ate).padEnd(7)} ${m.tipo.padEnd(12)} "${trecho(plano.palavras ?? [], m.de, m.ate).slice(0, 90)}"`);
    }
  }
  for (const a of r.avisos) console.log(`  aviso: ${a}`);
  if (r.ok) {
    console.log("\nAPROBADO.");
    return;
  }
  console.log("\nRECHAZADO. Corrige el plan antes de renderizar:");
  r.erros.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) principal();
