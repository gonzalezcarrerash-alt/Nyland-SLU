import { loadFont } from "@remotion/google-fonts/Montserrat";

// Una sola familia, en tres pesos: la Montserrat ancha y gruesa de los subtítulos de retención.
// Nada condensado ni con contorno: el contraste sale de las tarjas (fondos de color detrás del texto).
export const fonte = loadFont("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // fondo de la mitad de arriba cuando la persona baja ("imagen arriba, persona abajo")
  fundo: "#121016",
  // placas oscuras detrás del texto blanco (subtítulo, gancho, número)
  placa: "rgba(18,16,22,0.9)",
  placaSolida: "#1C1922",
  // el texto
  tinta: "#FFFFFF",
  tintaEscura: "#141218",
  suave: "rgba(255,255,255,0.7)",
  apagado: "rgba(255,255,255,0.42)",
  // la tarja: la palabra dicha, el trozo que importa, la barra de progreso
  tarja: "#FF2E63",
  tarjaBorda: "#B8123F",
  // alerta (problema, peligro, "no lo hagas"): cinta amarilla con texto oscuro
  alerta: "#FFC21A",
  alertaBorda: "#B88300",
  // el lado correcto / lo que funciona
  certo: "#2BD97C",
  // tarjetas claras (elementos de lista, opciones)
  papel: "#FFFFFF",
  linha: "rgba(255,255,255,0.18)",
};

// sombra dura y corta debajo de las tarjas y las tarjetas (aire de pegatina), nunca brillo
export const sombraDura = (c: string, y = 7) => `0 ${y}px 0 ${c}`;
export const sombraCartao = "0 18px 40px rgba(0,0,0,0.38)";
