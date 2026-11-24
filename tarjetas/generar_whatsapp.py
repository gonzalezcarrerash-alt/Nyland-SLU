#!/usr/bin/env python3
"""Tarjeta «Escríbeme por WhatsApp»: el QR abre un chat con el comercial y el mensaje ya escrito.

Uso:  python3 tarjetas/generar_whatsapp.py comercial.json carpeta_de_salida [foto.jpg]
JSON: {"nombre","apellidos","cargo","empresa","whatsapp","mensaje","color","acento"}
Genera:
  enlace.txt                 el enlace wa.me (para bio de Instagram, firma de email, web…)
  qr-whatsapp.png            el QR solo, en alta resolución
  whatsapp-pantalla.png      tarjeta para enseñar en el móvil (1080 × 1920)
  whatsapp-impresion.png     tarjeta para imprimir de 55 × 85 mm a 300 ppp
Requisitos: pip install segno pillow  ·  Node con Playwright (para las tarjetas)
"""
import json, sys, pathlib, io, base64, html, subprocess, urllib.parse
import segno
from PIL import Image, ImageOps, ImageDraw

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    c = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    num = "".join(ch for ch in c["whatsapp"] if ch.isdigit())
    link = f"https://wa.me/{num}" + (f"?text={urllib.parse.quote(c['mensaje'])}" if c.get("mensaje") else "")
    (out / "enlace.txt").write_text(link + "\n", encoding="utf-8")
    color = c.get("color", "#1C3A2E"); acento = c.get("acento", "#25D366")
    qr = segno.make(link, error="q")
    qr.save(out / "qr-whatsapp.png", scale=20, border=4, dark=color)
    sb = io.BytesIO(); qr.save(sb, kind="svg", border=1, dark=color, xmldecl=False, svgns=True, nl=False, omitsize=True)
    svg = sb.getvalue().decode()

    foto = ""
    if len(sys.argv) > 3:
        im = ImageOps.exif_transpose(Image.open(sys.argv[3])).convert("RGB")
        s = min(im.size); im = im.crop(((im.width - s) // 2, 0, (im.width + s) // 2, s)).resize((600, 600), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=88); foto = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

    full = html.escape((c["nombre"] + " " + c.get("apellidos", "")).strip())
    e = lambda k: html.escape(c.get(k, ""))
    wa_icon = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/></svg>'

    def page(w, h, k):  # k = escala
        img = f'<img class="ph" src="{foto}">' if foto else ""
        return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
*{{box-sizing:border-box;margin:0}}
body{{width:{w}px;height:{h}px;font-family:Montserrat,Arial,sans-serif;color:{color};background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:{26*k}px;text-align:center;padding:{40*k}px}}
.ph{{width:{230*k}px;height:{230*k}px;border-radius:50%;object-fit:cover;object-position:50% 20%;border:{6*k}px solid {acento}}}
.name{{font-size:{38*k}px;font-weight:800;line-height:1.1}}
.role{{font-size:{19*k}px;text-transform:uppercase;letter-spacing:.06em;margin-top:{6*k}px}}
.cta{{display:inline-flex;align-items:center;gap:{12*k}px;background:{acento};color:#fff;font-weight:700;font-size:{24*k}px;padding:{14*k}px {26*k}px;border-radius:999px}}
.qr{{width:{340*k}px;height:{340*k}px}}.qr svg{{width:100%;height:100%;display:block}}
.hint{{font-size:{17*k}px;color:#555}}
.org{{font-size:{24*k}px;font-weight:800}}
</style></head><body>{img}
<div><div class="name">{full}</div><div class="role">{e('cargo')}</div></div>
<div class="cta">{wa_icon} Escríbeme por WhatsApp</div>
<div class="qr">{svg}</div>
<div class="hint">Escanea con la cámara y envía el mensaje</div>
<div class="org">{e('empresa')}</div></body></html>"""

    jobs = []
    for name, w, h, k in (("whatsapp-pantalla", 1080, 1920, 2.0), ("whatsapp-impresion", 650, 1004, 1.0)):
        p = out / f"{name}.html"; p.write_text(page(w, h, k), encoding="utf-8")
        jobs.append((str(p.resolve()), str((out / f"{name}.png").resolve()), w, h))
    js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();for(const [f,o,w,h] of %s){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+f);await p.waitForTimeout(800);await p.screenshot({path:o});await p.close();}await b.close();})();" % json.dumps(jobs)
    try:
        subprocess.run(["node", "-e", js], check=True)
        for f, *_ in jobs: pathlib.Path(f).unlink()
    except Exception as ex:
        print("No se pudieron generar las tarjetas (necesita Node + Playwright):", ex)
    print(f"Listo en {out}\nEnlace: {link}")

if __name__ == "__main__":
    main()
