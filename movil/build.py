#!/usr/bin/env python3
"""Genera movil/www/index.html (PWA instalable) a partir de movil/app.html."""
import pathlib, re
here = pathlib.Path(__file__).parent
app = (here / "app.html").read_text(encoding="utf-8")
title = re.search(r"<title>(.*?)</title>", app).group(1)
app = re.sub(r"<title>.*?</title>\n?", "", app, count=1)
app = app.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
head = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="Nyland AI Solutions: el cerebro de IA para tu empresa. HUMAN + AI.">
<meta name="theme-color" content="#1C3A2E">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Nyland">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>:root{{padding-top:env(safe-area-inset-top,0px)}}img{{max-width:100%}}</style>
</head>
<body>
"""
tail = """
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
</script>
</body>
</html>
"""
(here / "www" / "index.html").write_text(head + app + tail, encoding="utf-8")
print("www/index.html generado")
