import type { SceneDef } from "../scenes";
import TOFU from "./gen-tofu.json" with { type: "json" };
import MOFU from "./gen-mofu.json" with { type: "json" };
import BOFU from "./gen-bofu.json" with { type: "json" };

// Cada escena lleva su locución (`vo`), en tuteo de España para la voz de Miriam.
export type VoScene = SceneDef & { vo: string };
export type AdDef = {
  theme: string;
  tag: string;
  cat: "agentes" | "contenido" | "publicidad" | "software";
  title: string;
  angle: string;
  stage?: "TOFU" | "MOFU" | "BOFU";
  nicho?: string;
  scenes: VoScene[];
};

const BASE: Record<string, AdDef> = {
  "agentes-chat": {
    stage: "MOFU", theme: "corporate", tag: "Agentes IA", cat: "agentes", title: "Demo de chat a las 23:47", angle: "Demo en vivo",
    scenes: [
      { type: "statement", dur: 62, kicker: "23:47 · Clínica estética", text: "Un paciente pregunta\nel *precio*.", vo: "Son las once y cuarenta y siete de la noche. Un paciente pregunta el precio." },
      { type: "chat", dur: 160, header: "Clínica Aura", msgs: [
        { from: "c", text: "¡Hola! ¿Cuánto cuesta la limpieza facial?" },
        { from: "a", text: "¡Hola! Cuesta 60 €. Tengo hueco el jueves a las 17:00 o el viernes a las 11:00. ¿Cuál te viene mejor?" },
        { from: "c", text: "Jueves 👌" },
        { from: "a", text: "Listo ✅ Reservado el jueves a las 17:00. Te mando un recordatorio el día antes." },
      ], vo: "Tu agente de inteligencia artificial le responde al momento, le ofrece dos horarios… y deja la cita reservada. Sin que nadie de tu equipo toque el móvil." },
      { type: "statement", dur: 60, text: "Respondió en *segundos*.\nA las 23:47.", vo: "Respondió en segundos. Casi a medianoche." },
      { type: "list", dur: 95, title: "Tu agente de IA", items: ["Responde 24/7", "Explica tratamientos", "Agenda en tu calendario", "Confirma y reprograma"], vo: "Responde las veinticuatro horas, explica tus tratamientos, agenda en tu calendario y confirma o reprograma las citas." },
      { type: "cta", dur: 80, headline: "Pruébalo en tu *clínica*.", button: "Agenda tu demo", sub: "Demo gratuita de 30 minutos", vo: "Pruébalo en tu clínica. Agenda una demo gratuita de treinta minutos." },
    ],
  },
  "agentes-contrarian": {
    stage: "MOFU", theme: "brutal", tag: "Agentes IA", cat: "agentes", title: "No necesitas más leads", angle: "Contrarian",
    scenes: [
      { type: "statement", dur: 55, text: "No necesitas\n*más leads*.", vo: "No necesitas más leads." },
      { type: "statement", dur: 62, text: "Necesitas responder\na los que *ya tienes*.", vo: "Necesitas responder a los que ya tienes." },
      { type: "counter", dur: 80, value: 400, suffix: "%", label: "más conversión si respondes en menos de 5 minutos.", source: "Lead Response Management Study", vo: "Responder en menos de cinco minutos puede aumentar hasta un cuatrocientos por ciento tu conversión." },
      { type: "beforeAfter", dur: 115, left: { title: "Sin agente", items: ["Respondes a las 3 horas", "Leads fríos", "Recepción saturada"] }, right: { title: "Con agente IA", items: ["Respondes en segundos", "Califica y agenda", "Trabaja 24/7"] }, vo: "Sin agente, respondes tres horas después y el lead ya se ha enfriado. Con un agente de inteligencia artificial, respondes en segundos, calificas y agendas, las veinticuatro horas." },
      { type: "cta", dur: 75, headline: "Tu competencia\n*ya responde*.", button: "Reserva tu demo", vo: "Tu competencia ya responde. Reserva tu demo." },
    ],
  },
  "agentes-voz": {
    stage: "TOFU", theme: "clean", tag: "Agentes de voz", cat: "agentes", title: "El agente que llama en 1 minuto", angle: "Demo de llamada",
    scenes: [
      { type: "statement", dur: 72, kicker: "Inmobiliarias", text: "Entra un lead.\nTu agente lo llama\nen *1 minuto*.", vo: "Entra un lead. Tu agente lo llama en un minuto." },
      { type: "call", dur: 190, name: "Javier · lead del portal", lines: [
        { from: "a", text: "Hola, Javier, te llamo por el piso de Chamberí. ¿Buscas para vivir o para invertir?" },
        { from: "c", text: "Para vivir. Hasta 350 mil." },
        { from: "a", text: "Perfecto. ¿Te va bien verlo el sábado a las 11?" },
      ], result: "Visita agendada · Sáb 11:00", vo: "Le pregunta qué busca y cuál es su presupuesto. Y si encaja, le agenda la visita. Todo en una sola llamada." },
      { type: "list", dur: 95, title: "Mientras estás\nen *otra visita*:", items: ["Llama a cada lead", "Califica zona y presupuesto", "Agenda en tu calendario"], vo: "Mientras tú estás en otra visita, tu agente llama a cada lead, califica zona y presupuesto, y lo agenda en tu calendario." },
      { type: "cta", dur: 80, headline: "Tu agente de voz\n*inmobiliario*.", keyword: "VOZ", sub: "Te enviamos la guía gratis por privado", vo: "Comenta VOZ y te enviamos gratis la guía para crear tu agente de voz inmobiliario." },
    ],
  },
  "contenido-calendario": {
    stage: "TOFU", theme: "playful", tag: "Contenido con IA", cat: "contenido", title: "Un mes de contenido en una tarde", angle: "Proceso en pantalla",
    scenes: [
      { type: "statement", dur: 62, kicker: "Contenido con IA", text: "Un mes de contenido\nen *una tarde*.", vo: "Un mes de contenido… en una sola tarde." },
      { type: "prompt", dur: 125, prompt: "Crea 30 ideas de contenido para una clínica estética: reels, carruseles y posts, con mi tono.", outputs: ["Reel · 3 mitos del bótox", "Carrusel · Rutina post-peeling", "Post · Antes de tu primera cita", "Reel · Un día en la clínica"], vo: "Le das a la inteligencia artificial tu negocio y tu tono, y te devuelve treinta ideas: reels, carruseles y posts." },
      { type: "calendar", dur: 105, title: "Noviembre", label: "30 piezas listas para publicar", vo: "Y en minutos tienes el mes entero organizado en tu calendario." },
      { type: "list", dur: 90, title: "Incluye", items: ["Guiones de reels", "Carruseles diseñados", "Textos con tu voz", "Calendario de publicación"], vo: "Guiones de reels, carruseles diseñados, textos con tu voz y un calendario de publicación." },
      { type: "cta", dur: 80, headline: "Deja de pensar\n*qué publicar*.", keyword: "CONTENIDO", vo: "Deja de pensar qué publicar. Comenta CONTENIDO." },
    ],
  },
  "contenido-clon": {
    stage: "MOFU", theme: "editorial", tag: "Clon con IA", cat: "contenido", title: "Graba una vez, publica todo el mes", angle: "Antes y después",
    scenes: [
      { type: "statement", dur: 66, text: "Graba *una vez*.\nPublica todo el mes.", vo: "Graba una vez. Publica todo el mes." },
      { type: "beforeAfter", dur: 118, left: { title: "Antes", items: ["4 horas grabando por semana", "Repetir tomas", "Editar de noche"] }, right: { title: "Con tu clon IA", items: ["Una sesión de 20 minutos", "Tu cara y tu voz, con permiso", "Vídeos nuevos cada semana"] }, vo: "Antes: cuatro horas a la semana grabando, repitiendo tomas y editando de noche. Con tu clon de inteligencia artificial: una sesión de veinte minutos y vídeos nuevos cada semana." },
      { type: "statement", dur: 62, text: "Tu clon presenta.\n*Tú* cierras ventas.", vo: "Tu clon presenta. Tú cierras ventas." },
      { type: "list", dur: 88, title: "Lo usas para", items: ["Reels con tu clon", "Anuncios en 3 idiomas", "Respuestas en vídeo"], vo: "Úsalo para reels, para anuncios en tres idiomas y para responder a tus clientes en vídeo." },
      { type: "cta", dur: 85, headline: "Tu marca,\n*en piloto automático*.", button: "Quiero mi clon", sub: "Con consentimiento y etiqueta «hecho con IA»", vo: "Tu marca, en piloto automático. Siempre con tu consentimiento." },
    ],
  },
  "contenido-carruseles": {
    stage: "TOFU", theme: "warmth", tag: "Contenido con IA", cat: "contenido", title: "Tu domingo no es para diseñar", angle: "Empatía",
    scenes: [
      { type: "statement", dur: 72, kicker: "Para terapeutas y coaches", text: "Tu domingo no es\npara *diseñar posts*.", vo: "Tu domingo no es para diseñar posts." },
      { type: "prompt", dur: 125, prompt: "Convierte mi sesión de hoy sobre ansiedad en un carrusel de 8 slides, cálido y cercano.", outputs: ["Slide 1 · Lo que nadie te dice de la ansiedad", "Slide 4 · Respirar 4-7-8", "Slide 6 · Cuándo pedir ayuda", "Slide 8 · Guárdalo para después"], vo: "Conviertes tu sesión de hoy en un carrusel de ocho slides, cálido y cercano, en cuestión de minutos." },
      { type: "statement", dur: 72, text: "Con *tu voz*.\nCon tu estilo.\nSin perder el domingo.", vo: "Con tu voz. Con tu estilo. Y sin perder el domingo." },
      { type: "cta", dur: 80, headline: "Contenido que\n*suena a ti*.", keyword: "GUÍA", vo: "Contenido que suena a ti. Comenta GUÍA." },
    ],
  },
  "publicidad-grid": {
    stage: "MOFU", theme: "y2k", tag: "Publicidad con IA", cat: "publicidad", title: "50 creativos en 1 hora", angle: "Volumen de creativos",
    scenes: [
      { type: "statement", dur: 54, text: "50 creativos.\n*1 hora*.", vo: "Cincuenta creativos. En una hora." },
      { type: "adgrid", dur: 135, title: "generando variantes…", vo: "La inteligencia artificial genera las variantes, las pruebas todas… y te quedas con la que vende." },
      { type: "list", dur: 88, title: "el método", items: ["Prueba 10 por semana", "Apaga los que no venden", "Escala el ganador"], vo: "El método: prueba diez por semana, apaga los que no venden y escala el ganador." },
      { type: "cta", dur: 78, headline: "publicidad\ncon *ia*.", button: "Pide tu auditoría gratis", vo: "Publicidad con inteligencia artificial. Pide tu auditoría gratuita." },
    ],
  },
  "publicidad-contrarian": {
    stage: "MOFU", theme: "serif", tag: "Publicidad con IA", cat: "publicidad", title: "Tu anuncio no falla", angle: "Opinión editorial",
    scenes: [
      { type: "statement", dur: 84, kicker: "Opinión", text: "Tu anuncio *no falla*.\nFalla lo que pasa\ndespués del clic.", vo: "Tu anuncio no falla. Falla lo que pasa después del clic." },
      { type: "funnel", dur: 125, title: "Dónde se pierde\nla venta", steps: ["Ve el anuncio", "Hace clic", "Escribe por WhatsApp", "Espera respuesta…", "Compra"], vo: "La persona ve el anuncio, hace clic, escribe por WhatsApp… y espera. Ahí es donde se enfría el lead." },
      { type: "statement", dur: 72, text: "Con IA, el anuncio\ny la respuesta\n*trabajan juntos*.", vo: "Con inteligencia artificial, el anuncio y la respuesta trabajan juntos." },
      { type: "list", dur: 90, title: "Nuestro sistema", items: ["Creativos generados con IA", "Agente que responde cada lead", "Seguimiento hasta la venta"], vo: "Creativos generados con inteligencia artificial, un agente que responde a cada lead y seguimiento hasta la venta." },
      { type: "cta", dur: 78, headline: "Pide tu\n*diagnóstico*.", button: "Diagnóstico gratuito", vo: "Pide tu diagnóstico gratuito." },
    ],
  },
  "publicidad-ugc": {
    stage: "TOFU", theme: "brutalYellow", tag: "Publicidad con IA", cat: "publicidad", title: "UGC sin actores", angle: "Producto en pantalla",
    scenes: [
      { type: "statement", dur: 52, text: "UGC sin\n*actores*.", vo: "Contenido UGC… sin actores." },
      { type: "phoneApp", dur: 155, screens: [
        { title: "Guion", rows: ["Hook: «Probé esto 7 días…»", "Beneficio", "Prueba", "CTA"] },
        { title: "Avatar IA", rows: ["Estilo: natural", "Voz en español", "Fondo: cocina"] },
        { title: "Exportar", rows: ["9:16 · 15 s", "4:5 · 30 s", "3 hooks distintos"] },
      ], vo: "Escribes el guion, eliges un avatar con inteligencia artificial y su voz en español… y exportas en todos los formatos, con tres hooks distintos." },
      { type: "statement", dur: 58, text: "10 versiones.\n*Una tarde*.", vo: "Diez versiones. En una tarde." },
      { type: "cta", dur: 78, headline: "Prueba más.\n*Gasta menos*.", keyword: "UGC", vo: "Prueba más. Gasta menos. Comenta UGC." },
    ],
  },
  "software-excel": {
    stage: "MOFU", theme: "cleanDark", tag: "Software con IA", cat: "software", title: "De un Excel caótico a tu propia app", angle: "Antes y después",
    scenes: [
      { type: "statement", dur: 72, kicker: "Software con IA", text: "De un Excel caótico\na *tu propia app*.", vo: "De un Excel caótico… a tu propia app." },
      { type: "beforeAfter", dur: 118, left: { title: "Hoy", items: ["17 pestañas de Excel", "Datos duplicados", "Nadie sabe qué versión es"] }, right: { title: "En 7 días", items: ["Una app con tu proceso", "Datos en tiempo real", "Acceso por roles"] }, vo: "Hoy: diecisiete pestañas, datos duplicados y nadie sabe cuál es la versión buena. En siete días: una app con tu proceso y datos en tiempo real." },
      { type: "dashboard", dur: 115, title: "Panel de pedidos", kpis: [{ l: "Pedidos hoy", v: 48 }, { l: "Pendientes", v: 7 }, { l: "Entregados", v: 41 }], note: "Datos de ejemplo", vo: "Todos tus pedidos en un solo panel, actualizado al momento." },
      { type: "cta", dur: 78, headline: "Tu proceso,\n*hecho app*.", button: "Cuéntanos tu proceso", vo: "Tu proceso, convertido en app. Cuéntanos cómo trabajas." },
    ],
  },
  "software-crm": {
    stage: "MOFU", theme: "corporateLight", tag: "Software con IA", cat: "software", title: "Tu CRM se actualiza solo", angle: "Demo de producto",
    scenes: [
      { type: "statement", dur: 62, text: "Tu CRM\n*se actualiza solo*.", vo: "Tu CRM se actualiza solo." },
      { type: "pipeline", dur: 145, title: "Pipeline en vivo", cols: ["Nuevo", "Calificado", "Demo", "Cliente"], vo: "Cada lead entra, se califica y avanza de etapa, sin que nadie lo cargue a mano." },
      { type: "list", dur: 88, title: "La IA se encarga de", items: ["Cargar cada lead", "Moverlo de etapa", "Avisarte a quién llamar hoy"], vo: "La inteligencia artificial carga cada lead, lo mueve de etapa y te avisa a quién llamar hoy." },
      { type: "cta", dur: 78, headline: "Menos carga manual.\n*Más ventas*.", button: "Ver demo", vo: "Menos carga manual. Más ventas. Mira la demo." },
    ],
  },
  "software-apps": {
    stage: "TOFU", theme: "playfulDark", tag: "Apps con IA", cat: "software", title: "Tu idea de app, construida con IA", angle: "Producto en pantalla",
    scenes: [
      { type: "statement", dur: 56, text: "¿Tienes una idea\nde *app*?", vo: "¿Tienes una idea de app?" },
      { type: "phoneApp", dur: 155, screens: [
        { title: "Reservas", rows: ["Corte · 10:00", "Color · 12:30", "Barba · 16:00"] },
        { title: "Clientes", rows: ["Ana · 4 visitas", "Luis · 2 visitas", "Marta · nueva"] },
        { title: "Avisos", rows: ["Recordatorio a Ana ✓", "Recordatorio a Luis ✓", "Programado · Marta"] },
      ], vo: "Reservas, clientes y recordatorios, en una app hecha a tu medida." },
      { type: "statement", dur: 66, text: "La construimos\n*sin programar*,\ncon IA.", vo: "La construimos sin programar, con inteligencia artificial." },
      { type: "cta", dur: 78, headline: "De idea a app\nen *semanas*.", keyword: "APP", vo: "De idea a app en semanas. Comenta APP." },
    ],
  },
};

const GEN = [...(TOFU as unknown as (AdDef & { id: string })[]), ...(MOFU as unknown as (AdDef & { id: string })[]), ...((BOFU as unknown as { ads: (AdDef & { id: string })[] }).ads)];
export const ADS: Record<string, AdDef> = { ...BASE, ...Object.fromEntries(GEN.map((a) => [a.id, a])) };
