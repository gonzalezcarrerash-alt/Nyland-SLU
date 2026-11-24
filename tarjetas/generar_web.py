#!/usr/bin/env python3
"""Tarjeta digital interactiva con foto para un comercial.

Uso:  python3 tarjetas/generar_web.py comercial.json foto.jpg carpeta_de_salida
Genera una carpeta lista para publicar (GitHub Pages, tu web, Netlify…):
  index.html     la tarjeta interactiva (foto, llamar, WhatsApp, guardar, «¿en qué te ayudo?», tarjeta que gira)
  contacto.vcf   contacto con foto, para el botón «Guardar»
  qr-tarjeta.png QR para imprimir: abre la tarjeta (si hay "url") o guarda el contacto
Requisitos: pip install segno pillow
"""
import json, sys, pathlib, base64, io
import segno
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from generar import vcard

def main():
    if len(sys.argv) < 4: sys.exit(__doc__)
    c = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = pathlib.Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
    img = Image.open(sys.argv[2]).convert("RGB")
    if img.width > 720: img = img.resize((720, int(720 * img.height / img.width)), Image.LANCZOS)
    buf = io.BytesIO(); img.save(buf, "JPEG", quality=84); foto = buf.getvalue()
    thumb = img.copy(); thumb.thumbnail((240, 240)); tb = io.BytesIO(); thumb.save(tb, "JPEG", quality=80)

    c.setdefault("telefonos", [{"numero": c.get("telefono", ""), "tipo": "CELL"}])
    vc = vcard(c)
    vc_foto = vc.replace("END:VCARD", "PHOTO;ENCODING=b;TYPE=JPEG:" + base64.b64encode(tb.getvalue()).decode() + "\r\nEND:VCARD")
    def fold(line):  # vCard: líneas de 75 caracteres como máximo
        return "\r\n ".join(line[i:i+74] for i in range(0, len(line), 74)) if len(line) > 75 else line
    vc_foto = "\r\n".join(fold(l) for l in vc_foto.split("\r\n"))
    (out / "contacto.vcf").write_text(vc_foto, encoding="utf-8", newline="")

    destino = c.get("url") or vc
    qr = segno.make(destino, error="m")
    qr.save(out / "qr-tarjeta.png", scale=20, border=4, dark=c.get("color", "#000000"))
    sb = io.BytesIO(); qr.save(sb, kind="svg", border=1, dark="#14243A", xmldecl=False, svgns=True, nl=False, omitsize=True)

    cfg = dict(c)
    cfg["foto"] = "data:image/jpeg;base64," + base64.b64encode(foto).decode()
    cfg["qr_svg"] = sb.getvalue().decode()
    cfg["qr_texto"] = "Abre mi tarjeta en tu móvil." if c.get("url") else "Se guarda en tu agenda en un toque."
    cfg["vcf"] = "contacto.vcf"
    tpl = (pathlib.Path(__file__).parent / "web" / "plantilla.html").read_text(encoding="utf-8")
    data = json.dumps(cfg, ensure_ascii=False).replace("<", "\\u003c")
    (out / "index.html").write_text(tpl.replace("/*CONFIG*/", data), encoding="utf-8")
    print(f"Listo en {out}: index.html, contacto.vcf, qr-tarjeta.png")

if __name__ == "__main__":
    main()
