"""Crea un informe visual (PDF, o HTML si no se puede generar el PDF) a partir de un JSON.

Uso:  python informe.py datos.json informe.pdf

Todo es opcional salvo "titulo": las secciones sin datos no aparecen. Ejemplo de JSON:
{
  "titulo": "Agentes de IA para clínicas dentales en Valencia",
  "agencia": "Nombre de tu agencia", "fecha": "noviembre de 2026",
  "pregunta": "¿Qué agente de IA y a qué precio vendo a clínicas dentales en Valencia?",
  "resumen": ["Frase 1: qué has encontrado.", "Frase 2: qué recomiendas.", "Frase 3: por qué."],
  "mercado": {"negocios": "420", "fuente": "INE, DIRCE 2025",
              "escenarios": [{"nombre": "Prudente", "clientes": "4", "facturacion": "19.000 €/año"},
                             {"nombre": "Base", "clientes": "10", "facturacion": "48.000 €/año"}]},
  "competidores": [{"nombre": "Agencia A", "tipo": "Directo", "que_vende": "Agente de WhatsApp", "precio": "Desde 300 €/mes"}],
  "puntuacion": {"criterios": ["Oferta clara", "Precio", "Garantía", "Prueba social", "Mensaje", "Anuncios", "Reseñas"],
                 "pesos": [20, 15, 10, 15, 15, 10, 15],
                 "notas": {"Agencia A": [4, 3, 2, 4, 3, 3, 4], "Tu oferta": [5, 4, 5, 2, 5, 3, 3]}},
  "resenas": [{"tema": "Tardan en contestar", "tipo": "Queja", "veces": 12, "ejemplo": "Nadie coge el teléfono"}],
  "anuncios": [{"competidor": "Agencia A", "gancho": "¿Cuántas llamadas pierdes?", "etapa": "TOFU"}],
  "posicionamiento": {"eje_x": "Precio", "eje_y": "Especialización en el nicho",
                      "puntos": [{"nombre": "Agencia A", "x": 7, "y": 3}, {"nombre": "Tu oferta", "x": 5, "y": 9}],
                      "hueco": "Nadie combina especialización alta con precio medio."},
  "oportunidades": [{"hueco": "...", "evidencia": "...", "oferta": "...", "precio": "...", "anuncio_tofu": "Comenta CITAS y te envío..."}],
  "recomendacion": "Empieza por el hueco 1 porque ...",
  "plan": ["Semana 1: ...", "Semana 2: ..."],
  "fuentes": [{"dato": "Número de clínicas", "fuente": "INE, DIRCE", "url": "https://...", "fecha": "2025", "tipo": "Dato"}]
}
Notas de 1 a 5; "x" e "y" del posicionamiento de 1 a 10. Si un competidor se llama "Tu oferta" (o el nombre
de la agencia), sale destacado en verde.
"""
import json, sys, os, html

VIOLETA, MENTA, NARANJA, TINTA, FONDO = "#7c5cff", "#2ee6a8", "#ff8a5c", "#141a28", "#f7f6fb"
e = lambda s: html.escape(str(s if s is not None else ""))

def es_tuyo(nombre, d):
    n = str(nombre).lower()
    return n in ("tu oferta", "tú", "tu agencia") or (d.get("agencia") and n == str(d["agencia"]).lower())

def barras(items, maximo, ancho=560, alto_fila=34, etiqueta=170):
    """items: lista de (texto, valor, color, texto_valor)"""
    h = len(items) * alto_fila + 10
    out = [f'<svg viewBox="0 0 {ancho} {h}" width="100%" role="img" aria-label="Gráfico de barras">']
    for i, (txt, val, color, vtxt) in enumerate(items):
        y = i * alto_fila + 6
        w = 0 if not maximo else max(2, (ancho - etiqueta - 70) * float(val) / maximo)
        out.append(f'<text x="0" y="{y+17}" font-size="12" fill="{TINTA}">{e(txt)[:28]}</text>')
        out.append(f'<rect x="{etiqueta}" y="{y+3}" width="{ancho-etiqueta-70}" height="20" rx="10" fill="#ebe8f7"/>')
        out.append(f'<rect x="{etiqueta}" y="{y+3}" width="{w:.1f}" height="20" rx="10" fill="{color}"/>')
        out.append(f'<text x="{etiqueta + w + 8:.1f}" y="{y+18}" font-size="12" font-weight="700" fill="{TINTA}">{e(vtxt)}</text>')
    out.append("</svg>")
    return "".join(out)

def mapa(pos, d):
    W, H, m = 560, 380, 48
    pts = pos.get("puntos", [])
    sx = lambda x: m + (float(x) - 1) / 9 * (W - 2 * m)
    sy = lambda y: H - m - (float(y) - 1) / 9 * (H - 2 * m)
    out = [f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Mapa de posicionamiento">',
           f'<rect x="{m}" y="{m/2}" width="{W-2*m}" height="{H-1.5*m}" fill="#ffffff" stroke="#dcd8ee"/>',
           f'<line x1="{W/2}" y1="{m/2}" x2="{W/2}" y2="{H-m}" stroke="#dcd8ee" stroke-dasharray="4 4"/>',
           f'<line x1="{m}" y1="{(H-m/2)/2+m/4}" x2="{W-m}" y2="{(H-m/2)/2+m/4}" stroke="#dcd8ee" stroke-dasharray="4 4"/>',
           f'<text x="{W/2}" y="{H-12}" font-size="12" text-anchor="middle" fill="#5a5e7a">{e(pos.get("eje_x","Eje X"))} (de menos a más) →</text>',
           f'<text x="14" y="{H/2}" font-size="12" text-anchor="middle" fill="#5a5e7a" transform="rotate(-90 14 {H/2})">{e(pos.get("eje_y","Eje Y"))} (de menos a más) →</text>']
    for p in pts:
        x, y = sx(p.get("x", 5)), sy(p.get("y", 5))
        tuyo = es_tuyo(p.get("nombre"), d)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{9 if tuyo else 7}" fill="{MENTA if tuyo else VIOLETA}"/>')
        out.append(f'<text x="{x+12:.1f}" y="{y+4:.1f}" font-size="11.5" font-weight="{700 if tuyo else 500}" fill="{TINTA}">{e(p.get("nombre"))}</text>')
    out.append("</svg>")
    return "".join(out)

def pagina(contenido, n, d, oscura=False):
    pie = f'<div class="pie"><span>{e(d.get("agencia") or "Informe de mercado")} · {e(d.get("titulo"))}</span><span>{n}</span></div>'
    return f'<section class="pg{" oscura" if oscura else ""}"><div class="franja"></div>{contenido}{pie}</section>'

def construir(d):
    pags, n = [], 1
    res = "".join(f"<li>{e(f)}</li>" for f in d.get("resumen", []))
    pags.append(pagina(f'''<div class="portada"><p class="eti">Investigación de mercado{" · " + e(d["agencia"]) if d.get("agencia") else ""}</p>
<h1>{e(d.get("titulo"))}</h1><p class="sub">{e(d.get("fecha",""))}</p>
{f'<div class="pregunta"><b>La pregunta</b><p>{e(d["pregunta"])}</p></div>' if d.get("pregunta") else ""}
{f'<div class="respuesta"><b>La respuesta en tres frases</b><ol>{res}</ol></div>' if res else ""}</div>''', n, d, oscura=True)); n += 1

    bloques = []
    m = d.get("mercado")
    if m:
        tarj = f'<div class="kpi"><span>Negocios en la zona</span><b>{e(m.get("negocios","—"))}</b><small>{e(m.get("fuente",""))}</small></div>'
        for s in m.get("escenarios", []):
            tarj += f'<div class="kpi"><span>Escenario {e(s.get("nombre",""))}</span><b>{e(s.get("facturacion","—"))}</b><small>{e(s.get("clientes",""))} clientes</small></div>'
        bloques.append(f'<h2>El mercado en números</h2><div class="kpis">{tarj}</div><p class="nota">Los escenarios combinan datos y supuestos; el detalle está en las fuentes.</p>')
    comps = d.get("competidores", [])
    if comps:
        filas = "".join(f'<tr><td><b>{e(c.get("nombre"))}</b></td><td><span class="tag">{e(c.get("tipo",""))}</span></td><td>{e(c.get("que_vende",""))}</td><td>{e(c.get("precio","No publicado"))}</td></tr>' for c in comps[:12])
        bloques.append(f'<h2>Quién compite por este cliente</h2><table><tr><th>Competidor</th><th>Tipo</th><th>Qué vende</th><th>Precio</th></tr>{filas}</table>')
    if bloques: pags.append(pagina("".join(bloques), n, d)); n += 1

    p = d.get("puntuacion")
    if p and p.get("notas"):
        pesos = p.get("pesos") or [1] * len(p.get("criterios", []))
        tot = []
        for nom, notas in p["notas"].items():
            if len(notas) == len(pesos) and sum(pesos):
                tot.append((nom, sum(a * b for a, b in zip(notas, pesos)) / sum(pesos)))
        tot.sort(key=lambda t: -t[1])
        graf = barras([(nom, v, MENTA if es_tuyo(nom, d) else VIOLETA, f"{v:.1f}") for nom, v in tot], 5)
        crit = p.get("criterios", [])
        cab = "".join(f"<th>{e(nom)}</th>" for nom in p["notas"])
        filas = ""
        for i, c in enumerate(crit):
            celdas = ""
            for notas in p["notas"].values():
                v = notas[i] if i < len(notas) else ""
                celdas += f'<td class="c n{v}">{e(v)}</td>'
            filas += f"<tr><td>{e(c)}</td><td class='c'>{e(pesos[i] if i < len(pesos) else '')}</td>{celdas}</tr>"
        pags.append(pagina(f'''<h2>La comparativa</h2><p class="nota">Puntuación media ponderada de 1 a 5. En verde, tu oferta.</p>{graf}
<h3>Nota por criterio</h3><table class="calor"><tr><th>Criterio</th><th>Peso</th>{cab}</tr>{filas}</table>''', n, d)); n += 1

    bloques = []
    rs = d.get("resenas", [])
    if rs:
        rs = sorted(rs, key=lambda r: -float(r.get("veces", 0) or 0))[:8]
        mx = max(float(r.get("veces", 0) or 0) for r in rs) or 1
        graf = barras([(f'{r.get("tipo","")}: {r.get("tema","")}', r.get("veces", 0), NARANJA if str(r.get("tipo","")).lower().startswith("q") else MENTA, r.get("veces", 0)) for r in rs], mx, etiqueta=230)
        citas = "".join(f'<p class="cita">«{e(r["ejemplo"])}»</p>' for r in rs[:3] if r.get("ejemplo"))
        bloques.append(f'<h2>Lo que dicen sus clientes</h2><p class="nota">Temas más repetidos en las reseñas. Naranja: quejas. Verde: elogios.</p>{graf}{citas}')
    ads = d.get("anuncios", [])
    if ads:
        cuenta = {k: sum(1 for a in ads if str(a.get("etapa", "")).upper() == k) for k in ("TOFU", "MOFU", "BOFU")}
        mx = max(cuenta.values()) or 1
        graf = barras([(k, v, {"TOFU": "#b9aaff", "MOFU": VIOLETA, "BOFU": MENTA}[k], v) for k, v in cuenta.items()], mx)
        vacia = [k for k, v in cuenta.items() if v == 0]
        ganchos = "".join(f'<li><b>{e(a.get("competidor",""))}:</b> {e(a.get("gancho",""))} <span class="tag">{e(a.get("etapa",""))}</span></li>' for a in ads[:6])
        bloques.append(f'<h2>Lo que anuncian</h2><p class="nota">Anuncios activos por etapa del embudo.{" Nadie cubre: " + ", ".join(vacia) + "." if vacia else ""}</p>{graf}<ul class="lista">{ganchos}</ul>')
    if bloques: pags.append(pagina("".join(bloques), n, d)); n += 1

    pos = d.get("posicionamiento")
    if pos and pos.get("puntos"):
        pags.append(pagina(f'<h2>Dónde está el espacio libre</h2>{mapa(pos, d)}{f"<div class=hueco><b>El hueco</b><p>{e(pos.get("hueco"))}</p></div>" if pos.get("hueco") else ""}', n, d)); n += 1

    ops = d.get("oportunidades", [])
    if ops or d.get("recomendacion"):
        tarj = ""
        for i, o in enumerate(ops[:3], 1):
            tarj += f'''<div class="op"><span class="num">{i}</span><h3>{e(o.get("hueco",""))}</h3>
<p><b>Por qué lo sabemos:</b> {e(o.get("evidencia",""))}</p><p><b>Qué vender:</b> {e(o.get("oferta",""))}{" · " + e(o["precio"]) if o.get("precio") else ""}</p>
{f'<p class="anuncio">«{e(o["anuncio_tofu"])}»</p>' if o.get("anuncio_tofu") else ""}</div>'''
        plan = "".join(f"<li>{e(x)}</li>" for x in d.get("plan", []))
        pags.append(pagina(f'''<h2>Oportunidades</h2>{tarj}
{f'<div class="reco"><b>Qué haría primero</b><p>{e(d["recomendacion"])}</p>{f"<ol>{plan}</ol>" if plan else ""}</div>' if d.get("recomendacion") else ""}''', n, d)); n += 1

    fs = d.get("fuentes", [])
    if fs:
        filas = "".join(f'<tr><td>{e(f.get("dato",""))}</td><td>{e(f.get("fuente",""))}{"<br><small>" + e(f["url"]) + "</small>" if f.get("url") else ""}</td><td>{e(f.get("fecha",""))}</td><td><span class="tag">{e(f.get("tipo",""))}</span></td></tr>' for f in fs)
        pags.append(pagina(f'<h2>Fuentes</h2><p class="nota">Dato: publicado. Declarado: lo dice un tercero. Estimación: cálculo propio.</p><table><tr><th>Dato</th><th>Fuente</th><th>Fecha</th><th>Tipo</th></tr>{filas}</table>', n, d)); n += 1
    return "".join(pags)

CSS = f'''@page{{size:A4;margin:0}}*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Poppins,"Segoe UI",Arial,sans-serif;color:{TINTA};font-size:10.5pt;line-height:1.5}}
.pg{{width:210mm;height:297mm;position:relative;padding:20mm 18mm 22mm;background:{FONDO};page-break-after:always;overflow:hidden}}
.pg.oscura{{background:{TINTA};color:#eef0f8}}
.franja{{position:absolute;left:0;right:0;top:0;height:3mm;background:linear-gradient(90deg,{VIOLETA} 50%,{MENTA} 50%)}}
.pie{{position:absolute;left:18mm;right:18mm;bottom:10mm;display:flex;justify-content:space-between;font-size:8.5pt;color:#7b7f9e}}
h1{{font-size:30pt;line-height:1.1;margin-bottom:3mm}} h2{{font-size:17pt;margin:0 0 3mm}} h3{{font-size:11.5pt;margin:5mm 0 2mm}}
.portada{{display:flex;flex-direction:column;justify-content:center;height:100%;gap:6mm}}
.eti{{font-size:9pt;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:{MENTA}}}
.sub{{color:#a2a8c6}}
.pregunta,.respuesta{{background:#1f2540;border-radius:4mm;padding:6mm}}
.pregunta p{{font-size:13pt;margin-top:2mm}} .respuesta ol{{margin:2mm 0 0 5mm}} .respuesta li{{margin-bottom:2mm;font-size:11pt}}
.nota{{font-size:9pt;color:#6a6e8a;margin-bottom:3mm}}
.kpis{{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-bottom:3mm}}
.kpi{{background:#fff;border:1px solid #e3e0f2;border-radius:4mm;padding:5mm}}
.kpi span{{display:block;font-size:9pt;color:#6a6e8a}} .kpi b{{display:block;font-size:19pt;color:{VIOLETA};line-height:1.2}} .kpi small{{color:#6a6e8a;font-size:8.5pt}}
table{{width:100%;border-collapse:collapse;margin:2mm 0 6mm;font-size:9.5pt;background:#fff}}
th{{background:{TINTA};color:#fff;text-align:left;padding:2.5mm 3mm}} td{{padding:2.5mm 3mm;border-bottom:1px solid #e3e0f2;vertical-align:top}}
td small{{color:#6a6e8a;word-break:break-all}}
.tag{{display:inline-block;background:#efebff;color:#4b36c9;border-radius:2mm;padding:0.5mm 2mm;font-size:8.5pt;font-weight:600}}
.calor td.c{{text-align:center;font-weight:700}} .n5{{background:#c8f5e4}} .n4{{background:#e2f9f0}} .n2{{background:#ffe6dc}} .n1{{background:#ffd2c0}}
.cita{{font-style:italic;color:#4b4f6b;border-left:3px solid {NARANJA};padding-left:3mm;margin:2mm 0}}
.lista{{margin:2mm 0 0 5mm}} .lista li{{margin-bottom:1.5mm}}
.hueco,.reco{{background:{TINTA};color:#eef0f8;border-radius:4mm;padding:5mm 6mm;margin-top:4mm}} .hueco b,.reco b{{color:{MENTA}}}
.reco ol{{margin:2mm 0 0 5mm}}
.op{{position:relative;background:#fff;border:1.5px solid {VIOLETA};border-radius:4mm;padding:4mm 5mm 4mm 15mm;margin-bottom:4mm}}
.op .num{{position:absolute;left:4mm;top:4mm;width:8mm;height:8mm;border-radius:50%;background:{VIOLETA};color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}}
.op h3{{margin:0 0 2mm}} .op p{{margin-bottom:1.5mm}} .anuncio{{background:#e9fbf4;border-radius:2mm;padding:2mm 3mm;font-weight:600}}'''

def main(entrada, salida):
    d = json.load(open(entrada, encoding="utf-8"))
    doc = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{e(d.get("titulo"))}</title><style>{CSS}</style></head><body>{construir(d)}</body></html>'
    base = os.path.splitext(salida)[0]
    html_path = base + ".html"
    open(html_path, "w", encoding="utf-8").write(doc)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch(); pg = b.new_page()
            pg.goto("file://" + os.path.abspath(html_path)); pg.wait_for_timeout(500)
            pg.pdf(path=base + ".pdf", format="A4", print_background=True, prefer_css_page_size=True); b.close()
        print(f"PDF creado: {base}.pdf")
    except Exception as ex:
        print(f"No se pudo crear el PDF ({ex.__class__.__name__}). Informe en HTML: {html_path} "
              "(ábrelo en el navegador y usa Imprimir > Guardar como PDF).")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])
