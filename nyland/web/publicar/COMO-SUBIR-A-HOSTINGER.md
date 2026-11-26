# Cómo subir la web de Nyland a Hostinger (a mano)

1. Entra en **hPanel** de Hostinger → **Sitios web** → tu dominio → **Administrador de archivos**.
2. Abre la carpeta **`public_html`**. Si hay un `index.php` o `default.php` de bienvenida, bórralo.
3. Pulsa **Subir** y sube `nyland-web-hostinger.zip`.
4. Haz clic derecho sobre el ZIP → **Extraer** → en `public_html` (no en una subcarpeta).
5. Comprueba que en `public_html` están `index.html` y la carpeta `assets`.
6. En hPanel → **Seguridad** → **SSL**, activa el certificado gratuito si no lo está.
7. Abre `https://tudominio` en el navegador.

**Antes de hacerla pública de verdad:** la web sigue siendo una maqueta. Faltan el contacto real, la política de privacidad, el aviso legal y conectar los formularios (ahora no envían nada).
