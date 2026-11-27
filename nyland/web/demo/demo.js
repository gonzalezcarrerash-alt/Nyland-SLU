(function(){
  const d = JSON.parse(document.getElementById('datos').textContent);
  const $ = s => document.querySelector(s), vista = $('#vista');
  $('#nicho').textContent = d.titulo.toLowerCase(); $('#clinica').textContent = d.clinica;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const vistas = {
    hoy: () => `<p class="t">Buenos días</p><div class="kpis">${d.kpis.map(k=>`<div class="kpi"><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join('')}</div>
      <p class="t" style="font-size:19px;margin-top:14px">Lo que necesita a una persona hoy</p>
      <div class="fila"><b>2 llamadas pendientes</b><small>Presupuestos sin abrir desde hace 5 días</small></div>
      <div class="fila"><b>1 cita sin confirmar</b><small>Se le enviará un segundo aviso a las 12:00</small></div>`,
    pres: () => `<p class="t">${esc(d.tratamiento)} · presupuestos</p>${d.presupuestos.map((p,i)=>`<div class="fila"><b>${esc(p[0])}</b> · ${esc(p[2])}<small>${esc(p[1])}</small><span class="estado ${p[4]}">${esc(p[3])}</span>${p[4]==='frio'||p[4]==='abierto'?`<br><button class="mini" data-rec="${i}">Enviar recordatorio ahora</button>`:''}</div>`).join('')}`,
    agenda: () => `<p class="t">Agenda de hoy</p>${d.agenda.map((a,i)=>`<div class="fila"><b>${esc(a[0])}</b> · ${esc(a[1])}<small>${esc(a[2])}</small>${/Pendiente/.test(a[2])?`<button class="mini" data-conf="${i}">Pedir confirmación</button>`:''}</div>`).join('')}`,
    msj: () => `<p class="t">Bandeja única</p>${d.mensajes.map(m=>`<div class="fila"><span class="canal">${esc(m[0])}</span><div class="burbuja">${esc(m[1])}</div><div class="ia"><small style="color:var(--menta)">Respuesta sugerida por la IA</small><br>${esc(m[2])}</div><button class="mini" data-env>Revisar y enviar</button></div>`).join('')}`,
    semana: () => `<p class="t">Tu efecto ${esc(d.dia_bajo)}</p><small style="color:var(--suave)">Tiempo productivo del equipo por día</small><div class="barras">${d.semana.map(s=>`<div><i style="height:${s[1]}%" class="${s[1]===Math.min(...d.semana.map(x=>x[1]))?'bajo':''}"></i><span>${s[0]}</span></div>`).join('')}</div>
      <div class="fila"><b>Lo que hemos visto</b><small>${esc(d.motivo)}</small></div>`
  };
  const pinta = v => { vista.innerHTML = vistas[v](); document.querySelectorAll('.pestanas button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); };
  document.querySelectorAll('.pestanas button').forEach(b => b.addEventListener('click', () => pinta(b.dataset.v)));
  vista.addEventListener('click', e => {
    const b = e.target.closest('.mini'); if (!b) return;
    b.disabled = true; b.textContent = b.dataset.conf !== undefined ? 'Confirmación enviada ✓' : (b.dataset.env !== undefined ? 'Enviado ✓' : 'Recordatorio enviado ✓');
  });
  pinta('hoy');
})();
