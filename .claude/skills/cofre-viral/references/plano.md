# El plan de edición (`src/plano.json`)

La plantilla renderiza el vídeo a partir de este archivo. `cortar.mjs` rellena la parte mecánica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` y `palavras`. `imagens.mjs` rellena `imagens`. Tú rellenas `marca`, `momentos`, `semLegenda`, `correcoes` y, si quieres, `impactos` y `progresso`.

Todos los tiempos van en segundos, en la línea de tiempo del vídeo **ya cortado**. Sácalos de `work/palavras.json`: cada palabra tiene `em` (inicio) y `ate` (final). Todo campo `em` o `…Em` es el `em` de una palabra dicha.

Las claves del plan siguen en portugués porque las lee el código; no las traduzcas. Las que más vas a usar: `de`/`ate` = desde/hasta; `em` = en qué instante; `tipo` = tipo de bloque; `texto`, `titulo` = título, `rotulo` = rótulo; `imagem` = imagen; `efeito` = efecto (`aproximar` = acercar, `afastar` = alejar, `panoramica`, `parado` = quieto); `lados` = lados; `itens` = elementos; `detalhe` = detalle; `destaque` = destacado; `risco` = tachado; `nivel` = nivel; `vencedor` = ganador; `impactos` = instantes de impacto; `legenda` = subtítulo; `semLegenda` = sin subtítulo; `correcoes` = correcciones; `marca` = firma (nombre y área). Los tipos de bloque (`corte`, `pop`, `abertura` = apertura, `topicos` = lista, `passos` = pasos, `numero` = número, `comparacao` = comparación, `grafico` = gráfico, `definicao` = definición, `pergunta` = pregunta, `cta` = cierre) también se quedan así.

## Índice

1. Campos generales
2. La gramática: pantalla completa, persona abajo, foto a pantalla completa
3. La firma: `corte` y `pop`
4. Bloques de pantalla completa (`abertura`, `numero`, `destaque`, `frase`, `cta`)
5. Bloques con la persona abajo (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`)
6. Reglas de tiempo
7. Subtítulo, zoom, correcciones y sonidos
8. El ejemplo completo

## 1. Campos generales

```json
{
  "marca": { "nome": "Carla", "area": "Curiosidades" },
  "sfx": true,
  "progresso": true,
  "impactos": [3.04, 13.99],
  "correcoes": {}
}
```

- `marca`: `nome` y `area` van en una etiqueta oscura debajo de la llamada final (`cta`), cuando la llamada termina de entrar. `nome` vacío = sin etiqueta.
- `sfx`: `false` quita los sonidos. `progresso`: `false` quita la barra rosa de arriba.
- `impactos` (opcional): instantes de palabras fuertes **fuera** de los momentos de texto que llevan el puñetazo de zoom en la cara (p. ej.: el «nunca» de una frase que solo está en el subtítulo). Úsalo poco: 1 cada 5 s como mucho.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: los calcula `cortar.mjs`. No los toques a mano.
- `imagens`: lo escribe `imagens.mjs` en cada `--escolher`. No lo toques a mano; si el plan se vuelve a crear, ejecuta `node scripts/imagens.mjs --folha` para volver a guardarlo.

## 2. La gramática

| Sitio | Bloques | La persona | La pantalla |
|---|---|---|---|
| **Pantalla completa** | `abertura`, `numero`, `destaque`, `frase`, `cta` y los tramos sin momento | entera, con la cara en la línea del centro; salto de zoom en cada corte, puñetazo de zoom en las palabras fuertes | texto en tarjas a la altura del pecho; subtítulo debajo de la barbilla |
| **Persona abajo** | `pop`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta` | baja a la mitad de abajo (desde y 820), con la cabeza entera | la mitad de arriba recibe el contenido; un trazo rosa marca la costura; en el `pop`, el subtítulo va en la costura |
| **Foto a pantalla completa** | `corte` (y `numero`/`destaque`/`abertura` con `imagem`) | escondida (el vídeo sigue sonando por debajo) | la foto en toda la pantalla, acercándose despacio; subtítulo encima |

La plantilla ya hace sola:

- **Cambio**: la persona baja en 0,38 s a partir del `de` de un momento «abajo» y la mitad de arriba baja junto con la costura (el contenido entra empujando, nunca hay una mitad vacía). A la vuelta, sube a partir del `ate` tapando la mitad de arriba. Dos momentos «abajo» con menos de 0,4 s entre ellos no vuelven a pantalla completa: el contenido viejo desaparece en 0,16 s y el nuevo empieza a entrar 0,2 s después del `de`.
- **Textos del pecho después de un cambio**: esperan a que la persona vuelva a pantalla completa (hasta ~0,4 s después del `de`), para no caer nunca encima de la cara que todavía está subiendo.
- **Texto que cabe**: cada bloque mide el texto con los anchos reales de la Montserrat y reduce el cuerpo hasta que quepa (hasta 2, 3 o 4 líneas), sin cortar. Ninguna línea acaba en palabra átona («de», «la», «y»…): esa palabra baja a la línea siguiente.
- **Último momento**: el `cta` final (o el que termina pegado al final) se queda hasta el último fotograma.

Dos cosas que tienes que cuidar tú:

- **Momentos pegados**: el `ate` de uno = el `de` del siguiente, a ser posible en la pausa entre frases o en un valor de `cortesEm`.
- **Alterna los sitios**: pantalla completa → imagen → pantalla completa. Nunca tres momentos iguales seguidos. Abre con `abertura` y cierra con `cta`.

## 3. La firma

### `corte`: la imagen ocupa toda la pantalla

```json
{ "tipo": "corte", "de": 5.7, "ate": 6.8, "imagem": { "id": "piramides", "efeito": "aproximar" }, "zoom": 1.4 }
```

- **Duración: de 0,8 a 1,2 s.** Empieza en la palabra que nombra la cosa (o 0,05 s antes). Más de 1,5 s cansa; para enseñar más, haz dos cortes o un `pop`.
- `imagem.id`: un pedido de `work/imagens.json` ya elegido. `efeito`: `aproximar` (por defecto), `afastar`, `panoramica`, `parado`. `imagem.foco` (opcional) manda sobre el foco elegido.
- `zoom` (opcional, de 1 a 2): empieza más cerca del foco y sube el sujeto a ~40 % de la altura (por encima del subtítulo). Úsalo cuando el sujeto ha quedado pequeño en una foto apaisada (paisaje, edificio a lo lejos): de 1,3 a 1,6.
- `rotulo` (opcional): etiqueta corta en una tarja rosa arriba (hasta ~22 caracteres), con palabras de lo que se dice. Casi siempre basta con el subtítulo.
- El subtítulo sigue encima (para esconderlo: `"legenda": false`).
- Una imagen buena para el corte: **vertical, de 1600 px o más, con el sujeto entero y sin texto**. Sin imagen (`--escolher <id> 0`), pasa a ser una tarjeta oscura con la palabra.

### `pop`: la tarjeta salta encima de la cabeza

```json
{ "tipo": "pop", "de": 4.7, "ate": 5.7, "imagem": { "id": "potes" }, "rotulo": "Tarros de miel", "rotuloEm": 4.88 }
```

- **Duración: de 1 a 2,5 s.** La persona baja y la tarjeta salta en el `em` (por defecto, el `de`). Empieza el momento en la palabra que nombra la cosa o un poco antes.
- La tarjeta sigue la proporción de la foto (hasta 900 × 600 px), con borde blanco y una inclinación que alterna de lado; el fondo de la mitad de arriba es la propia foto desenfocada y oscura. Un objeto 3D transparente (`tipo: "objeto"`) pasa a ser una pegatina suelta, sin tarjeta.
- `rotulo` / `rotuloEm` (opcionales): etiqueta rosa en la esquina de la tarjeta. Úsala cuando el subtítulo no dice el nombre de la cosa en ese instante; si lo dice, déjala sin poner (quedaría repetido).
- El subtítulo sigue en la costura (para esconderlo: `"legenda": false`).
- Va bien para: fotos pequeñas o apaisadas, productos, documentos, objetos, la foto que ha mandado el usuario.

## 4. Bloques de pantalla completa

Texto en tarjas: cada línea en una placa oscura, en mayúsculas, Montserrat 900; el trozo `destaque` (texto exacto, como está en `texto`) lleva la tarja rosa. Los bloques que se montan con la voz buscan cada palabra en lo que se ha dicho a partir del `em`: usa las palabras de la persona, en el orden en que las dice.

### `abertura`: el gancho escrito

```json
{ "tipo": "abertura", "de": 0, "ate": 1.92, "texto": "La miel prácticamente no se estropea", "destaque": "no se estropea", "em": 0 }
```

- Entra **entero en menos de 1 s** a partir del `em` (por defecto, `de`), palabra a palabra, sin esperar a la voz: es el gancho escrito. Con `em` 0, la primera palabra ya está en el primer fotograma.
- `texto`: de 3 a 8 palabras (hasta ~45 caracteres), la promesa o la curiosidad, con las palabras de lo que se dice. `destaque`: de 1 a 3 palabras.
- Duración: de 1,5 a 3 s. `imagem` (opcional): el gancho encima de una foto a pantalla completa (corte directo al principio).

### `numero`: un número que cuenta

```json
{ "tipo": "numero", "de": 7.41, "ate": 9, "valor": 3000, "em": 7.92, "prefixo": "+", "rotulo": "años", "rotuloEm": 8.55 }
```

- La placa entra 0,25 s antes del `em` y el número cuenta de 0 a `valor` en 0,9 s a partir del `em`, con formato español (3.000; 1,5). `casas` para los decimales. `prefixo`/`sufixo` cortos: `"+"`, `" €"`, `"%"`, `" mil"`, `" kg"`. En España el euro va detrás: `"sufixo": " €"` («3.000 €»).
- `rotulo` (hasta ~30 caracteres) se estampa en una tarja rosa debajo en el `rotuloEm` (por defecto, `em` + 0,3).
- `ilustrativo: true` muestra la etiqueta ILUSTRATIVO (solo cuando el número no se ha dicho exactamente así).
- `imagem` (opcional): el número encima de la foto a pantalla completa (pasa a ser un corte con número).

### `destaque`: palabra que golpea fuerte

```json
{ "tipo": "destaque", "de": 18.8, "ate": 19.7, "texto": "no la tires", "em": 18.82, "nivel": "alerta" }
```

- `texto`: de 1 a 5 palabras (hasta ~30 caracteres); se estampa en el `em`, con puñetazo de zoom. `nivel`: `chave` (rosa, por defecto) o `alerta` (amarillo, texto oscuro: el problema, el «no lo hagas»).
- `detalhe` (opcional, hasta ~60 caracteres): una placa oscura más pequeña debajo, en el `detalheEm` (por defecto, `em` + 0,45).
- Duración: de 0,8 a 2 s. `imagem` (opcional): encima de una foto a pantalla completa.

### `frase`: frase de efecto, conclusión, cita

```json
{ "tipo": "frase", "de": 0, "ate": 1.8, "texto": "Quien guarda miel no pierde dinero", "destaque": "miel", "risco": "pierde dinero", "riscoEm": 1.0 }
```

- `texto`: hasta ~70 caracteres (hasta 4 líneas). Palabra a palabra con la voz a partir del `em` (por defecto, `de`). Sello rosa de comillas en la esquina.
- `risco` (opcional): trozo tachado en rosa en el `riscoEm` (por defecto, cuando se dice).

### `cta`: el cierre

```json
{ "tipo": "cta", "de": 21.86, "ate": 23.8, "texto": "Mándaselo a quien tira la miel", "destaque": "tira la miel", "em": 21.88, "icone": "seguir" }
```

- `texto`: hasta ~50 caracteres, palabra a palabra con la voz. `icone` (opcional): `salvar`, `seguir`, `comentar` o `link` (guardar, seguir, comentar o enlace), en un círculo rosa con un anillo que late. Sin icono, solo la llamada.
- Una vez montado, el bloque «respira» (nunca se queda quieto) y la etiqueta con la `marca` entra debajo. Se queda hasta el último fotograma.

## 5. Bloques con la persona abajo

La mitad de arriba va de y 128 (debajo de la interfaz de la app) a y 752. Título opcional en blanco, en mayúsculas, de 44–78 px, con un trazo rosa encima; entra palabra a palabra con la voz a partir del `de`.

### `topicos`: lista sin orden (motivos, señales, consejos)

```json
{ "tipo": "topicos", "de": 1.8, "ate": 3.6, "titulo": "Tres señales de miel pura",
  "itens": [ { "texto": "Cristaliza con el tiempo", "em": 2.0, "imagem": { "id": "cristalizado" } },
             { "texto": "No cae como el agua", "em": 2.5, "detalhe": "cae en un hilo grueso" },
             { "texto": "Huele a flores", "em": 3.0 } ] }
```

- De 2 a 5 elementos; cada uno de hasta ~45 caracteres (hasta 2 líneas); `detalhe` de hasta ~50. Cada tarjeta salta en su `em`; la del elemento en curso se vuelve rosa. `imagem` en el elemento = foto redonda en lugar del marcador.
- El cuerpo es el más grande que cabe (28–62 px) y la lista queda centrada en la altura libre.

### `passos`: secuencia en orden

Los mismos campos que `topicos`. Tarjetas numeradas; un trazo rosa baja del 1 hasta el paso en curso.

### `comparacao`: dos lados

```json
{ "tipo": "comparacao", "de": 10.68, "ate": 14.3, "titulo": "El secreto es sencillo", "modo": "contra",
  "lados": [ { "rotulo": "Agua", "texto": "casi nada", "em": 12.04, "imagem": { "id": "agua" } },
             { "rotulo": "Azúcar", "texto": "mucho", "em": 13.25, "imagem": { "id": "acucar" } } ] }
```

- `rotulo`: hasta ~14 caracteres (tarja). `texto`: hasta ~30 caracteres (2 líneas con foto, 4 sin ella). `imagem` por lado (opcional): foto encima de la tarjeta; si solo la tiene un lado, el otro se queda con la zona oscura.
- `modo`: `contra` (VS), `antes-depois` (antes y después: flecha), `errado-certo` (mal y bien: el primer lado es el malo, con tarja amarilla y ✗; el segundo, verde y ✓).
- `vencedor` (0 o 1) y `vencedorEm`: el ganador lleva borde rosa y ✓; el otro se vuelve gris.
- Antes de que se diga cada lado, su sitio espera con un «?» discontinuo.

### `grafico`

- `forma`: `barras`, `linha` o `pizza` (barras, línea o tarta). `dados`: de 2 a 6 números **dichos**, cada uno con `rotulo` (hasta ~14 caracteres) y `em`. `unidade`: `"%"`, `"€"`, `"US$"`, `"kg"`, `"mil t"`… Con `"€"`, el euro sale detrás del número («44 €»).
- Sin números: `tendencia` (`sobe`, `cai`, `oscila`: sube, baja, oscila), `tendenciaEm` e `ilustrativo: true`; la curva se dibuja en 1,4 s con la etiqueta ILUSTRATIVO.

### `definicao`: término explicado

```json
{ "tipo": "definicao", "de": 12.6, "ate": 14.4, "termo": "Higroscópico", "em": 12.8, "significado": "Que absorbe la humedad del aire", "significadoEm": 13.3 }
```

- `termo`: hasta ~24 caracteres. `significado`: hasta ~110 caracteres, palabra a palabra con la voz. `imagem` (opcional): foto redonda al lado del término.

### `pergunta`

- `texto`: hasta ~70 caracteres, palabra a palabra con la voz a partir del `em`. `opcoes` (opcional): de 2 a 4, cada una de hasta ~40 caracteres, en el `em` en que se dice (encuesta). Sin opciones, un «?» rosa.

## 6. Reglas de tiempo

- **Cobertura**: al menos el 70 % del vídeo con algún momento; ningún tramo solo con subtítulo de más de 3,5 s; al menos un momento cada 8 s; al menos 3 tipos distintos (4 en vídeos de más de 40 s). `conferir.mjs` lo exige.
- **Nada quieto**: dentro de un momento, como mucho 4,5 s sin algo nuevo (elemento, palabra, número, cambio).
- **Ritmo de Viral**: un momento nuevo cada 1 a 3 s; una imagen (`corte` o `pop`) cada 3 a 6 s en los tramos con cosas concretas; los tramos cortos (0,5–1,5 s) solo con la persona y el subtítulo entre ellos van bien: es ahí donde se ve el salto de zoom del corte.
- El primer momento empieza en 0 (el gancho). El último termina al final del vídeo.

## 7. Subtítulo, zoom, correcciones y sonidos

- **Subtítulo**: aparece en los tramos sin momento, en el `corte` y en el `pop`; desaparece en los demás bloques (ya enseñan el texto). `legenda: true` en un momento lo mantiene; `false` en el `corte`/`pop` lo esconde. `semLegenda: [{ "de": 4.0, "ate": 5.2 }]` lo esconde en un tramo. La plantilla parte cada frase en pantallas de hasta 3 palabras (una línea) y la tarja rosa avanza hasta la palabra que se dice. Ninguna pantalla acaba en palabra átona, y los signos de apertura («¿», «¡») se quitan igual que los de cierre.
- **Zoom**: salto seco en cada `cortesEm` y a la vuelta de cada foto a pantalla completa (alterna 100 % y 109 %); puñetazo del 11 % en el `em` de la `abertura`, del `numero` y del `destaque` sin imagen, del `cta` y en cada `impactos`. Con la persona abajo, sin zoom.
- `correcoes`: `{ "chat GPT": "ChatGPT" }` cambia palabras en el subtítulo.
- **Sonidos** (en `public/sfx`): `corte` al principio de cada corte, `pop` en la tarjeta y en cada lado de la comparación, `impacto` en el gancho, el número y el destacado `chave`, `alerta` en el destacado `alerta`, `tique` en elementos, datos y opciones, y `fim` en el `cta`. Dos sonidos a menos de 0,12 s se quedan en uno.

## 8. El ejemplo completo (curiosidad, 23,8 s)

Lo que se dice: «La miel es uno de los pocos alimentos que prácticamente no se estropean. Unos arqueólogos encontraron tarros de miel en tumbas de Egipto de más de 3.000 años y todavía se podía comer. El secreto es sencillo: casi nada de agua y mucho azúcar. Ahí no sobrevive ninguna bacteria. Así que, si tu miel se ha cristalizado, no la tires. Solo tienes que calentarla al baño María. Mándaselo a quien tira la miel.»

Es la demo de Jorge Morcuende (`references/ejemplo/`). El plan completo está en `assets/template/src/plano.json`, con las fotos de muestra que trae la plantilla:

```json
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 1.92, "texto": "La miel prácticamente no se estropea", "destaque": "no se estropea", "em": 0 },
  { "tipo": "corte", "de": 1.92, "ate": 3.12, "imagem": { "id": "escorrendo", "efeito": "aproximar" } },
  { "tipo": "pop", "de": 5.62, "ate": 6.6, "em": 5.8, "imagem": { "id": "potes" } },
  { "tipo": "corte", "de": 6.6, "ate": 7.41, "imagem": { "id": "piramides", "efeito": "aproximar" }, "zoom": 1.4 },
  { "tipo": "numero", "de": 7.41, "ate": 9, "valor": 3000, "em": 7.92, "prefixo": "+", "rotulo": "años", "rotuloEm": 8.55 },
  { "tipo": "destaque", "de": 9, "ate": 10.64, "texto": "todavía se podía comer", "em": 9.26, "nivel": "chave" },
  { "tipo": "comparacao", "de": 10.68, "ate": 14.3, "titulo": "El secreto es sencillo", "modo": "contra", "lados": [
    { "rotulo": "Agua", "texto": "casi nada", "em": 12.04, "imagem": { "id": "agua" } },
    { "rotulo": "Azúcar", "texto": "mucho", "em": 13.25, "imagem": { "id": "acucar" } } ] },
  { "tipo": "corte", "de": 15.85, "ate": 16.72, "imagem": { "id": "bacteria", "efeito": "aproximar" } },
  { "tipo": "pop", "de": 17.45, "ate": 18.45, "em": 17.57, "imagem": { "id": "cristalizado" } },
  { "tipo": "destaque", "de": 18.8, "ate": 19.7, "texto": "no la tires", "em": 18.82, "nivel": "alerta" },
  { "tipo": "pop", "de": 19.72, "ate": 21.55, "imagem": { "id": "banhomaria" } },
  { "tipo": "cta", "de": 21.86, "ate": 23.8, "texto": "Mándaselo a quien tira la miel", "destaque": "tira la miel", "em": 21.88 }
]
```

Y el `work/imagens.json` que encontró las fotos de muestra (con `--lado 2400`), con los tiempos de esta demo:

```json
[
  { "id": "escorrendo", "em": 1.92, "palavra": "miel", "busca": "honey dipper", "tipo": "foto" },
  { "id": "potes", "em": 5.84, "palavra": "tarros de miel", "busca": "ancient egyptian jar", "tipo": "foto" },
  { "id": "piramides", "em": 6.62, "palavra": "tumbas de Egipto", "busca": "egypt pyramids", "tipo": "foto" },
  { "id": "agua", "em": 12.04, "palavra": "agua", "busca": "water drop", "tipo": "foto" },
  { "id": "acucar", "em": 13.25, "palavra": "azúcar", "busca": "sugar cubes", "tipo": "foto" },
  { "id": "bacteria", "em": 15.89, "palavra": "bacteria", "busca": "colorized scanning electron micrograph bacteria", "tipo": "foto" },
  { "id": "cristalizado", "em": 17.59, "palavra": "miel cristalizada", "busca": "crystallized honey", "tipo": "foto" },
  { "id": "banhomaria", "em": 19.71, "palavra": "baño maría", "busca": "pot of boiling water", "tipo": "foto" }
]
```

Fíjate: las imágenes grandes y verticales fueron al `corte` (miel que cae, pirámides, bacteria coloreada); las pequeñas o cuadradas, al `pop` (tarro antiguo, miel cristalizada, cazuela). «banho-maria» (en portugués) y «double boiler» trajeron diagramas y calderas de tren; «pot of boiling water» trajo la cazuela. La micrografía gris llevaba una franja de datos abajo; la coloreada, no.
