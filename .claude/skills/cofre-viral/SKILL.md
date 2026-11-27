---
name: cofre-viral
description: "Edita cualquier vídeo de una persona hablando a cámara en el estilo Viral, la edición de retención de los Reels: gancho escrito en el primer segundo, subtítulo karaoke con la palabra dicha en una tarja rosa, zoom de impacto en la cara en los cortes y las palabras fuertes, imágenes que cortan a pantalla completa o saltan como tarjeta sobre la cabeza (la persona baja a la mitad inferior) y barra de progreso arriba, en Montserrat gruesa, placas oscuras y rosa. Sirve para cualquier tema (el ejemplo es una curiosidad sobre la miel): la IA traduce lo dicho a los bloques del estilo y busca las imágenes sola. Úsala siempre que el usuario pida editar «en el modelo Viral», «estilo Viral», una «edición Viral», una «edición de retención», «con subtítulos karaoke», «con imágenes que salen cuando hablo» o «estilo curiosidades», o una edición lista para Reels, TikTok o Shorts con ese aspecto. Entrega un MP4 vertical de 1080×1920."
---

# Modelo Viral

El vídeo se convierte en una edición de retención: la persona a pantalla completa, con un salto de zoom en la cara en cada corte y en cada palabra fuerte; el subtítulo en pantallas cortas de hasta tres palabras, con una tarja rosa que corre de palabra en palabra; y, en las cosas concretas que nombra la persona, la imagen **corta** a toda la pantalla durante un segundo o **salta** como una tarjeta encima de la cabeza mientras la persona baja a la mitad de abajo. Los scripts hacen la parte mecánica (medir, transcribir, cortar, encuadrar, buscar imágenes, comprobar, renderizar); tú haces la parte de editor (elegir las tomas, traducir lo que se dice a bloques, elegir las imágenes, comprobar los fotogramas).

**Este modelo es un estilo, no un tema.** El ejemplo está hecho con una curiosidad (la miel que no se estropea), pero el vídeo del usuario puede tratar de cualquier cosa. Sigue `references/adaptar.md` para traducir lo que se dice a bloques de este estilo. Una edición con solo subtítulos, apertura y cierre es un error: `render.mjs` la rechaza.

## El estilo (lo que define este modelo, con cualquier contenido)

- **Dinámica del motion:** ritmo de retención. El gancho se escribe en los primeros ~0,8 s (la primera palabra ya está en el primer fotograma). Cada corte del vídeo es un salto seco de zoom (alterna 100 % y 109 %); cada palabra fuerte (destacado, número, gancho, llamada) es un «puñetazo» de zoom del 11 % que entra en 0,14 s y vuelve despacio, siempre centrado en la cara (que se sigue fotograma a fotograma). Los textos llegan como pegatinas: escala pasándose un poco del punto (0,25 s); el destacado llega como un sello (más grande → se asienta en 0,2 s). La imagen del corte entra seca, un 7 % más grande, y se asienta; después se acerca despacio. Nada se queda quieto: la tarja del subtítulo avanza en cada palabra.
- **Organización y jerarquía:** tres sitios que se alternan. **Pantalla completa** (la persona entera; el texto en tarjas a la altura del pecho); **imagen arriba, persona abajo** (la persona baja a la mitad de abajo y la mitad de arriba recibe la tarjeta de imagen, la lista, la comparación o el gráfico); **foto a pantalla completa** (el corte, ~1 s, con el subtítulo encima). Una idea por pantalla; el texto principal grande y los rótulos más pequeños.
- **Tipografía:** una sola familia, **Montserrat** (Google Fonts), ancha y gruesa: 900 en mayúsculas en el subtítulo, el gancho, los destacados, los números y los títulos; 800 en elementos y opciones; 700 en detalles. Cifras del mismo ancho en los contadores. Subtítulo 66 px; gancho 62–112; destacado 64–128; número 96–230; títulos 44–78; elementos 28–62. Nada condensado ni con contorno: el contraste sale de las placas oscuras y de las tarjas de color.
- **Marco de la persona:** pantalla completa con la cara en la línea del centro y zoom de impacto; o la mitad de abajo (desde y 820), con la cabeza entera justo debajo del subtítulo, que va en la costura. El cambio empuja: la mitad de arriba baja junto con la costura y la persona se desliza hacia abajo (0,38 s); a la vuelta, sube tapándolo todo. Nunca una columna estrecha al lado.
- **Colores, textura y sonido:** placas de grafito casi negras (#121016, 90 %) detrás del texto blanco; **rosa** (#FF2E63, con un borde más oscuro debajo, aire de pegatina) para la palabra que se dice, el trozo destacado, la costura y la barra de progreso; **amarillo** (#FFC21A, texto oscuro) solo para la alerta; verde (#2BD97C) solo para el lado correcto. Sonidos tonales y escasos: un «tum» grave en el corte, una burbuja en la tarjeta que salta, un grave redondo en el sello, dos notas que bajan en la alerta, un toque corto en los elementos y tres notas que suben en el cierre.

## Antes de empezar

1. **Entorno.**
   - Este modelo funciona **en el ordenador** del usuario: Claude Code, la app de Claude con acceso al terminal o Codex (en la app de ChatGPT o en el terminal).
   - Necesita Node 18+, unos 3,5 GB libres e internet la primera vez (Whisper y el modelo de transcripción, 1,6 GB, se descargan una sola vez; el navegador del render, 100 MB) y para buscar las imágenes. En el Mac, la transcripción compila Whisper con las herramientas de Xcode (`xcode-select --install`).
   - Si no puedes ejecutar comandos en el ordenador del usuario (ChatGPT o Claude en el navegador, sin terminal), **para y explícalo**. No entregues una versión simplificada (solo subtítulos, cortes hechos por otro camino).
2. **Carga la skill de Remotion** (`remotion-best-practices`). Si no está instalada, pide al usuario que ejecute `npx skills add remotion-dev/skills`. El proyecto ya viene listo: no hace falta `remotion-create` ni el Studio (los fotogramas de `stills.mjs` son la vista previa). Pedir la edición ya es pedir el render.
3. Confirma la ruta del vídeo. Pregunta una vez **nombre y área** de quien habla (p. ej.: «Carla» / «Curiosidades»): van en una etiqueta debajo de la llamada final. Sin respuesta, sigue sin nombre. Pregunta también si tiene **imágenes propias** (producto, captura, foto personal): van en una carpeta `imagens/` dentro del proyecto y pasan delante de las buscadas.

## Flujo

Ejecuta todo desde dentro de la carpeta del proyecto creada en el paso 1.

### 1. Crear el proyecto

Copia `assets/template/` de esta skill a una carpeta nueva, por ejemplo `edicion-<nombre-del-video>/`, y ejecuta `npm install` dentro de ella.

Crea esa carpeta **fuera de las carpetas sincronizadas con la nube** (iCloud en Documentos/Escritorio, OneDrive, Dropbox, Google Drive). Vacían los archivos locales y Node se queda colgado leyendo `node_modules`. `~/Movies` en el Mac o `C:\Videos` en Windows funcionan bien.

### 2. Analizar

```bash
node scripts/preparar.mjs "/ruta/del/video.mp4"
```

Mide el vídeo, transcribe cada tramo de voz por separado (con tiempo por palabra) y guarda la propuesta en `work/cortes.json`: **un elemento por tramo de voz**, con las frases y el segundo en que empieza cada una. Opciones: `--idioma en` para otro idioma (por defecto, `es`), `--modelo small` para ordenadores poco potentes.

### 3. Elegir las tomas

Lee la lista como un editor. En `work/cortes.json`, marca `"manter": false` en:

- **intentos abandonados y repetidos**: la misma frase empezada varias veces. Se queda el último intento completo;
- **errores, toses, «espera, otra vez»**, comentarios después del final («listo, gracias»).

Cuando solo vale una parte de un elemento, divídelo en dos con el tiempo de inicio de las frases (`frases[].em`): el primero termina 0,05 s antes de la frase que sale, el segundo empieza en ella, y marca el que sale. Un aviso `[comprobar: poca voz para la duración]` indica un tramo largo con poca voz: escúchalo con atención, suele esconder repeticiones.

**Los números cortos dichos solos** («Mil.», «Cien.») a veces vuelven como `[sin voz, sale]`. Antes de aceptar uno de esos elementos en mitad del vídeo, mide su volumen (`ffmpeg -ss <de> -t <duración> -i video.mp4 -af volumedetect -f null -`): cerca de −60 dB es silencio; −30 dB o más alto es voz. Si es voz, marca `"manter": true` y añade la palabra en `work/analise.json` (en `palavras`, en orden de tiempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`).

**Los elementos marcados `[sin transcripción: escúchalo antes de quitarlo]`** pueden ser voz que Whisper ha perdido: vienen con `"manter": true` y solo salen si confirmas que no hay voz.

**Dos versiones completas con contenido distinto** no son una toma repetida: pregunta al usuario cuál se queda. Si no puedes preguntar, quédate con la última y di en la entrega cuál se ha quedado y por qué.

En este modelo **las pausas se convierten en cortes directos, y cada corte lleva un salto de zoom**: es el ritmo del estilo. Mantén la propuesta de `preparar.mjs`.

### 4. Medir la cara y cortar

Abre `work/medir-1.jpg`, `-2` y `-3` (principio, medio y final de la grabación, con una cuadrícula de 0,05 en 0,05 encima) y lee, en fracciones (0 = izquierda/arriba, 1 = derecha/abajo):

- el **centro de la cara** (entre los ojos y la punta de la nariz) → `--rosto-x` y `--rosto-y`;
- la **punta de la barbilla** → `--queixo-y`.

Usa la posición más habitual; si la persona se mueve mucho, quédate en el centro del movimiento. Después:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

El script corta, encuadra y calcula `rosto`, `zona` y los puntos de corte en el plan. **El recorte ya viene decidido por el modelo**: `modelo.json` fija la grabación vertical en 9:16 (la persona cambia de sitio entre la pantalla completa y la mitad de abajo); una grabación horizontal pasa a 3:4. No hace falta pasar `--recorte`. Si rehaces el corte después de haber planificado, usa `--manter-plano`: los momentos, la marca, las imágenes y las correcciones se mantienen.

Al final, `cortar.mjs` también sigue la cara por el vídeo (unos segundos): el zoom de impacto y la mitad de abajo la acompañan cuando la persona se mueve y, si el centro leído en la cuadrícula falló, rehace el corte con la cara en el centro. Si en las guías la cara se sale de su sitio en algún tramo, ejecuta `node scripts/rastrear.mjs --conferir <segundos>` y sigue lo que te indique.

### 5. Comprobar el encuadre

```bash
node scripts/stills.mjs --guias
```

Genera tres fotogramas con guías: la elipse azul tiene que caer en la cara; la caja verde discontinua (la zona del pecho, donde van los textos de pantalla completa) tiene que empezar debajo de la barbilla; las líneas amarillas son la franja del subtítulo; la rosa es la costura (donde empieza la persona cuando baja); nada importante fuera de las líneas rojas (interfaz de la app y la columna de botones de la derecha). Si no está bien, rehaz el paso 4 con las medidas corregidas.

### 6. Mapa editorial

Lee `references/adaptar.md` y haz el mapa de lo que se dice en `work/mapa.md`: divídelo en golpes de 1 a 4 s (Viral es rápido), dale a cada uno una forma (lista, número, comparación, cosa concreta, palabra fuerte…) y elige el bloque **de este modelo** en la tabla «Bloques de este modelo», abajo. **La firma (`corte` y `pop`) entra al menos una vez**, y a ser posible en cada cosa concreta que se nombra: mira «La firma en cualquier tema».

Alterna los tres sitios: pantalla completa → imagen → pantalla completa. Nunca tres momentos iguales seguidos. Abre con la `abertura` (el gancho) y cierra con el `cta`.

### 6b. Imágenes

Lee `references/imagens.md`.

1. A partir del mapa y de `work/palavras.json`, haz una lista de cada cosa concreta que nombra la persona y que vale la pena mostrar (una cada 2 a 4 s en los tramos de imagen; nunca dos en la misma frase). Escribe `work/imagens.json`: `id`, `em` (instante de la palabra), `palavra`, `busca` (en inglés, concreta: "camera tripod"; animales y plantas por el nombre científico), `tipo` (`foto`, `objeto` o `print`) y `arquivo` cuando venga de la carpeta `imagens/` del usuario.
   - Nada de personas famosas ni de marcas en la búsqueda: pide la imagen al usuario (`imagens/`). Capturas, solo las reales que mande.
2. `node scripts/imagens.mjs`. Lee los avisos. Para las imágenes que van a **pantalla completa** (`corte`), ejecútalo con `--lado 2400`: la foto necesita resolución para cubrir 1080×1920.
3. Abre `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, elige la candidata que muestra el sujeto entero, reconocible en 1 s, sin gente reconocible, logos ni textos (las micrografías suelen llevar una franja de datos abajo: a pantalla completa se ve); foto de verdad cuando es foto; **en vertical y grande (1600 px o más) para el `corte`**; las pequeñas o apaisadas van al `pop` (tarjeta).
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = el sujeto, en fracciones de la imagen entera; las líneas de la hoja marcan 0,25 / 0,5 / 0,75). Si no sirve ninguna: `--refazer <id> --busca "otro término"`; si todavía no: `--escolher <id> 0` (pasa a ser una tarjeta con la palabra).
5. `node scripts/imagens.mjs --folha` y comprueba el círculo verde del foco. Después `--limpar`.
6. En los momentos, `imagem: { "id": "miel", "efeito": "aproximar" }`. Si `creditos.txt` lista imágenes CC BY, entrega el texto al usuario para la descripción de la publicación.

### 7. Planificar los momentos

Lee `references/plano.md` (los campos de cada bloque, los límites de texto y las reglas de tiempo) y rellena `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` y, si quieres, `impactos`. Cada elemento, lado, dato o imagen entra en el `em` de la palabra que lo nombra, sacado de `work/palavras.json`.

Después:
- `node scripts/conferir.mjs --mapa`: corrige hasta que salga **APROBADO** (no uses nunca `--forcar`). Cuando lo rechace, lee el trozo dicho que señala y elige un bloque para él;
- `node scripts/legendas.mjs`: lista las líneas de subtítulo (la plantilla todavía las parte en pantallas de hasta 3 palabras).

Los nombres y términos que la transcripción haya escrito mal van en `correcoes` (p. ej.: `{ "chat GPT": "ChatGPT" }`). Corrige solo lo que tengas claro.

### 8. Comprobar los fotogramas

```bash
node scripts/stills.mjs --momentos
```

Genera, para cada momento, un fotograma justo antes, uno en el centro, uno justo después de cada subpaso (cada `em`) y uno justo después del final. Abre cada imagen **reducida al ancho de un móvil (~540 px)** y compruébala de verdad:
- ¿la imagen del `corte` muestra el sujeto entero y **por encima del subtítulo** (si el sujeto ha quedado pequeño en una foto ancha, usa `zoom` 1,3–1,6 en el corte)? ¿Nada de texto, marcas de agua ni gente reconocible?
- ¿la tarjeta del `pop` está entera por encima del subtítulo de la costura, y la cabeza de la persona entera debajo?
- ¿el gancho aparece en el primer fotograma y termina en menos de 1,5 s?
- ¿cabe el texto (nada cortado), aparece el número correcto cuando se dice la palabra, cae la tarja del subtítulo en la palabra que se dice?
- en los cambios, ¿ningún fotograma con la mitad de arriba vacía, ningún texto del pecho encima de la cara que todavía está subiendo y ningún texto encima de otro? Genera fotogramas cada 0,05 s alrededor de cada cambio (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- ¿nada importante fuera de las líneas de la interfaz de la app?

Corrige el plan (texto más corto, otra imagen, otro foco, otro `em`) y repite hasta que esté limpio.

### 9. Renderizar y entregar

```bash
node scripts/render.mjs "out/<nombre-del-video>-viral.mp4"
```

Vuelve a comprobar el plan, renderiza y normaliza el audio a −14 LUFS. Entrega:
- la ruta del archivo;
- la duración y cuánto se ha cortado;
- el **mapa resumido** (qué bloque ha entrado en cada tramo);
- las **imágenes usadas** y de dónde vienen, y el texto de `creditos.txt` cuando haya CC BY;
- lo que es ilustrativo (curvas de tendencia, números marcados como `ilustrativo`);
- lo que el usuario debe comprobar (una toma dudosa, una palabra que la transcripción puede haber escrito mal, una imagen que solo él puede cambiar por otra mejor).

## Bloques de este modelo

| Forma de la información | `tipo` en el plan | Cómo aparece en este estilo |
|---|---|---|
| apertura | `abertura` | pantalla completa: el gancho escrito en tarjas en el pecho, palabra a palabra en menos de 1 s, el `destaque` en la tarja rosa, con puñetazo de zoom; con `imagem`, encima de una foto a pantalla completa |
| lista | `topicos` | persona abajo: título blanco con un trazo rosa; cada elemento es una tarjeta blanca que salta en su `em` (con la foto del elemento en un círculo, si tiene `imagem`); el elemento en curso se vuelve rosa |
| pasos | `passos` | persona abajo: tarjetas numeradas unidas por un trazo rosa que baja hasta el paso en curso |
| número | `numero` | pantalla completa: el número cuenta en una placa oscura gigante (formato español, cifras de ancho fijo), el rótulo se estampa en una tarja rosa debajo, con puñetazo de zoom; con `imagem`, encima de la foto a pantalla completa |
| comparación | `comparacao` | persona abajo: dos tarjetas que se encaran (foto arriba si tiene `imagem`, rótulo en la tarja, texto grande); antes de que se digan, el sitio de cada una espera con un «?»; VS en el centro (`contra`), flecha (`antes-depois`), ✗ amarilla y ✓ verde (`errado-certo`); el ganador lleva borde rosa y el otro se vuelve gris |
| gráfico | `grafico` | persona abajo: barras blancas con la más alta en rosa, línea rosa que avanza de punto en punto, rosca de colores; sin números dichos, la curva de la tendencia (verde sube, rosa baja, amarilla oscila) con «ILUSTRATIVO» |
| destacado | `destaque` | pantalla completa: la palabra estampada en tarjas rosas (`chave`) o amarillas con texto oscuro (`alerta`), inclinada, con puñetazo de zoom; `detalhe` en una placa oscura más pequeña debajo |
| definición | `definicao` | persona abajo: el término enorme en blanco, un trazo rosa que se dibuja debajo y el significado en una tarjeta blanca que sube con la voz |
| frase | `frase` | pantalla completa: la frase en tarjas en el pecho, palabra a palabra con la voz, con un sello rosa de comillas; `destaque` en la tarja rosa; `risco` tachado en rosa cuando se dice |
| pregunta | `pergunta` | persona abajo: la pregunta grande en blanco; las `opcoes` entran como opciones de encuesta (letra en el círculo rosa) y la más reciente se vuelve rosa; sin opciones, un «?» rosa que se balancea |
| cierre | `cta` | pantalla completa: la llamada en tarjas, `destaque` rosa, el icono en un círculo rosa con un anillo que late (`salvar`, `seguir`, `comentar`, `link`) y la etiqueta con nombre y área; se queda hasta el último fotograma |
| **firma** | `corte` | la imagen ocupa toda la pantalla de 0,8 a 1,2 s: entra seca, un 7 % más grande, se asienta y se acerca despacio; el subtítulo sigue encima; `zoom` acerca un sujeto pequeño y lo pone por encima del subtítulo; `rotulo` opcional en una tarja arriba |
| **firma** | `pop` | la persona baja a la mitad de abajo y una tarjeta de foto con borde blanco salta encima de la cabeza (inclinada, alternando el lado), sobre la propia foto desenfocada; el subtítulo sigue en la costura; un objeto 3D transparente pasa a ser una pegatina suelta; `rotulo` opcional en una tarja en la esquina |

## La firma en cualquier tema

El `corte` y el `pop` son **«enseña lo que la persona acaba de nombrar»**: cada cosa concreta de lo que se dice (un lugar, un objeto, un animal, un producto, un gráfico, un documento) se convierte en imagen en el instante en que se dice. El `corte` es para lo que merece toda la pantalla durante un segundo (lugar, paisaje, primer plano impresionante, el resultado); el `pop` es para lo que se ve mejor como objeto, al lado de la persona (producto, documento, foto pequeña o apaisada). Hasta un tema abstracto tiene cosas concretas: el ejemplo, el lugar, el objeto que usa la persona para explicarlo.

1. **Finanzas/cripto.** «El Bitcoin ha pasado de los 83.000 dólares, pero la mayoría compra por impulso, en plena subida, y vende con el pánico.»
   `numero` 83.000 (`sufixo: " $"`, `rotulo: "el Bitcoin"`) → `corte` en «subida» con una foto de un parqué o de un gráfico que sube en un monitor (`busca: "stock market screen"`) → `pop` en «impulso» con un móvil en la mano (`busca: "smartphone in hand"`) → `destaque` alerta «vende con el pánico». Sin marca y sin logo en la búsqueda: la moneda pasa a ser el objeto 3D `coin` (`tipo: "objeto"`), que el `pop` muestra como una pegatina suelta.
2. **Salud (sueño).** «Quien duerme menos de seis horas come más dulce al día siguiente. La luz del móvil retrasa el sueño, así que déjalo fuera del dormitorio.»
   `numero` 6 (`rotulo: "horas de sueño"`) → `pop` en «dulce» (`busca: "chocolate cake slice"`) → `corte` en «luz del móvil» con un dormitorio a oscuras iluminado por la pantalla (`busca: "phone screen dark bedroom"`) → `cta` «déjalo fuera del dormitorio» con `icone: "salvar"`.
3. **Historia personal (cambio de ciudad).** «Me fui de Sevilla con una maleta y quinientos euros. Mi primer trabajo fue fregando platos. Hoy tengo mi restaurante.»
   `abertura` «Me fui de Sevilla con una maleta» → `corte` en «Sevilla» (`busca: "seville spain skyline"`) → `pop` en «maleta» (`tipo: "objeto"`, el 3D de la maleta) → `numero` 500 (`sufixo: " €"`, `rotulo: "en el bolsillo"`) → `comparacao` `antes-depois` («fregando platos» × «mi restaurante») con `imagem` en cada lado (la foto del restaurante viene de la carpeta `imagens/` del usuario).

Si en un tramo no hay nada concreto, usa `destaque`, `frase` o `topicos`; pero toda edición tiene al menos un `corte` o un `pop`.

## Fidelidad

- Todo lo que sale en pantalla viene de lo que se dice; los textos se pueden resumir con sus palabras, sin cambiar el sentido («prácticamente no se estropea» no pasa a ser «nunca se estropea»).
- No te inventes números, nombres, precios ni hechos. La imagen ilustra lo que se ha dicho; no enseña algo que no se ha dicho (nada de fotos de una marca, de una persona real o de una «captura» que no existe).
- Un número ilustrativo, solo donde el bloque lo permite (la curva de tendencia, `ilustrativo: true`), siempre con la etiqueta ILUSTRATIVO a la vista.

## Cuando algo sale mal

- **`conferir.mjs` lo ha rechazado**: lee el trozo dicho que señala (el hueco, el momento quieto, el tipo que falta) y elige un bloque para él. En un hueco casi siempre cabe un `pop` o un `corte` de la cosa que está nombrando la persona. No uses `--forcar`.
- **La firma «no encaja» con el tema**: busca el ejemplo, el lugar o el objeto de lo que se dice (mira arriba). Sin una imagen buena, `--escolher <id> 0` pasa a ser una tarjeta tipográfica con la palabra, en el mismo sitio.
- **La imagen del corte ha quedado blanda o con el sujeto pequeño**: elige una candidata vertical y más grande (`--lado 2400`), cambia el foco, usa `zoom` en el corte o lleva la imagen a un `pop` (una tarjeta más pequeña queda nítida).
- **La imagen tiene texto, marca de agua o franja de datos**: otra candidata, u otro foco que saque la franja del fotograma; en el `pop`, la tarjeta recorta por el foco.
- **Los comandos se quedan colgados sin mensaje**: seguramente el proyecto está en una carpeta sincronizada con la nube. Muévelo y vuelve a ejecutar `npm install`.
- **La búsqueda de imágenes ha avisado del límite diario**: Openverse permite 200 búsquedas al día; el script sigue con Wikimedia y la caché. Vuelve a ejecutarlo más tarde para los pedidos que se han quedado sin imagen.
- **La transcripción ha escrito mal un nombre o un término**: usa `correcoes` en el plan.
- **Falla la compilación de Whisper en el Mac**: faltan las herramientas de Xcode (`xcode-select --install`).
- **Texto demasiado pequeño o partido en muchas líneas**: el texto ha pasado del límite del bloque (mira `references/plano.md`); acórtalo con las palabras de lo que se dice o usa menos elementos.
- **El texto del pecho ha entrado un poco después de la palabra**: justo después de un `pop` o de una lista, espera a que la persona vuelva a pantalla completa (para no caer encima de la cara). Si la palabra es importante, termina el momento anterior un poco antes.
- **Aviso de ampliación en `cortar.mjs`**: la grabación tiene poca resolución para el recorte; el vídeo sale menos nítido. Avisa al usuario.
