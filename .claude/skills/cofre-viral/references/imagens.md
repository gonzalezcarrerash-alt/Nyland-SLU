# Motor de imágenes: fotos y objetos al ritmo de la voz

La persona dice «miel» y aparece el tarro de miel. Esta pieza del motor encuentra la imagen, deja que la IA elija mirando una hoja numerada y entrega a la plantilla un archivo listo, con el punto de foco y el crédito.

Es común a todos los modelos con imagen (Viral, Iceberg, Ranking, Kit, Versus, Etiqueta, Pronunciación, Literal, Reacción, Transformación…). Cada modelo decide **cómo** entra la imagen; el motor se ocupa de **qué** imagen, del encuadre, del movimiento lento y del tiempo.

## Archivos

| En el motor | Va a la plantilla como | Qué hace |
|---|---|---|
| `scripts/imagens.mjs` | `scripts/imagens.mjs` | busca, descarga, normaliza, monta la hoja, guarda la elección, los créditos y el plan |
| `src/imagem.tsx` | `src/motor/imagem.tsx` | `<Foto>`, `<Recorte>`, `<SemImagem>` y las funciones de encuadre |
| `src/FolhaImagens.tsx` | `src/motor/FolhaImagens.tsx` | la hoja de comprobación y el conversor de WebP/AVIF/SVG; tiene su propia raíz y solo la usa `imagens.mjs` |

Sin dependencias nuevas: el `fetch` de Node 18+, el ffmpeg que viene con Remotion y el navegador de Remotion.

## El paso en el flujo de la skill

Entra después del mapa editorial y antes de planificar los momentos:

1. **Hacer la lista de momentos de imagen** a partir de lo que se dice (`work/palavras.json`): cada cosa concreta que nombra la persona y que vale la pena mostrar. Escribir `work/imagens.json`.
2. **Ejecutar** `node scripts/imagens.mjs`.
3. **Mirar la hoja** (`work/imagens.jpg`, e `imagens-2.jpg`, `imagens-3.jpg`… cuando hay más de 4 pedidos).
4. **Elegir y marcar el foco** de cada pedido: `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`.
5. **Planificar**: el momento que muestra la imagen lleva `imagem: { id, efeito }`. El script ya ha rellenado `plano.imagens`.
6. Comprobar en los stills de siempre (`stills.mjs --momentos`) que el sujeto no ha quedado cortado.

### `work/imagens.json`

Una lista. Cada pedido:

```json
[
  { "id": "miel", "em": 3.2, "palavra": "miel", "busca": "honey jar", "tipo": "foto" },
  { "id": "microfono", "em": 11.0, "palavra": "micrófono de solapa", "busca": "microphone", "tipo": "objeto" },
  { "id": "antes", "em": 2.0, "palavra": "antes", "tipo": "foto", "arquivo": "armario-antes.jpg" },
  { "id": "post", "em": 0.8, "palavra": "el post", "tipo": "print", "arquivo": "captura-post.png" }
]
```

- `id`: corto, sin tildes (pasa a ser el nombre del archivo: `public/img/miel.jpg`).
- `em`: el instante en que se dice la palabra (segundos, en el vídeo cortado).
- `palavra`: como se dijo, en español (es lo que muestra la tarjeta cuando no hay imagen).
- `busca`: el término **en inglés**, concreto, como alguien describiría la foto. Es lo que más cambia el resultado:
  - `"camera tripod"`, no `"tripod"` (que trae calderos y barreños de bronce);
  - para animales y plantas, el **nombre científico** encuentra fotos de verdad (`"paradoxurus hermaphroditus"` trajo la civeta viva; `"asian palm civet"` la trajo atropellada);
  - comida regional: nombre + lugar (`"acaraje bahia"`, no solo `"acaraje"`);
  - nada de personas famosas ni de marcas (mira las reglas).
- `tipo`:
  - `"foto"`: foto normal (va en tarjeta, a pantalla completa, en máscara);
  - `"objeto"`: cosa aislada que se puede convertir en pegatina. Primero vienen los objetos 3D con fondo transparente (Fluent Emoji) y después las fotos;
  - `"print"`: captura de un post, un comentario o una noticia. **Solo sale de la carpeta del alumno**; nunca se busca ni se inventa.
- `arquivo` (opcional): nombre del archivo en la carpeta `imagens/` del alumno. Aunque no haya `arquivo`, un nombre parecido al `id` o a la `palavra` (`miel-2.jpg`, `producto-final.webp`) se encuentra y entra ya elegido.

### Comandos

```
node scripts/imagens.mjs                                   busca lo que falta y monta la hoja
node scripts/imagens.mjs --escolher miel 2 --foco 0.5,0.35  elige la 2 y marca el foco
node scripts/imagens.mjs --escolher miel 0                  sin imagen: el modelo dibuja la tarjeta
node scripts/imagens.mjs --escolher miel --foco 0.4,0.3     solo cambia el foco
node scripts/imagens.mjs --refazer miel --busca "honey pot" vuelve a buscar con otro término ("todos" lo rehace todo)
node scripts/imagens.mjs --folha                            vuelve a montar la hoja (la elegida en verde, el foco en un círculo)
node scripts/imagens.mjs --limpar                           borra las candidatas después de elegirlo todo
  --offline     no usa internet (carpeta imagens/, caché y tarjetas)
  --lado 2400   lado mayor de las imágenes normalizadas (por defecto 1600)
```

Volver a ejecutarlo sale barato: las búsquedas y las descargas se quedan en la caché. El script solo rehace el pedido que ha cambiado (`busca`, `tipo` o `arquivo`), el que todavía no tiene candidatas y el que se quedó sin imagen por falta de internet. Si el alumno pone un archivo en `imagens/` después, pasa delante en la ronda siguiente.

### La hoja (`work/imagens.jpg`)

El ffmpeg de Remotion no tiene `drawtext` (ni `overlay`, `pad` o `hstack`), así que la hoja es un still de Remotion (`FolhaImagens.tsx`, empaquetado aparte, como `Medir`). Cuatro pedidos por hoja, hasta 6 candidatas por fila:

- **número amarillo** = la candidata (es el `n` de `--escolher`);
- la imagen aparece **entera** (sin recortar), con líneas finas en 0,25 / 0,5 / 0,75 del ancho y del alto: el foco se lee directamente en ellas;
- debajo: licencia (verde = sin obligación de crédito; naranja = CC BY, va a `creditos.txt`), tamaño real, «transparente», «pequeña» (lado mayor < 1000 px) y la fuente;
- el PNG transparente aparece sobre un tablero de ajedrez;
- en la columna de la izquierda, los avisos del pedido (marca bloqueada, sin objeto 3D, solo 2 candidatas…);
- después de la elección, `--folha` muestra la elegida con borde verde y el foco en un círculo: es la comprobación del foco.

Para un foco exacto, abre la candidata: `public/img/candidatas/<id>-<n>.jpg` (o `.png`).

**Cómo elegir:** el sujeto entero y reconocible en 1 segundo; fondo limpio; foto de verdad (no pintura ni ilustración) cuando el tipo es foto; en vertical cuando va a pantalla completa; nada de gente reconocible, logos, textos grandes ni marcas de agua. ¿No sirve ninguna? `--refazer` con otro término, o `0` (tarjeta). Una tarjeta es mejor que una imagen equivocada.

**El foco** es el punto del sujeto (la cara del animal, el tarro, la pirámide más grande), en fracciones de la imagen entera: `0,0` es la esquina de arriba a la izquierda y `1,1` la de abajo a la derecha. Acepta `0.5,0.35` y también `0,5,0,35`. Sin `--foco`, queda en el centro.

### Lo que guarda el script

- `public/img/candidatas/<id>-<n>.<jpg|png>`: las candidatas normalizadas (lado mayor de hasta 1600 px; JPG para las fotos, PNG solo cuando hay transparencia de verdad).
- `public/img/<id>.<jpg|png>`: la elegida.
- `work/imagens.json`: en cada pedido, `candidatas` (fuente, autor, licencia, enlace, tamaño) y `escolha` (`n`, `arquivo`, `foco`, fuente, autor, licencia, enlace) o `{ "sem": true }`.
- `src/plano.json` → `imagens`: el resumen que lee la plantilla (abajo). Se rehace en cada elección; `cortar.mjs --manter-plano` lo conserva. Si el plan se vuelve a crear desde cero, ejecuta `node scripts/imagens.mjs --folha` (vuelve a sincronizarlo).
- `creditos.txt` (en la raíz del proyecto): las imágenes CC BY con el formato para pegarlas en la descripción de la publicación y, aparte, las que no exigen crédito.

```json
"imagens": {
  "miel":     { "arquivo": "img/miel.jpg", "largura": 960, "altura": 1440, "foco": { "x": 0.5, "y": 0.45 }, "transparente": false, "palavra": "miel" },
  "moneda":   { "arquivo": "img/moneda.png", "largura": 256, "altura": 256, "foco": { "x": 0.5, "y": 0.5 }, "transparente": true, "palavra": "moneda" },
  "zapatillas": { "sem": true, "palavra": "zapatillas de correr" }
}
```

## En la plantilla

### Tipos

En `src/plano.ts`:

```ts
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

export type Plano = {
  // …campos comunes…
  imagens?: ImagensDoPlano;
};

// en el momento que muestra una imagen (el nombre del campo es una sugerencia del plan del lote 7):
export type Destaque = { tipo: "destaque"; de: number; ate: number; texto: string; em: number; imagem?: ImagemNoMomento };
// ImagemNoMomento = { id: string; foco?: { x, y }; efeito?: "aproximar" | "afastar" | "panoramica" | "parado" }
```

`imagem.foco` en el momento manda sobre el foco elegido (para que la misma foto aparezca con dos encuadres).

### `imagemDoPlano(plano, ref)`

```tsx
const img = imagemDoPlano(plano, momento.imagem); // o imagemDoPlano(plano, "miel")
// → { arquivo, largura, altura, foco, transparente, palavra, id } | { sem: true, palavra, id } | null
```

`temImagem(img)` dice si hay archivo. Un `id` que no está en el plan devuelve `null` (todavía no se ha hecho la elección).

### `<Foto>`

Encuadra por el foco (el foco queda lo más cerca posible del centro sin dejar un borde vacío), se mueve despacio y entra a tiempo. Lo visual (borde, sombra, esquinas, posición) llega por `style`.

| Prop | Por defecto | Qué es |
|---|---|---|
| `imagem` o `src` | | la imagen del plan, o una ruta dentro de `public/` |
| `de`, `ate` | `0`, — | cuándo entra y sale (segundos, en el reloj del componente: dentro de `<Sequence>`, el de la Sequence; o pasa `t`) |
| `largura`, `altura` | 100 % del padre | tamaño de la caja en px. **Pasa los dos** para que el foco quede centrado de verdad; sin ellos, la foto llena el padre y el foco solo queda garantizado en pantalla |
| `efeito` | `"aproximar"` | `"aproximar"`, `"afastar"`, `"panoramica"`, `"parado"` |
| `intensidade` | `0.1` | cuánto se mueve en el tiempo de la foto (0,1 = 10 % de zoom) |
| `direcao` | `"direita"` | panorámica: `"esquerda"`, `"direita"`, `"cima"`, `"baixo"` |
| `entrada` | `"corte"` | `"corte"`, `"fade"`, `"subir"`, `"escala"`, `"revelar"` (cortinilla desde la izquierda) |
| `saida` | `"corte"` | `"corte"`, `"fade"`, `"escala"` |
| `durEntrada`, `durSaida` | `0.35`, `0.25` | segundos |
| `style`, `estiloDaImagem` | | marco del modelo; filtro de color en la imagen |
| `semImagem`, `cartao` | tarjeta por defecto | lo que se muestra cuando no hay imagen; o solo los colores y la fuente de la tarjeta por defecto |
| `antes` | `0.5` | segundos antes de `de` en los que la imagen ya se carga, invisible (sin parpadeos) |

El zoom está anclado en el foco (el sujeto no sale de la pantalla) y la panorámica nunca enseña el borde de la imagen.

### `<Recorte>`

PNG transparente como pegatina (objeto 3D, producto recortado por el alumno). La altura sigue la proporción.

| Prop | Por defecto | Qué es |
|---|---|---|
| `imagem` o `src`, `de`, `ate` | | como en `<Foto>` |
| `largura` | `360` | px de la pegatina |
| `entrada` | `"escala"` | `"escala"` (sin rebote), `"salto"` (muelle que se pasa un poco del punto), `"cair"`, `"subir"`, `"corte"` |
| `flutuar` | `true` | vaivén lento mientras está en pantalla (nunca se queda quieta) |
| `giro` | `0` | inclinación de reposo, en grados |
| `sombra` | sombra suave | CSS `drop-shadow(...)`, o `false` |
| `semImagem` | nada | lo que se muestra si no hay archivo |

### `<SemImagem>`

La tarjeta tipográfica: la palabra dicha, en el cuerpo más grande que quepa (hasta 3 líneas, sin dejar un «de» solo en una línea), que crece un poco mientras está en pantalla. `fundo`, `cor`, `fonte`, `peso` y `rotulo` («imagina:») son del modelo. `aviso` pone la etiqueta naranja «sin imagen · id»: solo en las guías, nunca en el vídeo final.

### Ejemplos de entrada (cada modelo elige la suya)

```tsx
// corte directo a pantalla completa, acercando (Viral)
<Sequence from={Math.round(m.de * fps)} durationInFrames={Math.round((m.ate - m.de) * fps)}>
  <Foto imagem={imagemDoPlano(plano, m.imagem)} de={0} ate={m.ate - m.de} largura={1080} altura={1920} intensidade={0.12} />
</Sequence>

// tarjeta flotante encima de la cabeza, con la persona abajo
<Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={960} altura={760} entrada="escala" saida="fade"
  style={{ position: "absolute", left: 60, top: 110, borderRadius: 36, border: "6px solid #F4F1EA", boxShadow: "0 30px 60px rgba(0,0,0,.5)" }} />

// máscara redonda, alejando
<Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={620} altura={620} efeito="afastar" entrada="fade"
  style={{ position: "absolute", left: 230, top: 140, borderRadius: "50%" }} />

// zoom en un detalle: foco en el detalle + intensidad alta
<Foto imagem={img} foco={{ x: 0.72, y: 0.31 }} de={m.de} ate={m.ate} t={t} largura={1080} altura={1080} intensidade={0.6} />

// objeto 3D como pegatina
<Recorte imagem={imagemDoPlano(plano, "microfono")} de={item.em} ate={m.ate} t={t} largura={300} entrada="salto" giro={-8}
  style={{ position: "absolute", left: 760, top: 650 }} />

// dos imágenes una al lado de la otra: dos <Foto> de 520×700 con el mismo `de`
```

Para marcos propios (polaroid que cae, pantalla de móvil, cortinilla de antes y después), usa las funciones puras: `enquadrarFoto(W, H, iw, ih, foco)` (rectángulo de la imagen y dónde ha caído el foco), `kenBurns(...)` (zoom y desplazamiento en el tiempo) y `entradaSaida(...)` (opacidad y transform de la entrada y de la salida).

Prueba lista: `testes/imagens-teste/src/TesteImagens.tsx` (composición `TesteImagens`) muestra las cinco formas de arriba con las imágenes de la prueba.

## Reglas de contenido (las aplica el script; la skill las repite)

- **No se buscan personas famosas ni marcas.** El script bloquea el pedido y pide la imagen al alumno cuando:
  - el término tiene una marca conocida (lista en el script: «nike», «iphone», «coca cola»…) o las palabras logo/marca/brand;
  - el término pide una persona famosa (celebrity, singer, actor…);
  - el término entero es una entrada de Wikidata descrita como persona («American businessman (born 1971)») o empresa/marca («athletic equipment company», «line of smartphones…»).
- Entre las candidatas también salen: títulos con nombre y apellido de personas («Katy Perry DNC…», «Sarah Vaughan…»), anuncios, logos, marcas en el título, animales muertos/atropellados y, para `foto`, pinturas e ilustraciones. En Commons, los archivos marcados como «personality» o «trademarked».
- `print` solo sale de la carpeta del alumno. Nada de inventarse capturas de noticias o de posts.
- Los profesionales sanitarios siguen las normas de su colegio profesional (médicos, dentistas) en los antes y después.
- El filtro es una red, no una garantía: la elección en la hoja es obligatoria (gente reconocible al fondo, marcas de agua, logos en el envase).

## Fuentes, licencias y calidad real

Orden: carpeta del alumno → Openverse → Wikimedia Commons → Pexels (con clave) → Fluent Emoji 3D (solo `objeto`, va primero en la cola por ser transparente) → tarjeta. En las fotos, la palabra buscada **en el título** va antes que la que solo está en las etiquetas, y CC0/dominio público antes que CC BY. CC BY-SA, NC y ND se quedan fuera (obligarían a licenciar el vídeo igual, prohíben el uso comercial o la edición).

| Fuente | Licencias aceptadas | Tamaño real | Cómo sale |
|---|---|---|---|
| Carpeta del alumno | del alumno | lo que haya mandado (hasta 1600) | la mejor; WebP, AVIF y SVG se convierten con el navegador; HEIC solo en el Mac (sips) |
| Openverse / Flickr | CC0, dominio público, CC BY | **1024 px** en el lado mayor (la API solo da ese) | relevancia media; mucha foto amateur; sirve para tarjeta, queda blanda a pantalla completa |
| Openverse / StockSnap, rawpixel | CC0 | 960–1024 px | las más «de banco» de lo gratuito; rawpixel tiene mucho fondo antiguo/vintage; las dos repiten la misma foto (el script quita la repetida) |
| Openverse / iNaturalist | CC0, CC BY | 1200–1600 px | foto de campo: muchos animales atropellados o de lejos; va al final de la cola |
| Wikimedia Commons | CC0, dominio público, CC BY | 1600 (miniatura de 1920) | la mejor resolución gratuita; muy buena para comida típica, animales (nombre científico), lugares, objetos de museo (MET, fondo neutro); mucha cosa es CC BY-SA y se queda fuera |
| Pexels (`PEXELS_API_KEY`) | Licencia Pexels (sin crédito) | hasta 1880 px | no probado aquí (sin clave). Es el salto de calidad para fotos de producto y del día a día |
| Fluent Emoji 3D | MIT | **256×256** | bonito y coherente, ya recortado; nítido hasta ~300 px en pantalla, aceptable hasta ~500 px (queda suave), no sirve en grande |

Resultado de la prueba (10 pedidos, sin Pexels):

| Pedido | Elegida | Nota |
|---|---|---|
| miel (`honey jar`) | StockSnap CC0, 960×1440 | buena; 4 de 6 útiles |
| pirámides (`egypt pyramids`) | Commons CC0, 1600×1200 (puesta de sol) | 1 foto moderna buena; el resto es vintage, grabado o satélite |
| pan de queso brasileño (`brazilian cheese bread`) | Commons CC BY 2.0, 1600×1600 | 4 de 5 buenas, casi todas piden crédito |
| acarajé (`acaraje` → `acaraje bahia`) | Commons CC BY 2.0, 1290×968 | con «acaraje» salieron percusionistas y el akara nigeriano; con «bahia», 5 buenas |
| civeta (`asian palm civet` → `paradoxurus hermaphroditus`) | Commons dominio público, 1600×1514 | con el nombre común: pinturas y animales atropellados; con el científico, 5 fotos de animales vivos |
| freidora de aire (`air fryer`) | Commons CC BY 4.0, 1512×1600 (fondo blanco) | 2 fotos del aparato; el resto es comida hecha en él |
| micrófono (`microphone`, objeto) | Fluent 3D 256 px | 3D muy bueno; en las fotos, los filtros quitaron a Katy Perry y a Sarah Vaughan |
| trípode (`tripod` → `camera tripod`) | StockSnap CC0, 960×1440 | sin 3D; «tripod» solo trae barreños y calderos |
| moneda (`coin`, objeto) | Fluent 3D 256 px | 3D bueno; fotos de monedas antiguas de museo |
| sillón (`armchair`) | Commons CC0, 1600×1600 (MET) | sillones de museo sobre fondo neutro: buenos para tarjeta, nada de salón moderno |

En resumen: para **tarjeta y máscara** lo gratuito sirve en la mayoría de los términos, con 1 o 2 ajustes de búsqueda. Para **pantalla completa vertical** casi todo queda blando: una foto apaisada de 1600×1200 necesita ampliarse 1,6× para cubrir 1080×1920, y las de Flickr (1024), 2,8×. Mejor las verticales (StockSnap, Commons) para pantalla completa, o `--lado 2400` con fotos de Commons. El producto moderno (freidora de aire, móvil, zapatillas) es el punto débil: ahí entran la carpeta del alumno o la clave de Pexels.

## Caché, internet y límites

- Caché en `~/.cache/modelos-edicao/imagens/`: `buscas/` (respuestas de las API, 14 días; Wikidata 90), `arquivos/` (descargas), `normalizadas/` (ya convertidas) y `fluent/indice.json` (60 días). La prueba (10 pedidos, con las búsquedas repetidas varias veces) dejó ~90 MB; el índice de Fluent guarda también el árbol del repositorio (7 MB) en `buscas/`.
- Sin internet: avisa una vez y sigue con la carpeta del alumno, la caché y las tarjetas. Los pedidos que se quedaron sin imagen por eso se rehacen solos cuando vuelve la red.
- Una API caída o con error: esa fuente sale de la ronda y las demás siguen.
- Límites de las API sin cuenta:
  - **Openverse: 20 búsquedas por minuto y 200 al día** (1 búsqueda por pedido). El script frena el ritmo antes de pasarse del minuto; en el límite diario, avisa y sigue con Commons y la caché.
  - Wikimedia Commons y Wikidata: sin límite práctico para este uso (el script se identifica, como piden).
  - GitHub: 60 consultas por hora; el índice de Fluent es 1 consulta cada 60 días.
  - Pexels: 200 por hora, 20.000 al mes.
- Tiempo: ~50 s para 10 pedidos la primera vez (búsqueda, descarga, conversión, hoja); ~15 s rehaciéndolo todo con la caché; `--folha` ~3 s; `--escolher` es instantáneo (no empaqueta nada).

## Para unirlo al motor (Tiago)

1. Copiar:
   - `motor-imagens/scripts/imagens.mjs` → `motor/scripts/imagens.mjs`
   - `motor-imagens/src/imagem.tsx` → `motor/src/imagem.tsx`
   - `motor-imagens/src/FolhaImagens.tsx` → `motor/src/FolhaImagens.tsx`
   - este archivo → `motor/IMAGENS.md` (y, en los modelos con imagen, a `references/imagens.md` de la skill: se puede añadir a `montar.py` como `adaptar.md`).
2. No cambia nada en `montar.py` para los archivos de código: ya copia todo lo de `motor/scripts` y `motor/src`. Los dos `.tsx` compilan con el `tsconfig` de las plantillas (probado con `npx tsc --noEmit` en Autoridad); ninguna plantilla tiene que importar nada si no usa imágenes.
3. Opcional, en `motor/scripts/comum.mjs`: añadir `"folha", "limpar", "offline"` a `SEM_VALOR` (hoy funcionan porque no llevan nada detrás; con eso quedan a prueba del orden de los argumentos).
4. `CONTRATO.md`: un apartado corto «Imágenes» que apunte a `IMAGENS.md` (campo `plano.imagens`, `imagem: { id, foco?, efeito? }` en los momentos, `<Foto>`/`<Recorte>`/`<SemImagem>`, regla de no dejar nunca un hueco).
5. `SKILL-MOLDE.md`: el paso de abajo, entre «6. Mapa editorial» y «7. Planificar los momentos», en los modelos con imagen.
6. `.gitignore` de las plantillas (si lo hay): `public/img/candidatas/` y `creditos.txt` no van en la plantilla que se entrega.

### Bloque para el SKILL.md de los modelos con imagen

```markdown
### 6b. Imágenes

Lee `references/imagens.md`.

1. A partir del mapa y de `work/palavras.json`, haz una lista de cada cosa concreta que nombra la persona y que vale la pena mostrar (una cada 2 a 4 s en los tramos de imagen; nunca dos en la misma frase). Escribe `work/imagens.json`: `id`, `em` (instante de la palabra), `palavra`, `busca` (en inglés, concreta: "camera tripod"; animales y plantas por el nombre científico), `tipo` (`foto`, `objeto` o `print`) y `arquivo` cuando venga de la carpeta `imagens/` del usuario.
   - Nada de personas famosas ni de marcas en la búsqueda: pide la imagen al usuario (`imagens/`). Capturas, solo las reales que mande.
2. `node scripts/imagens.mjs`. Lee los avisos.
3. Abre `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, elige la candidata que muestra el sujeto entero, reconocible en 1 s, sin gente reconocible, logos ni textos; foto de verdad cuando es foto; en vertical cuando va a pantalla completa.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = el sujeto, en fracciones de la imagen entera; las líneas de la hoja marcan 0,25 / 0,5 / 0,75). Si no sirve ninguna: `--refazer <id> --busca "otro término"`; si todavía no: `--escolher <id> 0` (pasa a ser una tarjeta con la palabra).
5. `node scripts/imagens.mjs --folha` y comprueba el círculo verde del foco. Después `--limpar`.
6. En los momentos, `imagem: { "id": "miel", "efeito": "aproximar" }`. Si `creditos.txt` lista imágenes CC BY, entrega el texto al usuario para la descripción de la publicación.
```
