# Tarjetas de visita digitales

Un QR que lleva dentro el contacto (vCard). Al escanearlo con la cámara del iPhone o del
Android aparece «Añadir contacto», sin web, servidor ni conexión.

## Uso

1. Copia `ejemplo-nyland.json` y rellena los datos del comercial (nombre, cargo, empresa,
   teléfonos, email, web y colores).
2. Ejecuta:

   ```bash
   pip install segno
   python3 tarjetas/generar.py mi-comercial.json salida/
   ```

3. En `salida/` tienes:
   - `tarjeta-pantalla.png`: para llevarla en el móvil y que la escaneen.
   - `tarjeta-impresion.png`: la cara del QR de una tarjeta de 55 × 85 mm a 300 ppp.
   - `qr.png`: el QR solo, en alta resolución, para cualquier diseño, cartel o escaparate.
   - `contacto.vcf`: el contacto para enviarlo por WhatsApp o email.

No subas al repositorio los JSON ni las tarjetas con datos personales de terceros.

## Tarjeta digital interactiva con foto

Una página para el móvil, personalizada para cada comercial:

- Su foto a toda pantalla, con nombre, cargo y empresa, y un indicador de «Disponible ahora»
  según su horario.
- Botones de llamar, WhatsApp, email y guardar el contacto (con foto).
- Un saludo que se escribe solo y la sección «¿En qué te ayudo?», donde cada botón abre WhatsApp
  con un mensaje distinto (por ejemplo: vender, comprar, alquilar, valorar).
- «Sobre mí» y una tarjeta que gira al tocarla y muestra el QR para que la escaneen.
- Botón de compartir la tarjeta.

```bash
pip install segno pillow
python3 tarjetas/generar_web.py tarjetas/web/ejemplo-comercial.json foto.jpg salida/
```

Sube la carpeta `salida/` a una web (GitHub Pages, Netlify o tu dominio), pon esa dirección en
`"url"` del JSON y vuelve a generarla: el QR (`qr-tarjeta.png`) abrirá la tarjeta en el móvil de
quien lo escanee. Sin `"url"`, el QR guarda directamente el contacto.
