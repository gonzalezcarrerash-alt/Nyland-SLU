# Cómo aplicar este modelo a CUALQUIER vídeo

**Este modelo es un estilo, no un tema.** El vídeo de ejemplo se grabó sobre un tema solo para mostrar el estilo. El vídeo del usuario puede hablar de cualquier cosa: cripto, salud, una receta, ventas, una historia personal, una opinión. Tu trabajo es **traducir lo que dice al lenguaje visual de este modelo**:
- la forma de animar;
- la organización y la jerarquía de la información;
- las fuentes y los colores;
- la forma en que se mueve el marco de la persona.

La pregunta nunca es «¿este vídeo encaja con el modelo?». La pregunta es «¿cómo muestra este modelo esta idea?».

## La regla que no se rompe

No entregues nunca un vídeo solo con subtítulos, apertura y cierre. La pantalla cambia cada 1,5 a 2,5 segundos con algo ligado a lo que se está diciendo: un elemento que entra, un número que cuenta, un dibujo que se completa, un cambio de layout.

`render.mjs` ejecuta `node scripts/conferir.mjs` antes de renderizar y **rechaza** el plan cuando:
- menos de ~70 % del vídeo tiene un momento en pantalla;
- hay un tramo de más de ~3,5 s solo con la persona y el subtítulo;
- hay pocos momentos, o pocos tipos distintos de momento;
- un momento se queda quieto demasiado tiempo;
- no aparece la firma del modelo.

Cuando lo rechaza, dice qué trozo dicho se ha quedado vacío. Elige un bloque para ese trozo y vuelve a ejecutarlo. **No uses `--forcar` para saltarte la comprobación.**

## Paso 0: estudia el ejemplo del modelo (2 minutos, antes del mapa)

La skill trae el ejemplo del modelo en `references/ejemplo/`:
- **`fotogramas.jpg`:** una hoja con 12 fotogramas de la demo, en orden (de izquierda a derecha y de arriba abajo). **Ábrela y mírala.** Es la forma más exacta de entender el estilo: dónde está la persona, cómo aparece el texto, el tamaño de cada cosa, el color de énfasis.
- **`plan-comentado.md`:** cada momento del ejemplo con lo que se dice y el JSON exacto que generó el efecto. Muestra cómo una frase se convierte en un bloque y cómo se acorta el texto de la pantalla.
- **`ejemplo.mp4`:** el vídeo entero. Si necesitas ver un instante entre dos momentos, extrae el fotograma con ffmpeg.

El ejemplo es de otro tema: copia el **estilo** (qué bloques, en qué orden, el ritmo, la jerarquía), nunca el tema. La comprobación exige al menos 2 efectos propios del modelo, además de la firma y de los bloques universales. Los efectos que dan la cara al modelo son la firma y los propios (la tabla «Bloques de este modelo» del SKILL.md los marca): mira en `plan-comentado.md` cómo los usa el ejemplo y busca en lo que dice el usuario dónde cabe cada uno.

## Paso A: el mapa editorial (antes de escribir el plan)

1. Lee todo lo que se dice en `work/palavras.json`, después del corte. Divídelo en **golpes**: cada idea, normalmente una frase o media frase, de 2 a 5 s.

2. Dale a cada golpe una **forma de información**:

| En lo que se dice | Forma | Bloque universal (existe en todos los modelos) |
|---|---|---|
| promesa, pregunta inicial, tema del vídeo | apertura | `abertura` |
| enumeración: «tres errores», «primero… después…», elementos separados por comas | lista | `topicos` |
| secuencia, proceso, camino, etapas en el tiempo, «cómo se hace» | pasos | `passos` |
| número, precio, porcentaje, fecha, cantidad, tiempo | número | `numero` |
| dos lados: A frente a B, antes y después, mal y bien, mito y verdad, quién gana y quién pierde | comparación | `comparacao` |
| algo que sube, baja, crece, la mayoría frente a unos pocos, proporción, evolución | gráfico | `grafico` |
| alerta, riesgo, error, palabra clave fuerte | destaque | `destaque` |
| término técnico explicado («bull market, un ciclo alcista») | definición | `definicao` |
| frase de efecto, opinión fuerte, conclusión | frase | `frase` |
| pregunta hecha a quien mira | pregunta | `pergunta` |
| llamada final: guardar, seguir, comentar, enlace, «toca en más información» | cierre | `cta` |

   **Una frase puede tener más de una forma.** «Hay gente que pierde porque compra por impulso, elige la moneda sin criterio y asume un riesgo que no entiende» es un `destaque` («hay gente que pierde») seguido de `topicos` (los tres motivos). Elige la forma más rica: tres motivos dichos seguidos son `topicos`, no tres `frase`.

3. Elige, para cada golpe, el **bloque de este modelo**. La tabla «Bloques de este modelo» del SKILL.md dice cómo aparece cada forma en este estilo.
   - **Usa la firma del modelo** (el bloque que le da la cara) **al menos una vez**, aunque el tema sea otro. El apartado «La firma en cualquier tema» del SKILL.md muestra cómo.
   - La firma suele servir como metáfora. Ejemplo: un embudo sirve para cualquier «muchos empiezan, pocos llegan».

4. Escribe el mapa en `work/mapa.md`, una línea por golpe: tiempo, trozo dicho, forma, bloque elegido y lo que aparece en pantalla. Ese mapa va, resumido, en tu respuesta final.

## Paso B: del mapa al plan

- **Tiempo.**
  - Cada momento empieza en la primera palabra del golpe y llega hasta el golpe siguiente; los momentos vecinos pueden tocarse.
  - Dentro del momento, cada elemento entra en el `em` de la palabra que lo nombra, sacado de `work/palavras.json`. Nada aparece antes de decirse.
- **Texto de pantalla.**
  - Corto y con las palabras de lo que se dice: título de hasta ~40 caracteres, elementos de 2 a 6 palabras.
  - Una idea grande cada vez. Lo demás, más pequeño (jerarquía).
  - Puedes resumir («compra por impulso» → «Impulso»), pero no cambiar el sentido.
- **Fidelidad.**
  - No te inventes números, nombres, precios, tasas ni hechos.
  - Un gráfico sin números dichos usa la forma cualitativa (`tendencia`) con `ilustrativo: true`.
  - Si un bloque pide un dato que lo dicho no tiene, usa otro bloque. No lo rellenes a ojo.
- **Ritmo.**
  - No repitas el mismo bloque tres veces seguidas.
  - Sigue la gramática de layout del modelo: la persona cambia de sitio en las fronteras de los golpes.
  - Un momento de más de ~4 s necesita elementos que entren dentro de él.
- **Solo persona y subtítulo:** como mucho ~3 s, y solo en los respiros (una transición, un «mira esto»).

## Paso C: comprobar antes de renderizar

```bash
node scripts/conferir.mjs --mapa
```

Corrige hasta que aparezca **APROBADO**. Después ejecuta `node scripts/stills.mjs --momentos` y mira los fotogramas: ¿cabe el texto? ¿Nada tapa la cara? ¿La pantalla cambia de verdad?

## Ejemplo (vídeo sobre cripto en un modelo de otro tema)

Lo que se dice: «El Bitcoin ha superado los 83.000 dólares y ha reavivado la conversación sobre el nuevo bull market, un ciclo alcista. Pero que el mercado suba no significa dinero en el bolsillo para la mayoría. Incluso con subidas, hay gente que pierde porque compra por impulso, elige la moneda sin criterio y asume un riesgo que no entiende. ¿Cómo evaluar los proyectos? He grabado una clase gratuita en la que explico cómo analizo el mercado, los riesgos y la elección de los activos, sin promesas de beneficio. Toca en Más información».

| Golpe | Forma | Lo que entra en pantalla |
|---|---|---|
| «El Bitcoin ha superado los 83.000 dólares» | `numero` | 83.000 US$ contando, rótulo «Bitcoin» |
| «ha reavivado… bull market, un ciclo alcista» | `definicao` | «Bull market» → «ciclo alcista» |
| «que el mercado suba no significa dinero en el bolsillo para la mayoría» | `grafico` (tendencia que sube, ilustrativo) o `comparacao` | línea que sube frente a bolsillo vacío; o «el mercado sube» frente a «tu saldo» |
| «hay gente que pierde» | `destaque` (alerta) | «Hay gente que pierde» |
| «compra por impulso, elige sin criterio, asume un riesgo que no entiende» | `topicos` | Impulso · Sin criterio · Riesgo sin entender, cada uno en su palabra |
| «¿cómo evaluar los proyectos?» | `pergunta` | la pregunta se monta |
| «analizo el mercado, los riesgos y la elección de los activos» | `passos` | Mercado → Riesgos → Activos |
| «sin promesas de beneficio» | `frase` con tachado | «promesas de beneficio» tachado |
| «Toca en Más información» | `cta` (enlace) | el botón |

En un modelo de **embudo**, la firma entra en los tres motivos: «muchos entran con las subidas → compran por impulso → sin criterio → pocos salen ganando», sin números y marcado como ilustrativo.

En un modelo de **cocina** (receta), los mismos tres motivos se convierten en ingredientes que caen en la olla («la receta de las pérdidas»).

## Dónde suele fallar el mapa

- **Todo se ha convertido en `frase`.** Busca listas, números y comparaciones escondidos en lo que se dice: casi todos los vídeos los tienen.
- **La firma se ha quedado fuera porque «el tema es otro».** Es el estilo. Úsala como metáfora.
- **Texto demasiado largo en la tarjeta.** Acórtalo con las palabras de lo que se dice.
- **Elementos que entran todos a la vez.** Cada uno entra en su propia palabra.
