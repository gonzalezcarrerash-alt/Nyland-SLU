type Tone = "base" | "alt" | "accent" | "inverse";
type Col = { t: string; items: string[] };
export type SlideDef = { tone?: Tone } & (
  | { kind: "hero"; kicker?: string; title: string; sub?: string }
  | { kind: "text"; kicker?: string; title: string; body?: string }
  | { kind: "item"; n: number; label?: string; title: string; body: string }
  | { kind: "bento"; title: string; cards: { t: string; d: string }[] }
  | { kind: "compare"; title?: string; left: Col; right: Col }
  | { kind: "cta"; title: string; body?: string; keyword?: string; button?: string }
);
export type CarDef = { stage?: "TOFU" | "MOFU" | "BOFU"; theme: string; cat: "agentes" | "contenido" | "publicidad" | "software"; title: string; type: string; caption: string; slides: SlideDef[] };

import BOFU from "./gen-bofu.json" with { type: "json" };
const BASE: Record<string, CarDef> = {
  "car-agentes-contrarian": {
    stage: "MOFU", theme: "serif", cat: "agentes", type: "Contrarian", title: "No te faltan clientes, te sobra demora",
    caption: "No es falta de clientes. Es falta de respuesta.\n\nCada consulta que contestás tarde es una venta que ya habías ganado.\n\n👉 Pedí tu diagnóstico gratuito: te medimos cuánto tarda tu negocio en responder.",
    slides: [
      { kind: "hero", kicker: "Opinión · Agentes IA", title: "No te faltan clientes.\nTe *sobra demora*.", sub: "Por qué tu negocio pierde ventas que ya había ganado." },
      { kind: "text", tone: "alt", title: "Te dijeron que necesitás *más leads*.", body: "Más anuncios, más presupuesto, más seguidores." },
      { kind: "text", tone: "accent", title: "El problema es lo que pasa *después*.", body: "El lead ya escribió. Nadie le respondió a tiempo." },
      { kind: "item", n: 1, label: "Razón", title: "El cliente no espera.", body: "Pregunta en tres negocios a la vez. Gana el que contesta primero." },
      { kind: "item", n: 2, label: "Razón", title: "La recepción no da abasto.", body: "Llamadas, WhatsApp, Instagram y agenda, todo al mismo tiempo." },
      { kind: "text", tone: "inverse", title: "La verdad: responder rápido *vende*.", body: "Responder en menos de 5 minutos puede aumentar hasta un 400 % la conversión (Lead Response Management Study)." },
      { kind: "compare", title: "La diferencia", left: { t: "Sin agente", items: ["Respuesta en horas", "Leads que se enfrían", "Equipo saturado"] }, right: { t: "Con agente IA", items: ["Respuesta en segundos", "Leads calificados", "Agenda llena"] } },
      { kind: "cta", title: "¿Cuánto tarda tu negocio en *responder*?", body: "Te lo medimos gratis y te mostramos un agente funcionando.", button: "Pedí tu diagnóstico" },
    ],
  },
  "car-agentes-lista": {
    stage: "TOFU", theme: "brutal", cat: "agentes", type: "Lista", title: "5 tareas que un agente hace mejor que tu recepción",
    caption: "Guardalo para cuando tu recepción esté a tope.\n\nUn agente de IA no viene a reemplazar a tu equipo: viene a sacarle lo repetitivo.\n\n👉 Comentá AGENTE y te mandamos la guía para crear el tuyo.",
    slides: [
      { kind: "hero", kicker: "Lista · Guardala", title: "5 tareas que un agente de IA hace *mejor* que tu recepción" },
      { kind: "text", tone: "alt", title: "No viene a reemplazar a tu equipo.\nViene a sacarle *lo repetitivo*." },
      { kind: "item", n: 1, label: "Tarea", title: "Responder a las 3 AM", body: "Sin horario, sin feriados, sin «te respondo mañana»." },
      { kind: "item", n: 2, label: "Tarea", title: "Confirmar cada cita", body: "Un mensaje el día antes. Si no puede venir, reprograma." },
      { kind: "item", n: 3, label: "Tarea", title: "Filtrar curiosos", body: "Pregunta presupuesto y urgencia antes de pasarte el lead." },
      { kind: "item", n: 4, label: "Tarea", title: "Hacer seguimiento", body: "Le escribe al que dijo «lo pienso». Una, dos, tres veces." },
      { kind: "item", n: 5, label: "Tarea", title: "Cargar el CRM", body: "Cada conversación queda registrada, sin copiar y pegar." },
      { kind: "cta", tone: "accent", title: "¿Cuál de las 5 te *falta*?", body: "Te mandamos la guía para crear tu agente.", keyword: "AGENTE" },
    ],
  },
  "car-contenido-metodo": {
    stage: "TOFU", theme: "editorial", cat: "contenido", type: "Método", title: "Un mes de contenido en 4 pasos",
    caption: "La IA no te da ideas: te da velocidad.\n\nEste es el sistema que usamos para producir un mes de contenido en una tarde.\n\n👉 Comentá MÉTODO y te mandamos la plantilla.",
    slides: [
      { kind: "hero", kicker: "Método · Contenido con IA", title: "Un mes de contenido en *4 pasos*.", sub: "El sistema que usamos con nuestros clientes." },
      { kind: "text", tone: "alt", title: "La IA no te da ideas.\nTe da *velocidad*.", body: "Las ideas salen de tu negocio. La IA las multiplica." },
      { kind: "item", n: 1, label: "Paso", title: "Juntá tu materia prima", body: "Preguntas de clientes, audios, notas de reuniones." },
      { kind: "item", n: 2, label: "Paso", title: "Pedí 30 ideas con tu tono", body: "Dale ejemplos de cómo hablás. Corregí las primeras cinco." },
      { kind: "item", n: 3, label: "Paso", title: "Elegí el formato", body: "Reels para alcance, carruseles para guardar, stories para vender." },
      { kind: "item", n: 4, label: "Paso", title: "Programá el mes", body: "Una tarde para producir. Treinta días publicando." },
      { kind: "bento", tone: "inverse", title: "El resultado", cards: [{ t: "30", d: "piezas al mes" }, { t: "1", d: "tarde de trabajo" }, { t: "3", d: "formatos" }, { t: "Tu voz", d: "en cada pieza" }] },
      { kind: "cta", title: "¿Querés el *sistema* completo?", body: "Te mandamos la plantilla por privado.", keyword: "MÉTODO" },
    ],
  },
  "car-contenido-errores": {
    stage: "TOFU", theme: "warmth", cat: "contenido", type: "Educativo", title: "3 errores al crear contenido con IA",
    caption: "La IA escribe rápido. Pero si no la guiás, no suena a vos.\n\nTres errores que vemos todas las semanas en terapeutas y coaches.\n\n👉 Comentá VOZ y te mandamos el prompt que usamos.",
    slides: [
      { kind: "hero", kicker: "Para terapeutas y coaches", title: "3 errores al crear contenido con *IA*", sub: "(y cómo evitarlos sin perder tu voz)" },
      { kind: "text", tone: "alt", title: "La IA escribe rápido.\nPero si no la guiás,\n*no suena a vos*." },
      { kind: "item", n: 1, label: "Error", title: "Pedirle todo sin contexto", body: "Dale tu historia, tu público y tres textos tuyos de ejemplo." },
      { kind: "item", n: 2, label: "Error", title: "Publicar sin editar", body: "Leelo en voz alta. Si no lo dirías así, cambialo." },
      { kind: "item", n: 3, label: "Error", title: "Copiar tendencias ajenas", body: "Usá la IA para contar tus casos, no los de otros." },
      { kind: "text", tone: "inverse", title: "Tu contenido tiene que sonar a *una persona*, no a una máquina." },
      { kind: "cta", tone: "accent", title: "¿Querés el prompt que *usamos*?", body: "Te lo enviamos por privado.", keyword: "VOZ" },
    ],
  },
  "car-publicidad-lista": {
    stage: "TOFU", theme: "y2k", cat: "publicidad", type: "Lista", title: "7 creativos para testear esta semana",
    caption: "Ganar en Meta Ads hoy es volumen y velocidad.\n\n7 formatos que podés producir con IA esta misma semana.\n\n👉 Pedí tu auditoría gratuita de anuncios.",
    slides: [
      { kind: "hero", kicker: "publicidad con ia", title: "7 creativos para testear *esta semana*" },
      { kind: "text", tone: "alt", title: "Ganar en Meta Ads hoy es\n*volumen + velocidad*." },
      { kind: "bento", title: "Formatos 1 a 4", cards: [{ t: "01", d: "UGC con avatar IA" }, { t: "02", d: "Antes y después" }, { t: "03", d: "Captura de chat real" }, { t: "04", d: "Hook con dato" }] },
      { kind: "bento", tone: "alt", title: "Formatos 5 a 7", cards: [{ t: "05", d: "Carrusel de objeciones" }, { t: "06", d: "Testimonio en texto" }, { t: "07", d: "Demo de producto" }, { t: "+10", d: "hooks por formato" }] },
      { kind: "item", n: 1, label: "Paso", title: "Variá con IA", body: "Mismo ángulo, diez hooks distintos." },
      { kind: "item", n: 2, label: "Paso", title: "Testeá con poco", body: "Que los datos elijan, no tu gusto." },
      { kind: "item", n: 3, label: "Paso", title: "Escalá al ganador", body: "Y volvé a variar lo que funcionó." },
      { kind: "cta", tone: "accent", title: "auditamos tus *ads* gratis", button: "Quiero la auditoría" },
    ],
  },
  "car-publicidad-contrarian": {
    stage: "MOFU", theme: "clean", cat: "publicidad", type: "Contrarian", title: "Más presupuesto no arregla un mal creativo",
    caption: "Subir el presupuesto no salva un anuncio que no engancha.\n\nLo que escala es el volumen de creativos buenos, y la IA lo hace posible.\n\n👉 Mandanos tu cuenta y te decimos si tu anuncio engancha.",
    slides: [
      { kind: "hero", kicker: "Publicidad con IA", title: "Más presupuesto no arregla un *mal creativo*." },
      { kind: "text", tone: "alt", title: "Te dijeron: «subí el presupuesto y va a *escalar*»." },
      { kind: "text", tone: "accent", title: "Si el anuncio no engancha, solo pagás *más caro* lo mismo." },
      { kind: "compare", title: "Qué escalar", left: { t: "Presupuesto", items: ["Mismo creativo", "Más frecuencia", "Sube el costo por lead"] }, right: { t: "Creativos", items: ["10 variantes por semana", "Audiencia fresca", "Ganadores reales"] } },
      { kind: "text", tone: "inverse", title: "La IA te deja producir los creativos que *antes no podías pagar*." },
      { kind: "bento", title: "Lo que hacemos", cards: [{ t: "Guiones", d: "con IA, por ángulo" }, { t: "Vídeos", d: "UGC y motion" }, { t: "Tests", d: "cada semana" }, { t: "Informe", d: "qué escalar" }] },
      { kind: "cta", title: "¿Tu anuncio *engancha*?", body: "Mandanos tu cuenta y te lo decimos en 48 horas.", button: "Revisión gratis" },
    ],
  },
  "car-software-anuncio": {
    stage: "BOFU", theme: "corporate", cat: "software", type: "Anuncio", title: "Tu app interna en 7 días",
    caption: "¿Tu negocio vive en Excel y WhatsApp?\n\nConstruimos tu app interna con IA, a medida de tu proceso, en 7 días.\n\n👉 Agendá una llamada de 20 minutos y te decimos si se puede automatizar.",
    slides: [
      { kind: "hero", kicker: "Nuevo servicio", title: "Tu app interna en *7 días*.", sub: "Construida con IA, a medida de tu proceso." },
      { kind: "text", tone: "alt", title: "Para negocios que viven en *Excel y WhatsApp*.", body: "Pedidos, turnos, stock o clientes repartidos en mil lugares." },
      { kind: "bento", title: "Qué incluye", cards: [{ t: "App", d: "web y móvil, con tu marca" }, { t: "Panel", d: "datos en tiempo real" }, { t: "Roles", d: "cada uno ve lo suyo" }, { t: "Agente IA", d: "que responde por vos" }] },
      { kind: "compare", title: "Antes y después", left: { t: "Hoy", items: ["Datos en 5 planillas", "Errores al copiar", "Sin visibilidad"] }, right: { t: "Con tu app", items: ["Todo en un lugar", "Procesos automáticos", "Panel de control"] } },
      { kind: "text", tone: "inverse", title: "Sin programadores.\nSin meses de desarrollo.\n*Con IA*." },
      { kind: "text", tone: "accent", title: "Pocos proyectos por mes.", body: "Así cumplimos los 7 días." },
      { kind: "cta", title: "Contanos tu *proceso*.", body: "En 20 minutos te decimos si se puede automatizar.", button: "Agendar llamada" },
    ],
  },
  "car-software-procesos": {
    stage: "TOFU", theme: "playful", cat: "software", type: "Educativo", title: "4 procesos que podés convertir en app",
    caption: "Si lo hacés todas las semanas a mano, puede ser una app.\n\n4 procesos que convertimos en apps con IA para negocios chicos.\n\n👉 Comentá APP y te mostramos ejemplos.",
    slides: [
      { kind: "hero", kicker: "Apps con IA", title: "4 procesos que podés convertir en *app* este mes" },
      { kind: "text", tone: "alt", title: "Si lo hacés todas las semanas a mano, *puede ser una app*." },
      { kind: "item", n: 1, label: "Proceso", title: "Reservas y turnos", body: "Tus clientes eligen hora. Vos recibís el aviso." },
      { kind: "item", n: 2, label: "Proceso", title: "Pedidos", body: "Del WhatsApp a un panel ordenado, con estados." },
      { kind: "item", n: 3, label: "Proceso", title: "Presupuestos", body: "Completás cuatro datos y sale el PDF con tu marca." },
      { kind: "item", n: 4, label: "Proceso", title: "Seguimiento", body: "Quién vino, cuándo vuelve y a quién escribirle hoy." },
      { kind: "cta", tone: "inverse", title: "¿Cuál querés *primero*?", body: "Te mostramos ejemplos reales.", keyword: "APP" },
    ],
  },
};

export const CARS: Record<string, CarDef> = { ...BASE, ...Object.fromEntries(((BOFU as unknown as { cars: (CarDef & { id: string })[] }).cars).map((x) => [x.id, x])) };
