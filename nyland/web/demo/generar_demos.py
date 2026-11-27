#!/usr/bin/env python3
"""Genera las demos interactivas por nicho (clínica dental y clínica estética).
Datos ficticios, marcados como ejemplo. Uso: python3 generar_demos.py"""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))
NICHOS = {
 'dental': dict(
  titulo='Clínica dental', clinica='Clínica Dental Sonrisa (ejemplo)', tratamiento='Implantes',
  kpis=[('12 h','horas de recepción liberadas esta semana'),('8','presupuestos en seguimiento automático'),('94 %','citas confirmadas por WhatsApp'),('3','pacientes recuperados este mes')],
  presupuestos=[('Marta G.','Implante unitario','1.250 €','Recordatorio 2 enviado','abierto'),('Jordi P.','Ortodoncia invisible','3.400 €','Ha pedido financiación','caliente'),('Lucía R.','Carillas (4)','1.900 €','Aceptado ✓','aceptado'),('Pere M.','Implantes (2)','2.600 €','Sin abrir · llamada mañana','frio'),('Anna S.','Blanqueamiento','320 €','Aceptado ✓','aceptado')],
  agenda=[('09:00','Revisión · Carlos V.','Confirmada por WhatsApp'),('09:30','Limpieza · Núria B.','Confirmada por WhatsApp'),('10:30','Implante · Marta G.','Recordatorio enviado'),('12:00','Ortodoncia · Jordi P.','Confirmada por WhatsApp'),('16:00','Primera visita · Pau T.','Pendiente de confirmar')],
  mensajes=[('WhatsApp','Hola, ¿tenéis hueco esta semana para una limpieza?','¡Hola! Sí: jueves a las 17:30 o viernes a las 10:00. ¿Cuál te va mejor?'),('Instagram','¿Cuánto cuesta un implante?','Depende de cada caso. Te proponemos una primera visita gratuita para valorarlo. ¿Te reservo una?'),('Email','Necesito cambiar mi cita del martes','Sin problema. Tienes libre el martes a las 18:00 o el miércoles a las 9:30. ¿Te cambio a alguna?')],
  semana=[('L',72),('M',80),('X',41),('J',88),('V',65)], dia_bajo='miércoles',
  motivo='Los miércoles coinciden cirugías, proveedores y llamadas. Proponemos mover las visitas de proveedor al jueves por la tarde y activar respuestas automáticas en las horas punta.'),
 'estetica': dict(
  titulo='Clínica estética', clinica='Clínica Estética Lumen (ejemplo)', tratamiento='Tratamientos',
  kpis=[('10 h','horas de recepción liberadas esta semana'),('11','presupuestos en seguimiento automático'),('91 %','citas confirmadas por WhatsApp'),('5','clientas recuperadas este mes')],
  presupuestos=[('Laura M.','Ácido hialurónico','420 €','Recordatorio 1 enviado','abierto'),('Cristina F.','Bono láser (6 sesiones)','690 €','Ha preguntado por pago en cuotas','caliente'),('Elena T.','Toxina botulínica','350 €','Aceptado ✓','aceptado'),('Sara P.','Mesoterapia facial','280 €','Sin abrir · recordatorio mañana','frio'),('Marc R.','Tratamiento capilar','900 €','Aceptado ✓','aceptado')],
  agenda=[('10:00','Láser · Cristina F.','Confirmada por WhatsApp'),('11:00','Valoración · Laura M.','Recordatorio enviado'),('12:30','Revisión toxina · Elena T.','Confirmada por WhatsApp'),('17:00','Higiene facial · Júlia S.','Confirmada por WhatsApp'),('18:30','Primera visita · Irene C.','Pendiente de confirmar')],
  mensajes=[('Instagram','Hola, ¿qué precio tiene el ácido hialurónico en labios?','¡Hola! Depende de la zona y el volumen. Hacemos una valoración gratuita de 15 minutos. ¿Te va bien el jueves por la tarde?'),('WhatsApp','¿Puedo pagar el bono de láser en cuotas?','Sí, puedes pagarlo en 3 cuotas sin intereses. ¿Te reservo la primera sesión?'),('Email','Me salió una pequeña rojez tras el tratamiento','Gracias por avisarnos. Es habitual las primeras 48 h; aun así, la doctora te llamará hoy para revisarlo contigo.')],
  semana=[('L',60),('M',78),('X',85),('J',52),('V',90)], dia_bajo='jueves',
  motivo='Los jueves concentran revisiones y llamadas de clientas con dudas. Proponemos respuestas automáticas de seguimiento tras cada tratamiento y un bloque fijo de revisiones por la mañana.'),
}
PLANTILLA = open(os.path.join(BASE, 'plantilla.html'), encoding='utf-8').read()
for clave, d in NICHOS.items():
    os.makedirs(os.path.join(BASE, clave), exist_ok=True)
    html = PLANTILLA.replace('__DATOS__', json.dumps(d, ensure_ascii=False)).replace('__TITULO__', d['titulo'])
    open(os.path.join(BASE, clave, 'index.html'), 'w', encoding='utf-8').write(html)
    print('demo', clave, len(html), 'bytes')
