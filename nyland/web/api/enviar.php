<?php
// Nyland Consulting · Recepción de formularios de la web (diagnóstico y guía)
// Sin base de datos. Valida, frena el spam y reenvía: diagnóstico -> email a contacto@; guía -> lista de Brevo.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const DESTINO   = 'contacto@nylandconsulting.es';
const DOMINIO   = 'nylandconsulting.es';
const BREVO_FORM = 'https://65b167e8.sibforms.com/serve/MUIFAHC74YK4BUtau3wKFd1ArbIl6TUGcwhtsEimLPvJ7Mq9g61HHGuOBdF8ssr2VmkANlEF854V7UJKA1yR_bRsT6-cNuxLLIeWhUXnM51Di1-58ALy0dj9QWJ06Cvr3QgpRfFp21ZVqhI6xlrDccJVGUId9U0MHmy4yNi9fWm6AELIyyBBbLkpi1M_Tts-xvGXYR-jxh0z3QuXXw==';

function responder(int $codigo, array $datos): void { http_response_code($codigo); echo json_encode($datos, JSON_UNESCAPED_UNICODE); exit; }
function limpiar(string $v, int $max): string {
    $v = trim(str_replace(["\r", "\n", "\0"], ' ', $v));
    return mb_substr(strip_tags($v), 0, $max);
}
function texto_largo(string $v, int $max): string {
    $v = str_replace("\0", '', trim($v));
    return mb_substr(strip_tags($v), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(405, ['ok' => false, 'error' => 'Método no permitido.']);

// Solo desde la propia web
$origen = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$host = parse_url($origen, PHP_URL_HOST) ?: '';
if ($host !== DOMINIO && $host !== 'www.' . DOMINIO) responder(403, ['ok' => false, 'error' => 'Origen no válido.']);

// Trampa para robots: este campo es invisible para las personas
if (!empty($_POST['web'] ?? '')) responder(200, ['ok' => true]);

// Límite de envíos por IP: 5 cada 10 minutos
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$fichero = sys_get_temp_dir() . '/nyland_' . hash('sha256', $ip . DOMINIO) . '.json';
$ahora = time();
$marcas = is_file($fichero) ? (json_decode((string) file_get_contents($fichero), true) ?: []) : [];
$marcas = array_values(array_filter($marcas, fn($t) => is_int($t) && $t > $ahora - 600));
if (count($marcas) >= 5) responder(429, ['ok' => false, 'error' => 'Demasiados envíos. Inténtalo de nuevo en unos minutos.']);
$marcas[] = $ahora;
@file_put_contents($fichero, json_encode($marcas), LOCK_EX);

$tipo = $_POST['tipo'] ?? '';
if (empty($_POST['rgpd'])) responder(422, ['ok' => false, 'error' => 'Necesitamos que aceptes la política de privacidad.']);

$cabeceras_base = [
    'From: Web Nyland Consulting <' . DESTINO . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

if ($tipo === 'diagnostico') {
    $nombre   = limpiar($_POST['nombre'] ?? '', 120);
    $empresa  = limpiar($_POST['empresa'] ?? '', 160);
    $sector   = limpiar($_POST['sector'] ?? '', 60);
    $contacto = limpiar($_POST['contacto'] ?? '', 160);
    $tiempo   = texto_largo($_POST['tiempo'] ?? '', 2000);
    if ($nombre === '' || $empresa === '' || $sector === '' || $contacto === '') responder(422, ['ok' => false, 'error' => 'Completa los campos obligatorios, por favor.']);
    $cab = $cabeceras_base;
    if (filter_var($contacto, FILTER_VALIDATE_EMAIL)) $cab[] = 'Reply-To: ' . $contacto;
    $asunto = '=?UTF-8?B?' . base64_encode('Nueva solicitud de diagnóstico · ' . $empresa) . '?=';
    $cuerpo = "Nueva solicitud de diagnóstico desde nylandconsulting.es\n\n"
        . "Nombre: $nombre\nEmpresa: $empresa\nSector: $sector\nTeléfono o email: $contacto\n\n"
        . "Lo que más tiempo le quita al equipo:\n" . ($tiempo !== '' ? $tiempo : '(no lo ha indicado)') . "\n\n"
        . 'Enviado el ' . date('d/m/Y H:i') . "\n";
    if (!mail(DESTINO, $asunto, $cuerpo, implode("\r\n", $cab))) responder(500, ['ok' => false, 'error' => 'No hemos podido enviar tu solicitud.']);
    responder(200, ['ok' => true]);
}

if ($tipo === 'guia') {
    $nombre = limpiar($_POST['nombre'] ?? '', 120);
    $email  = limpiar($_POST['email'] ?? '', 160);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(422, ['ok' => false, 'error' => 'Revisa tu email, por favor.']);
    $ch = curl_init(BREVO_FORM);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(['EMAIL' => $email, 'NOMBRE' => $nombre, 'email_address_check' => '', 'locale' => 'es']),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'X-Requested-With: XMLHttpRequest'],
    ]);
    $res = curl_exec($ch);
    $codigo = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = is_string($res) ? json_decode($res, true) : null;
    if ($codigo !== 200 || empty($json['success'])) responder(502, ['ok' => false, 'error' => 'No hemos podido registrar tu petición.']);
    // Aviso interno
    $asunto = '=?UTF-8?B?' . base64_encode('Nueva petición de la guía · ' . ($nombre !== '' ? $nombre : $email)) . '?=';
    @mail(DESTINO, $asunto, "Alguien ha pedido la guía en la web.\n\nNombre: " . ($nombre !== '' ? $nombre : '(sin nombre)') . "\nEmail: $email\n\nBrevo le ha enviado el email de confirmación. Cuando confirme, recibirá la guía y la secuencia automática.\n", implode("\r\n", $cabeceras_base));
    responder(200, ['ok' => true]);
}

responder(400, ['ok' => false, 'error' => 'Petición no válida.']);
