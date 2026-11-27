# Cerebro de Nyland Consulting

*El sistema operativo comercial de Nyland: quiénes somos, cómo captamos clientes y qué herramienta (skill) usamos en cada paso. Cualquier sesión de trabajo empieza aquí.*

**Lema:** Sigue siendo tú · **Filosofía:** El lado humano de la inteligencia artificial · **Método:** El Cambio Nyland (Escucha · Transforma · Crece)

---

## 1. Lo que hay que leer antes de cualquier tarea

| Archivo | Para qué |
|---|---|
| `.agents/product-marketing.md` | Contexto de marca, cliente ideal, objeciones, palabras que usar y evitar. Todas las skills de marketing lo leen solas. |
| `nyland/estrategia/ficha-estrategia-nyland.html` | Estrategia y plan de lanzamiento (también en PDF). |
| `nyland/comercial/precios.md` | Tabla de precios vigente. |
| `prompts/ingeniero-ia-nyland.md` | Cómo trabajamos con cada cliente (diagnóstico → construcción → crecimiento). |

## 2. La idea central (Big Idea)

- **Creencia equivocada del mercado:** «La IA se compra como una herramienta: me instalan un chatbot y listo.»
- **Nueva verdad de Nyland:** «La eficiencia de una empresa empieza en cada persona. Primero se escucha al equipo, luego se cambian los procesos y, por último, entra la tecnología.»
- **Mecanismo propio:** El Cambio Nyland y el efecto miércoles.
- **Tono:** educativo, claro, directo, con ejemplos reales, sin humo ni tecnicismos. Objetivo: que el empresario piense «esto tiene sentido».

## 3. El embudo de Nyland: atraer, convertir, cerrar

| Fase | Objetivo | Contenido y acciones | Skills |
|---|---|---|---|
| **Atraer (TOFU)** | Que nos conozcan | El efecto miércoles, la guía gratuita, carruseles y vídeos cortos | `carrusel-studio`, `social`, `content-strategy`, `ads-ganadores` (guion de guía gratuita), `cofre-viral`, `image`, `video` |
| **Convertir (MOFU)** | Que dejen sus datos y confíen | Guía → secuencia de 4 emails en Brevo; anuncios de formulario; casos | `lead-magnets`, `emails`, `ads-ganadores` (estructura de anuncios ganadores), `ads`, `ad-creative`, `cro`, `copywriting` |
| **Cerrar (BOFU)** | Que agenden y contraten | Llamada de 15 minutos, propuesta, precio de lanzamiento | `ads-ganadores` (anuncio de cierre), `sales-enablement`, `pricing`, `cold-email`, `revops` |
| **Medir** | Saber qué funciona | Semáforos de cada fase | `analytics`, `ab-testing` + hoja `seguimiento-prospeccion-y-semaforos.xlsx` |

## 4. Rutinas

**Cada día (captación activa)**
1. 50-70 contactos 1 a 1 por LinkedIn e Instagram con `nyland/comercial/mensajes-linkedin-instagram.md`.
2. Seguimientos del día 3 y del día 7.
3. Responder en menos de 5 minutos a quien conteste y agendar la llamada.
4. Apuntar todo en la hoja de seguimiento.

**Cada semana**
1. 2 publicaciones en LinkedIn y 1 carrusel (`carrusel-studio`).
2. Revisar los semáforos: contactos → respuestas → citas → asistencia → cierre.
3. Revisar Brevo: nuevos contactos de la guía, aperturas y clics.
4. Anuncios (cuando estén activos): revisar CTR, coste por contacto y asistencia; cambiar el anuncio si está en rojo.

**Antes de cada llamada con un cliente**
1. `investigacion-mercado-agencias-ia` (apartado «investigar un negocio concreto antes de una llamada»).
2. Guion: `nyland/comercial/guion-llamada-15-minutos.md`.
3. Después: `nyland/comercial/propuesta-tipo.md`.

## 5. Catálogo de skills por área

**Estrategia e investigación:** `investigacion-mercado-agencias-ia` (nichos, competencia e informe en PDF), `product-marketing`, `customer-research`, `competitor-profiling`, `competitors`, `marketing-ideas`, `marketing-psychology`, `pricing`.

**Contenido y redes:** `carrusel-studio` (carruseles con la marca), `social`, `content-strategy`, `copywriting`, `copy-editing`, `image`, `video`, `cofre-viral` (edición de vídeos hablados al estilo Reels: gancho, subtítulos karaoke, zooms).

**Anuncios:** `ads-ganadores` (guiones TOFU, MOFU y BOFU para vender servicios de IA, con proyecto de vídeo en Remotion), `ads`, `ad-creative`, `ab-testing`.

**Captación y conversión:** `lead-magnets`, `free-tools`, `emails`, `cold-email`, `cro`, `popups`, `signup`, `referrals`, `co-marketing`, `community-marketing`.

**Web y buscadores:** `seo-audit`, `ai-seo`, `schema`, `site-architecture`, `programmatic-seo`, `directory-submissions`.

**Ventas y operación comercial:** `sales-enablement`, `revops`, `churn-prevention`, `analytics`, `launch`.

**Servicio al cliente (lo que Nyland construye):** `prompt-builder-agentes-n8n` (diseña los prompts de los agentes de n8n que instalamos en las clínicas mediante entrevista guiada).

**Apps (por ahora no aplica):** `aso`, `paywalls`, `onboarding`.

## 6. Sistema en marcha

| Pieza | Dónde |
|---|---|
| Web | https://nylandconsulting.es (Hostinger) |
| Formularios | `/api/enviar.php`: diagnóstico → contacto@; guía → lista de Brevo «Introducción Nyland Consulting» |
| Emails automáticos | Brevo · automatización «Nyland · Secuencia guía 5 preguntas» (activa) |
| Correo | contacto@nylandconsulting.es (Hostinger) |
| Material comercial | `nyland/comercial/` y `nyland/marketing/` |

## 7. Líneas rojas

- Nada de emails comerciales masivos a quien no ha dado su consentimiento (LSSI) ni listas compradas en Brevo.
- Nada de cifras, testimonios ni resultados inventados. Los datos de mercado se citan como referencia, no como promesa.
- El agente propone, una persona decide: todo se revisa antes de publicarse o instalarse en un cliente.
- Las skills con claves externas (HeyGen, ElevenLabs, Pexels) solo se usan con las claves del propio Nyland, guardadas de forma segura y nunca en el chat.
