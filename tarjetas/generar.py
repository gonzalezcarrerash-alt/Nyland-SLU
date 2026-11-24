#!/usr/bin/env python3
"""Tarjeta de visita digital: un QR que al escanearlo guarda el contacto en el teléfono.

Uso:  python3 tarjetas/generar.py tarjetas/ejemplo.json carpeta_de_salida
Genera:
  contacto.vcf            contacto para enviar por WhatsApp o email
  qr.png                  QR (vCard) para imprimir o poner en cualquier diseño
  tarjeta-pantalla.png    tarjeta para enseñar en el móvil y que la escaneen
  tarjeta-impresion.png   cara del QR de una tarjeta de 55 x 85 mm a 300 ppp
Requisitos: pip install segno  ·  Node con Playwright (para las imágenes de tarjeta)
"""
import json, sys, pathlib, subprocess, html, io
import segno

def vcard(c):
    def esc(s): return str(s).replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")
    nombre, apellidos = c["nombre"], c.get("apellidos", "")
    lines = ["BEGIN:VCARD", "VERSION:3.0",
             f"N:{esc(apellidos)};{esc(nombre)};;;",
             f"FN:{esc((nombre + ' ' + apellidos).strip())}"]
    if c.get("empresa"): lines.append(f"ORG:{esc(c['empresa'])}")
    if c.get("cargo"): lines.append(f"TITLE:{esc(c['cargo'])}")
    for t in c.get("telefonos", []): lines.append(f"TEL;TYPE={t.get('tipo','CELL')}:{t['numero'].replace(' ','')}")
    if c.get("email"): lines.append(f"EMAIL;TYPE=WORK:{c['email']}")
    if c.get("web"): lines.append(f"URL:{c['web']}")
    if c.get("direccion"): lines.append(f"ADR;TYPE=WORK:;;{esc(c['direccion'])};;;;")
    if c.get("nota"): lines.append(f"NOTE:{esc(c['nota'])}")
    lines.append("END:VCARD")
    return "\r\n".join(lines) + "\r\n"

def card_html(c, qr_svg, w, h, modo):
    color = c.get("color", "#1C3A2E"); acento = c.get("acento", "#D6B26C"); fondo = c.get("fondo", "#FFFFFF")
    e = lambda k: html.escape(str(c.get(k, "")))
    full = html.escape((c["nombre"] + " " + c.get("apellidos", "")).strip())
    tels = "".join(f"<div>{html.escape(t.get('etiqueta','Móvil'))} {html.escape(t['numero'])}</div>" for t in c.get("telefonos", []))
    big = modo == "pantalla"
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
*{{box-sizing:border-box;margin:0}}
body{{width:{w}px;height:{h}px;background:{fondo};font-family:Montserrat,Arial,sans-serif;color:{color};
display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:{48 if big else 22}px;padding:{80 if big else 40}px}}
.top{{font-size:{30 if big else 16}px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:{acento}}}
.qr{{width:{720 if big else 380}px;height:{720 if big else 380}px;padding:{28 if big else 0}px;background:#fff;border-radius:{36 if big else 0}px;{'box-shadow:0 10px 40px rgba(0,0,0,.12)' if big else ''}}}
.qr svg{{width:100%;height:100%}}
.hint{{font-size:{34 if big else 17}px;font-weight:600}}
.name{{font-size:{64 if big else 34}px;font-weight:700;line-height:1.1}}
.role{{font-size:{38 if big else 22}px;text-transform:uppercase;line-height:1.2}}
.data{{font-size:{34 if big else 20}px;line-height:1.5}}
.org{{font-size:{46 if big else 26}px;font-weight:700;margin-top:{10 if big else 4}px}}
</style></head><body>
{'<div class="top">Escanea con la cámara</div>' if big else ''}
<div class="qr">{qr_svg}</div>
{'<div class="hint">Guarda mi contacto en un toque</div>' if big else ''}
<div><div class="name">{full}</div><div class="role">{e('cargo')}</div></div>
<div class="data">{tels}<div>{e('email')}</div><div>{e('web').replace('https://','')}</div></div>
<div class="org">{e('empresa')}</div>
</body></html>"""

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    c = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    vc = vcard(c)
    (out / "contacto.vcf").write_text(vc, encoding="utf-8")
    qr = segno.make(vc, error="m", micro=False)
    qr.save(out / "qr.png", scale=20, border=4, dark=c.get("color_qr", "#000000"))
    buf = io.BytesIO(); qr.save(buf, kind="svg", border=2, dark=c.get("color_qr", "#000000"), xmldecl=False, svgns=True, nl=False, omitsize=True)
    svg = buf.getvalue().decode()
    jobs = []
    for modo, w, h in (("pantalla", 1080, 1920), ("impresion", 650, 1004)):
        p = out / f"tarjeta-{modo}.html"; p.write_text(card_html(c, svg, w, h, modo), encoding="utf-8")
        jobs.append((str(p.resolve()), str((out / f"tarjeta-{modo}.png").resolve()), w, h))
    js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();for(const [f,o,w,h] of %s){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+f);await p.waitForTimeout(800);await p.screenshot({path:o});await p.close();}await b.close();})();" % json.dumps(jobs)
    try:
        subprocess.run(["node", "-e", js], check=True)
        for f, *_ in jobs: pathlib.Path(f).unlink()
    except Exception as ex:
        print("No se pudieron generar las imágenes de tarjeta (necesita Node + Playwright):", ex)
    print(f"Listo en {out}: contacto.vcf, qr.png, tarjeta-pantalla.png, tarjeta-impresion.png")

if __name__ == "__main__":
    main()
