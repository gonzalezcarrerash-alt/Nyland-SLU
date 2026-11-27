/* Nyland · aviso de cookies y píxel de Meta (solo se carga si el visitante acepta) */
(function () {
  var PIXEL = '1680061947093796', CLAVE = 'nyland-cookies';
  var leer = function () { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } };
  var guardar = function (v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} };
  var cargado = false;
  function cargarPixel() {
    if (cargado) return; cargado = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL); window.fbq('track', 'PageView');
  }
  window.nylandLead = function (tipo) { if (leer() === 'si' && window.fbq) window.fbq('track', 'Lead', { content_name: tipo || 'formulario' }); };
  var css = '.nyc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;background:#0f241b;color:#F2F5F0;border:1px solid rgba(214,178,108,.45);border-radius:18px;padding:18px 20px;font:14px/1.5 Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
    '.nyc p{margin:0 0 12px}.nyc a{color:#ecd08f}.nyc .b{display:flex;gap:10px;flex-wrap:wrap}.nyc button{border-radius:999px;padding:10px 18px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.nyc .si{background:linear-gradient(135deg,#ecd08f,#D6B26C);color:#0b1d15;border:0}.nyc .no{background:none;color:#F2F5F0;border:1px solid rgba(242,245,240,.35)}';
  function aviso() {
    if (document.querySelector('.nyc')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.className = 'nyc'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookies');
    d.innerHTML = '<p>Usamos cookies de Meta para medir nuestros anuncios y mostrarte información relevante. Solo se activan si las aceptas. <a href="/privacidad.html#cookies">Más información</a>.</p><div class="b"><button class="si" type="button">Aceptar</button><button class="no" type="button">Rechazar</button></div>';
    d.querySelector('.si').onclick = function () { guardar('si'); d.remove(); cargarPixel(); };
    d.querySelector('.no').onclick = function () { guardar('no'); d.remove(); };
    document.body.appendChild(d);
  }
  function iniciar() {
    var v = leer();
    if (v === 'si') cargarPixel(); else if (v !== 'no') aviso();
    document.addEventListener('click', function (e) { var a = e.target.closest('[data-cookies]'); if (a) { e.preventDefault(); aviso(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
