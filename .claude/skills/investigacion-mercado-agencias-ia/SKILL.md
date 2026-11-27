---
name: investigacion-mercado-agencias-ia
description: Investigación de mercado y estudio de la competencia para agencias de IA que venden contenido con IA, agentes de IA y automatizaciones, captación de clientes con IA (Meta Ads) o software y apps con IA, con un informe visual en PDF. Úsala siempre que alguien quiera estudiar un nicho, analizar o comparar competidores, saber qué cobran otros, cuántos clientes posibles hay, decidir qué vender, a quién o a qué precio, encontrar huecos u oportunidades, revisar anuncios o reseñas de la competencia, o investigar a un negocio antes de una llamada de venta, aunque no diga «investigación de mercado». También para preguntas sueltas como «¿quién vende agentes de WhatsApp a clínicas en Valencia?» o «¿qué cobran por llevar Meta Ads a academias?».
---

# Investigación de mercado para agencias de IA

Responde una pregunta de negocio con datos que se pueden comprobar y termina en una decisión: **qué vender, a quién, a qué precio y con qué mensaje**. El resultado se entrega en un informe visual en PDF, fácil de leer y de enseñar a un cliente.

## 1. Tres datos para empezar

**Servicio, nicho y zona.** Por ejemplo: agentes de IA, clínicas dentales, Valencia. Si falta alguno, pregúntalo en una sola pregunta. Con eso, escribe la pregunta que vas a responder: «¿Qué agente de IA y a qué precio vendo a clínicas dentales en Valencia?». Todo lo que investigues tiene que servir para responderla.

Si el usuario solo quiere un dato rápido («¿quién vende esto aquí?»), respóndelo en la conversación con sus fuentes y ofrece el informe completo. Si quiere investigar **un negocio concreto** antes de una llamada, ve al apartado 4.

## 2. Los cinco pasos

1. **Lee la guía del servicio y la del nicho.** En `references/servicios.md` (solo la sección del servicio) y `references/nichos.md` (solo la ficha del nicho, si está). Las fichas de nicho son ideas a comprobar, no conclusiones.
2. **Quién compite.** Busca unos 10 competidores y sepáralos en: **directos** (venden lo mismo al mismo nicho), **generalistas** (venden de todo) y **sustitutos** (lo que el cliente usa en lugar de contratar: hacerlo él mismo, un programa, un empleado). Si la pregunta es si el nicho merece la pena, calcula también cuánto podría facturar la agencia (`references/donde-buscar.md`). Si hay investigación profunda disponible (como Research en Claude), úsala aquí.
3. **La comparativa.** Elige los 5 directos más fuertes y mira su web: qué ofrecen, precio, garantía, pruebas que enseñan y su mensaje principal. Solo lo que esté publicado; lo que no, «no publicado». Después mira **sus anuncios** (qué ganchos usan y en qué etapa: TOFU, MOFU o BOFU) y **sus reseñas** (de qué se quejan y qué valoran sus clientes). Si no puedes ver anuncios o reseñas, pide capturas al usuario. Puntúa a cada uno de 1 a 5 en siete criterios (abajo) y añade la oferta del usuario.
4. **Comprueba.** Cada cifra con su fuente y su fecha. Lo que no tenga fuente se marca como «estimación» o se quita.
5. **Las oportunidades.** Tres huecos: cosas que los clientes piden y nadie da bien. Cada uno con su prueba (la reseña, el anuncio o el dato), qué venderías para cubrirlo con un rango de precio sacado de lo investigado, y un anuncio TOFU que regale algo a cambio de un comentario: «Comenta [PALABRA] y te envío…». Termina con qué harías primero y un plan de dos semanas para validarlo.

**Criterios de la comparativa (con su peso):** oferta clara (20), precio y valor (15), garantía (10), pruebas que enseña (15), mensaje diferente (15), calidad de sus anuncios (10) y lo que dicen sus reseñas (15). Ajusta los pesos si en el nicho importa más otra cosa y dilo.

## 3. Entrega el informe visual

Guarda los resultados en un JSON con el formato que explica el inicio de `scripts/informe.py` y ejecuta:

```
python scripts/informe.py datos.json informe.pdf
```

El script dibuja el informe con portada y respuesta en tres frases, mercado en números, tabla de competidores, gráfico de la comparativa, reseñas y anuncios, mapa de posicionamiento, oportunidades y fuentes. Las secciones sin datos no aparecen. Si no puede crear el PDF, deja un HTML que se guarda como PDF desde el navegador; dile al usuario cuál de los dos ha salido. Entrega el archivo y resume en la conversación la respuesta en tres frases.

Si el usuario prefiere la respuesta en la conversación, usa el mismo orden: respuesta, competidores, comparativa, reseñas y anuncios, oportunidades y fuentes.

## 4. Investigar un negocio concreto antes de una llamada

Revisa su web, su ficha de Google y reseñas, sus redes y si tiene anuncios activos, y compáralo con dos o tres competidores cercanos. Entrega: qué le pasa en dos frases, tres fugas con su prueba (una reseña, una captura o un enlace), qué servicio le encaja con rango de precio, tres preguntas para la llamada y una frase de apertura basada en algo concreto que hayas visto. Usa solo información pública.

## Reglas

- **Fuente y fecha en cada dato.** Sin fuente, «estimación».
- **No inventes** precios, cifras, testimonios ni nombres de clientes. Si falta algo, dilo y explica cómo conseguirlo.
- **Datos del mercado local**, en su moneda.
- **Separa lo que dicen las fuentes de lo que recomiendas.**
- **Métodos limpios:** fuentes públicas y preguntas honestas; nunca hacerse pasar por otra persona.
- **Normativa como aviso**, no como asesoramiento: cuando el servicio toque datos personales, mensajes a contactos, contenido hecho con IA o anuncios de sectores regulados, indica qué revisar con un profesional (lo típico de cada servicio está en `references/servicios.md`).

`references/prompts.md` tiene los prompts del método listos para copiar, por si el usuario quiere hacerlo por su cuenta o enseñarlo.
