# El estilo Viral

Léelo antes de cambiar cualquier componente, color o fuente de la plantilla. El valor de este modelo es la **retención**: el ojo nunca se queda sin un motivo para seguir (la palabra dicha encendida, un salto de zoom, una imagen que corta, la barra que avanza), sin llegar a ensuciar. Está hecho de pocas piezas repetidas con rigor: placa oscura, tarja rosa, tarjeta blanca, foto a pantalla completa. Casi cualquier «mejora» que añade otro tipo de pieza (brillo, contorno, emoji suelto, transición con efecto) lo empeora.

El estilo vale para cualquier tema: curiosidades, noticias, finanzas, salud, negocios, historias. Lo que cambia de un vídeo a otro es el contenido de los bloques y las imágenes, nunca el lenguaje visual de abajo.

## La idea

La persona habla y el vídeo **enseña lo que acaba de nombrar**. Una cosa concreta se convierte en imagen en el instante de la palabra: toda la pantalla durante un segundo (el corte) o una tarjeta encima de la cabeza (el pop). Una palabra fuerte se convierte en un sello en el pecho con un puñetazo de zoom. El resto del tiempo, el subtítulo karaoke sujeta la atención. Diferencia con Impacto (tipografía pura): aquí la imagen de apoyo es la protagonista.

## 1. Dinámica del motion

- **Gancho escrito**: entra entero en menos de 1 s, una palabra cada ~0,1 s; con el vídeo empezando en él, la primera palabra ya está en el primer fotograma.
- **Zoom en la cara**: salto seco en cada corte del vídeo y a la vuelta de cada foto a pantalla completa (alterna 100 % y 109 %); puñetazo de +11 % en las palabras fuertes (entra en 0,14 s, aguanta 0,36 s y vuelve en 0,9 s). Siempre anclado en la cara (que se sigue fotograma a fotograma). Nunca más del 130 %.
- **Pegatinas**: los textos y las tarjetas llegan con escala (60–82 % → 100 %) pasándose un poco del punto, en 0,24–0,34 s. El destacado llega como un sello (145 % → 100 % en 0,2 s). Al terminar la entrada, el texto se queda dibujado sin más, sin capa de animación.
- **Corte**: la foto entra seca, un 7 % más grande, se asienta en 0,22 s y se acerca despacio (12 %) hasta que sale seca. Nada de fundidos ni de destellos.
- **Cambio de sitio**: la persona baja a la mitad de abajo en 0,38 s y la mitad de arriba baja junto con la costura (el contenido entra empujando). A la vuelta, sube por encima del contenido. Ningún fotograma con la mitad de arriba vacía; ningún texto encima de otro (el contenido que sale desaparece en 0,16 s antes de que entre el nuevo).
- **Nada quieto**: la tarja del subtítulo avanza en cada palabra; el «?» de la comparación se balancea; la llamada final respira; la barra de arriba avanza durante todo el vídeo.

## 2. Organización y jerarquía

- **Tres sitios que se alternan**: pantalla completa (texto en el pecho, en la `zona` de debajo de la barbilla) → imagen arriba y persona abajo (contenido entre y 128 e y 752; costura en y 820) → foto a pantalla completa. Nunca tres iguales seguidos.
- **Una idea por pantalla**: un sello, un número, una tarjeta, una lista corta.
- **Subtítulo**: pantallas de hasta 3 palabras en una línea, centradas; debajo de la barbilla a pantalla completa y en la costura con la persona abajo. En el corte, encima de la foto (la foto con zoom sube el sujeto a ~40 % de la altura, por encima de él). Ninguna pantalla acaba en palabra átona.
- Esquinas reservadas: nada por encima de y 110 aparte de la barra de progreso (pestañas de la app), nada importante por debajo de y 1540 ni en la columna de la derecha por debajo de y 1080 (botones de la app).

## 3. Tipografía

- **Una sola familia: Montserrat** (Google Fonts), ancha y de trazo grueso: se lee de lejos en el móvil.
- 900 en mayúsculas: subtítulo, gancho, destacado, número, títulos, rótulos y tarjas. 800: elementos, opciones, significado. 700: detalles.
- Cifras del mismo ancho en los contadores (el número no «baila»). Números con formato español (3.000; 1,5; 44 €; %).
- **Tamaños** (fotograma de 1080 de ancho): subtítulo 66 (hasta 40 si una palabra es enorme); gancho 62–112; destacado 64–128; número 96–230; rótulo del número 40–100; títulos 44–78; elementos 28–62; detalles ≥ 24. El texto se mide con los anchos reales de la fuente (`src/larguras.ts`) y se reduce hasta que quepa; nunca se corta. Ninguna línea acaba en palabra átona («de», «la», «y»…).
- Nada de fuentes condensadas, nada de contorno en las letras, nada de sombra difuminada en el texto. El contraste sale de las placas.

## 4. Marco de la persona

- **Pantalla completa**: el vídeo entero, con la cara en la línea del centro y el zoom de impacto. Los textos van en el pecho (zona de debajo de la barbilla).
- **Persona abajo**: la caja va de y 820 hasta abajo, a todo el ancho; la cabeza queda entera justo debajo del subtítulo de la costura (la plantilla lo calcula por el ancho de la cara). Un trazo rosa de 8 px marca la costura. Nunca una columna estrecha, nunca una ventana pequeña.
- El vídeo de la persona está montado todo el rato (la voz sale de él), también debajo de las fotos a pantalla completa.

## 5. Colores, textura y sonido

| Papel | Color |
|---|---|
| fondo de la mitad de arriba | `#121016` (grafito violeta casi negro); en el `pop`, la propia foto desenfocada y oscura |
| placas detrás del texto blanco | `rgba(18,16,22,0.9)` |
| tarja: palabra dicha, destacado, costura, barra | rosa `#FF2E63`, con un borde duro `#B8123F` de 6–7 px debajo (aire de pegatina) |
| alerta | amarillo `#FFC21A` con texto oscuro `#141218` |
| el lado correcto | verde `#2BD97C` |
| tarjetas claras (elementos, opciones, significado, borde del pop) | blanco `#FFFFFF` con sombra suave |

- **Nada de negro y dorado** (son los colores del Cofre) y nada de brillo detrás de la persona.
- Sonidos tonales y escasos, generados en el propio proyecto (`public/sfx`): `corte` (un «tum» grave que baja), `pop` (burbuja que sube), `impacto` (grave redondo con una subida corta), `alerta` (dos notas que bajan), `tique` (toque corto), `fim` (tres notas que suben, sinusoidales, sin aire de campana). Nada de ruido, siseo ni «whoosh» de aire.

## 6. Imágenes

- **Corte**: solo imágenes verticales o grandes (1600 px o más), con el sujeto entero, sin texto, logos, marcas de agua ni franjas de datos. Sujeto pequeño en una foto apaisada: `zoom` de 1,3 a 1,6.
- **Pop**: cualquier proporción (la tarjeta sigue la foto, entre 0,74 y 1,62); las fotos pequeñas quedan nítidas en la tarjeta. Un objeto 3D transparente pasa a ser una pegatina suelta.
- Una imagen equivocada o fea es peor que una tarjeta tipográfica (`--escolher <id> 0`).
- Los créditos CC BY van en la descripción de la publicación (`creditos.txt`), nunca en pantalla.

## Lo que no hay que hacer

- Subtítulo con más de 3 palabras o en dos líneas.
- Una imagen que se queda más de 1,5 s a pantalla completa, o dos imágenes en la misma frase.
- Zoom que va y vuelve sin una palabra fuerte (parece un temblor).
- Iconos y emojis decorativos fuera del `cta`.
- Cambiar el color de la tarja según el momento (el rosa es la marca del estilo; el amarillo, solo en la alerta; el verde, solo en lo correcto).
- Escribir «Remotion» o el nombre de cualquier herramienta en pantalla.
