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
