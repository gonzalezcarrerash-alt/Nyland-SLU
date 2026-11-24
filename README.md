# Nyland AI Solutions · Ingeniero de IA

Prompt maestro y plantillas para diseñar, construir y desplegar "cerebros de IA"
a medida para empresas de cualquier sector. Filosofía **HUMAN + AI**.
Método **IMAGINA · CONSTRUYE · CRECE**.

## Contenido

| Ruta | Qué es |
|---|---|
| `prompts/ingeniero-ia-nyland.md` | El prompt maestro (copiar y pegar como instrucciones del sistema) |
| `plantillas/ficha-cliente.md` | Ficha de cliente para la primera reunión |
| `ejemplos/peticiones.md` | Peticiones de prueba (diagnóstico, demo, tarjetas, construcción…) |
| `clientes/` | Una carpeta por cliente con su ficha y entregables |
| `app/index.html` | **Nyland Studio**: la app interna (ficha, diagnóstico, demo, propuesta y seguimiento con IA) |
| `demo/` | Escaparate de Nyland y prototipo interactivo para inmobiliarias |
| `CLAUDE.md` | Hace que Claude Code trabaje como el ingeniero de Nyland en este repo |

## Cómo usarlo

1. Crea un Proyecto de Claude por cliente y pega `prompts/ingeniero-ia-nyland.md`
   en "Instrucciones del proyecto" (o en el campo `system` de la API).
2. Sustituye las variables entre `{{ }}` con la ficha de cliente, o pégala como
   primer mensaje.
3. Sube al proyecto los documentos del cliente: organigrama, procesos, catálogo,
   manuales, FAQ y herramientas que usa.
4. Empieza siempre por la petición de diagnóstico (ejemplo 1) antes de pedir que
   construya nada.
5. Revisa y aprueba cada entregable antes de instalarlo en el cliente: el agente
   propone, una persona decide.

**Con Claude Code:** abre este repositorio, crea `clientes/<empresa>/ficha.md` a
partir de la plantilla y pide, por ejemplo: *"Haz el diagnóstico de
clientes/<empresa>"*.
