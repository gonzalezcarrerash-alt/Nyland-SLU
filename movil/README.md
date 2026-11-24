# App Nyland para el teléfono

App genérica de Nyland AI Solutions para enseñar al cliente, desde el teléfono, cómo funciona
Nyland y cómo se aplicaría a su negocio. Funciona sin conexión.

- **Inicio, Servicios, Método y Escala:** filosofía HUMAN + AI, los 10 módulos, el método
  IMAGINA · CONSTRUYE · CRECE y la escalabilidad de 1 a N sedes.
- **Demo** (botón central): pones el nombre y el sector del cliente y la app le enseña en 7 pasos
  cómo quedaría en su empresa: hoy y con Nyland, mapa del cerebro de IA, un chat que el cliente
  puede probar, el panel que vería su equipo, la calculadora de ahorro, el plan por etapas y la
  ficha para el diagnóstico. Sectores incluidos: salud, inmobiliaria, hostelería, comercio,
  servicios profesionales, industria, educación y uno genérico para cualquier otro negocio.
  Para añadir o ajustar un sector, edita la lista `SECTORS` en `app.html`.

## Archivos

| Ruta | Qué es |
|---|---|
| `app.html` | Código fuente de la app (es lo único que se edita) |
| `build.py` | Genera `www/index.html` a partir de `app.html` |
| `www/` | La app instalable: `index.html`, `manifest.webmanifest`, `sw.js` (modo sin conexión) e `icons/` |

Después de cambiar `app.html`: ejecuta `python3 movil/build.py` y sube la versión de `CACHE` en `www/sw.js`.

## 1. Instalarla en el teléfono (PWA)

Para instalarla, la app tiene que estar publicada en una dirección `https://`. Con GitHub Pages (gratis):

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Lleva estos cambios a la rama `main` (por ejemplo, fusionando el pull request).
3. El flujo `.github/workflows/pages.yml` la publica en `https://<usuario>.github.io/<repositorio>/`.
   También puedes lanzarlo a mano en **Actions → Publicar app Nyland → Run workflow**.
4. En el teléfono:
   - **iPhone:** abre la dirección en **Safari** → botón Compartir → **Añadir a pantalla de inicio**.
   - **Android:** abre la dirección en Chrome → menú ⋮ → **Instalar aplicación**.

Queda con el icono de Nyland, a pantalla completa y funcionando sin conexión.

## 2. Publicarla en la App Store

Requisitos: un Mac con Xcode, una cuenta de Apple Developer (99 €/año) y pasar la revisión de Apple.
El camino habitual es envolver `www/` con Capacitor:

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Nyland" com.tudominio.nyland --web-dir movil/www
npx cap add ios
npx cap open ios        # abre Xcode: firma, Archive y sube a App Store Connect
```

Aviso: Apple suele rechazar apps que son solo información de una empresa (norma 4.2,
«funcionalidad mínima»). Para aprobarla conviene añadir utilidad real, por ejemplo un área
de cliente con su panel de KPIs o el asistente con IA.
