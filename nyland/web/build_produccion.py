#!/usr/bin/env python3
"""Genera la versión de producción de la web de Nyland en dist/ a partir de index.html.
Uso: python3 build_produccion.py  (requiere red para descargar las fuentes la primera vez)"""
import re, os, shutil, subprocess, hashlib, json
DOM = 'https://nylandconsulting.es'
EMAIL = 'contacto@nylandconsulting.es'
src = open('index.html', encoding='utf-8').read()
out = 'dist'
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out + '/assets/fonts', exist_ok=True)
shutil.copytree('assets/fotos', out + '/assets/fotos', ignore=shutil.ignore_patterns('raw*'))
shutil.copy('guia-5-preguntas.pdf', out + '/guia-5-preguntas.pdf')
shutil.copytree('api', out + '/api')
for f in ['logo-nyland-consulting-web.png', 'mascota-nyland-web.jpg', 'og-nyland.jpg']:
    shutil.copy('assets/' + f, out + '/assets/' + f)

# 1. Fuentes alojadas en el propio servidor (sin Google Fonts: privacidad y RGPD)
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
gcss = subprocess.run(['curl', '-sS', '-A', UA, 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap'], capture_output=True, text=True, check=True).stdout
faces = []
for subset, blk in re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face \{.*?\})', gcss, re.S):
    if subset not in ('latin', 'latin-ext'): continue
    url = re.search(r'url\((https://[^)]+)\)', blk).group(1)
    name = hashlib.sha1(url.encode()).hexdigest()[:12] + '.woff2'
    subprocess.run(['curl', '-sS', '-o', f'{out}/assets/fonts/{name}', url], check=True)
    faces.append(blk.replace(url, f'fonts/{name}'))
open(f'{out}/assets/fonts.css', 'w').write('\n'.join(faces))

# 2. Separar CSS y JS (permite una política de seguridad de contenido estricta)
css = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
js = re.search(r'<script>\n(.*?)</script>', src, re.S).group(1)
src = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="assets/fonts.css">\n<link rel="stylesheet" href="assets/styles.css">', src, count=1, flags=re.S)
src = re.sub(r'<script>\n.*?</script>', '<script src="assets/app.js" defer></script>', src, count=1, flags=re.S)
src = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', src)
src = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>\n?', '', src)

# 3. Foco del ratón mucho más suave
css = re.sub(r'\.halo-cursor\{[^}]*\}', '.halo-cursor{position:fixed;left:0;top:0;width:360px;height:360px;margin:-180px 0 0 -180px;border-radius:50%;background:radial-gradient(circle,rgba(214,178,108,.045),transparent 70%);pointer-events:none;z-index:1;transform:translate(var(--mx,-999px),var(--my,-999px));transition:transform .35s ease-out}', css, count=1)
# Enfoque visible con teclado en todos los elementos interactivos
css += '\na:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--oro);outline-offset:3px}\n.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\nfooter nav a{color:var(--marfil);display:inline-block;padding:10px 0}\n.check input{width:22px!important;height:22px!important}\n.check a{display:inline-block;padding:6px 0}\n'
css = css.replace('.sr>input{width:100%}', '.sr>input{width:100%}\n.gu-form label .lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}')

# 4. Dominio, email y textos de maqueta
src = src.replace('https://tudominio.es', DOM)
src = src.replace('<label class="sr">Tu email<input', '<label class="sr"><span class="lbl">Tu email</span><input')
src = re.sub(r'<nav aria-label="Contacto y legal">.*?</nav>', f'<nav aria-label="Contacto y legal">\n        <a href="mailto:{EMAIL}">{EMAIL}</a>\n        <a href="privacidad.html">Política de privacidad</a><a href="aviso-legal.html">Aviso legal</a>\n      </nav>', src, count=1, flags=re.S)
src = src.replace(' · Maqueta de prueba: contacto de ejemplo y textos legales pendientes.', '')
src = src.replace('<p class="demo">Maqueta: los datos no se envían ni se guardan.</p>', '<p class="demo">Al pulsar, se abrirá tu correo con la solicitud lista para enviar a ' + EMAIL + '.</p>')
src = src.replace('Acepto la política de privacidad y recibir la guía por email.', 'Acepto la <a href="privacidad.html">política de privacidad</a>.')
src = src.replace('He leído y acepto la política de privacidad.', 'He leído y acepto la <a href="privacidad.html">política de privacidad</a>.')
# Favicon
src = src.replace('<meta name="theme-color"', '<link rel="icon" type="image/png" href="assets/logo-nyland-consulting-web.png">\n<meta name="theme-color"', 1)
# Imágenes por debajo del primer pantallazo: carga diferida y decodificación asíncrona
def lazy(m):
    tag = m.group(0)
    if 'loading=' in tag or 'class="sello"' in tag: return tag
    return tag.replace('<img ', '<img loading="lazy" decoding="async" ', 1)
head, body = src.split('<main id="inicio">', 1)
body = re.sub(r'<img [^>]*>', lazy, body)
src = head + '<main id="inicio">' + body

# 5. Formularios: los envía /api/enviar.php (email a contacto@ y lista de Brevo)
assert '/api/enviar.php' in js, 'formularios sin conectar'
open(f'{out}/assets/styles.css', 'w').write(css)
open(f'{out}/assets/app.js', 'w').write(js)
open(f'{out}/index.html', 'w').write(src)

# 6. Páginas legales (borrador pendiente de datos), 404, robots y sitemap
def pagina(titulo, cuerpo):
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titulo} · Nyland Consulting</title><meta name="robots" content="noindex"><link rel="icon" type="image/png" href="assets/logo-nyland-consulting-web.png">
<link rel="stylesheet" href="assets/fonts.css"><link rel="stylesheet" href="assets/legal.css"></head><body><main>
<a class="volver" href="/">← Volver a Nyland Consulting</a><h1>{titulo}</h1>{cuerpo}</main></body></html>'''
open(f'{out}/assets/legal.css', 'w').write("body{margin:0;background:#0f241b;color:#F2F5F0;font:17px/1.7 Inter,system-ui,sans-serif}main{max-width:760px;margin:0 auto;padding:80px 20px}h1,h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500}h1{font-size:52px;margin:24px 0}h2{font-size:30px;margin-top:40px}a{color:#D6B26C}.volver{text-decoration:none;font-size:14px;letter-spacing:.06em}.aviso{border:1px solid rgba(214,178,108,.5);border-radius:14px;padding:16px 20px;color:#ecd08f}")
PEND = '<p class="aviso">Texto en revisión. Si tienes cualquier duda, escríbenos a <a href="mailto:%s">%s</a>.</p>' % (EMAIL, EMAIL)
open(f'{out}/privacidad.html', 'w').write(pagina('Política de privacidad', PEND + f'''
<h2>Responsable</h2><p>Nyland Consulting S.L. · Email: <a href="mailto:{EMAIL}">{EMAIL}</a>. [Pendiente: NIF y domicilio social.]</p>
<h2>Qué datos tratamos</h2><p>Esta web no usa cookies de seguimiento ni herramientas de analítica, y no guarda en su servidor los datos de los formularios. El formulario de diagnóstico abre tu programa de correo para que nos envíes tú mismo la solicitud. Tratamos los datos que nos escribas por email (nombre, empresa, contacto y lo que nos cuentes) y, si pides la guía, los del apartado siguiente.</p>
<h2>Guía gratuita y emails</h2><p>Si pides nuestra guía, tu nombre y tu email se guardan en Brevo (Sendinblue SAS, proveedor de email marketing con servidores en la Unión Europea), que actúa como encargado del tratamiento. Los usamos para enviarte la guía y algunos emails relacionados con ella. Cada email incluye un enlace para darte de baja cuando quieras.</p>
<h2>Para qué</h2><p>Para responder a tu solicitud de diagnóstico o enviarte la guía que nos pidas. No los usamos para otros fines ni los cedemos a terceros, salvo obligación legal.</p>
<h2>Base legal</h2><p>Tu consentimiento al escribirnos y, si llegamos a trabajar juntos, la relación precontractual o contractual.</p>
<h2>Cuánto tiempo</h2><p>El necesario para atender tu solicitud y, en su caso, los plazos que marque la ley.</p>
<h2>Tus derechos</h2><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a <a href="mailto:{EMAIL}">{EMAIL}</a>. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>'''))
open(f'{out}/aviso-legal.html', 'w').write(pagina('Aviso legal', PEND + f'''
<h2>Titular</h2><p>Nyland Consulting S.L. [Pendiente: NIF, domicilio social y datos de inscripción en el Registro Mercantil.] · Email: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<h2>Objeto</h2><p>Esta web presenta los servicios de consultoría de procesos e inteligencia artificial de Nyland Consulting.</p>
<h2>Propiedad intelectual</h2><p>Los textos, la marca, el logotipo y el diseño de esta web pertenecen a Nyland Consulting S.L. No se permite su reproducción sin autorización.</p>
<h2>Responsabilidad</h2><p>La información de esta web es orientativa. Los ejemplos que se muestran son ilustrativos y no representan resultados garantizados.</p>'''))
open(f'{out}/404.html', 'w').write(pagina('Página no encontrada', '<p>Lo que buscas no está aquí. Pero tu empresa sí sabe lo que le pasa.</p><p><a href="/">Volver al inicio</a></p>'))
open(f'{out}/robots.txt', 'w').write(f'User-agent: *\nAllow: /\nSitemap: {DOM}/sitemap.xml\n')
open(f'{out}/sitemap.xml', 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{DOM}/</loc></url></urlset>\n')

# 7. Seguridad del servidor (Apache / LiteSpeed en Hostinger)
open(f'{out}/.htaccess', 'w').write(r'''# Nyland Consulting · seguridad y rendimiento
Options -Indexes
ErrorDocument 404 /404.html
RewriteEngine On
# Forzar HTTPS y dominio sin www
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} ^www\. [NC]
RewriteRule ^ https://nylandconsulting.es%{REQUEST_URI} [L,R=301]
# Bloquear archivos ocultos y de sistema
RewriteRule (^|/)\.(?!well-known/) - [F]
<FilesMatch "\.(py|md|zip|bak|sql|sh|log|ini|env)$">
  Require all denied
</FilesMatch>
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests"
  Header unset X-Powered-By
  <FilesMatch "\.(css|js|woff2|jpg|png)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml text/plain
</IfModule>
''')
print('dist listo:', sum(len(fs) for _, _, fs in os.walk(out)), 'archivos')
