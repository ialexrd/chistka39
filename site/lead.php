<?php
// Приём заявок с сайта: сохраняет заявку на хостинге и пересылает её в Telegram.
// Токен бота и chat_id лежат в lead-config.php — его пишет GitHub Actions
// (deploy-ftp.yml) из секретов TG_BOT_TOKEN, TG_CHAT_ID, LEAD_EMAIL. В git его нет.
// Ответ: {"ok":true} или {"ok":false,"error":"..."}; при ошибке скрипт на сайте
// показывает кнопки Telegram и MAX с готовым текстом заявки.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply($ok, $error = '', $code = 200) {
    http_response_code($code);
    $out = $ok ? ['ok' => true] : ['ok' => false, 'error' => $error];
    if ($ok && $error !== '') $out['warn'] = $error; // ушло запасным путём: причина сбоя основного
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(false, 'method', 405);

// Заявки принимаем только со своего сайта
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !preg_match('~^https?://(www\.)?chistka-39\.ru$~i', $origin)) reply(false, 'origin', 403);

$cfgFile = __DIR__ . '/lead-config.php';
$cfg = is_file($cfgFile) ? (require $cfgFile) : [];
if (!is_array($cfg)) $cfg = [];

$raw = file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;

function field($in, $key, $max) {
    $v = isset($in[$key]) && is_scalar($in[$key]) ? (string)$in[$key] : '';
    $v = trim(preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', ' ', $v));
    return mb_substr($v, 0, $max, 'UTF-8');
}

// Ловушка для ботов: невидимое поле, человек его не заполняет
if (field($in, 'website', 200) !== '') reply(true);

$f = [
    'form'    => field($in, 'form', 80),
    'name'    => field($in, 'name', 80),
    'phone'   => field($in, 'phone', 30),
    'service' => field($in, 'service', 120),
    'details' => field($in, 'details', 500),
    'price'   => field($in, 'price', 200),
    'comment' => field($in, 'comment', 1500),
    'source'  => field($in, 'source', 300),
    'page'    => field($in, 'page', 300),
];
if (strlen(preg_replace('/\D/', '', $f['phone'])) < 10) reply(false, 'phone', 422);

// Папка для заявок и счётчика частоты, закрыта от просмотра из браузера
$dataDir = __DIR__ . '/lead-data';
if (!is_dir($dataDir)) @mkdir($dataDir, 0750, true);
if (!is_file($dataDir . '/.htaccess')) @file_put_contents($dataDir . '/.htaccess', "Require all denied\nDeny from all\n");

// Не больше 5 заявок с одного адреса за 10 минут
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$ip = trim(explode(',', $ip)[0]);
$rateFile = $dataDir . '/rate.json';
$now = time();
$rate = is_file($rateFile) ? (json_decode((string)@file_get_contents($rateFile), true) ?: []) : [];
foreach ($rate as $k => $times) {
    $rate[$k] = array_values(array_filter((array)$times, function ($t) use ($now) { return $t > $now - 600; }));
    if (!$rate[$k]) unset($rate[$k]);
}
$key = sha1($ip);
if (count($rate[$key] ?? []) >= 5) reply(false, 'rate', 429);
$rate[$key][] = $now;
@file_put_contents($rateFile, json_encode($rate), LOCK_EX);

// Текст заявки
$labels = [
    'service' => 'Услуга', 'details' => 'Что чистим', 'price' => 'Предварительно',
    'name' => 'Имя', 'phone' => 'Телефон', 'comment' => 'Комментарий',
    'source' => 'Источник', 'page' => 'Страница',
];
$lines = ['🧽 ' . ($f['form'] !== '' ? $f['form'] : 'Заявка с сайта')];
foreach ($labels as $k => $label) {
    if ($f[$k] !== '') $lines[] = $label . ': ' . $f[$k];
}
$digits = preg_replace('/\D/', '', $f['phone']);
if (strlen($digits) === 10) $digits = '7' . $digits;
if ($digits[0] === '8') $digits = '7' . substr($digits, 1);
$lines[] = 'Позвонить: +' . $digits;
$text = implode("\n", $lines);

// Сначала сохраняем на хостинге: заявка не потеряется, даже если Telegram не ответит
$row = [date('Y-m-d H:i:s'), $f['form'], $f['name'], $f['phone'], $f['service'], $f['details'], $f['price'], $f['comment'], $f['source'], $f['page']];
$fh = @fopen($dataDir . '/leads.csv', 'a');
if ($fh) { flock($fh, LOCK_EX); fputcsv($fh, $row, ';'); flock($fh, LOCK_UN); fclose($fh); }

// С хостинга в РФ api.telegram.org недоступен, поэтому сообщение идёт через
// пересылку (Google Apps Script, tools/telegram-relay.gs), если задан tg_relay.
function tg_send($token, $chat, $text, $relay = '') {
    $url = $relay !== '' ? $relay : 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $fields = ['chat_id' => $chat, 'text' => $text, 'disable_web_page_preview' => 'true'];
    if ($relay !== '') $fields['token'] = $token;
    $body = http_build_query($fields);
    $err = '';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 20,
            CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
        ]);
        $res = curl_exec($ch);
        if ($res === false) $err = 'curl ' . curl_errno($ch) . ': ' . curl_error($ch);
        $info = 'HTTP ' . curl_getinfo($ch, CURLINFO_HTTP_CODE) . ' ' . parse_url((string)curl_getinfo($ch, CURLINFO_EFFECTIVE_URL), PHP_URL_HOST);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => [
            'method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $body, 'timeout' => 10, 'ignore_errors' => true,
        ]]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res === false) $err = 'http: ' . (error_get_last()['message'] ?? 'нет ответа');
    }
    $j = json_decode((string)$res, true);
    if (is_array($j) && !empty($j['ok'])) return '';
    if ($err === '') $err = 'telegram: ' . (is_array($j) ? ($j['description'] ?? 'ok=false') : ($info ?? '') . ' ' . mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags((string)$res))), 0, 200, 'UTF-8'));
    return $err;
}

$sent = false;
$errors = [];
$token = trim($cfg['tg_token'] ?? '');
$chats = preg_split('/[\s,;]+/', (string)($cfg['tg_chat'] ?? ''), -1, PREG_SPLIT_NO_EMPTY);
if ($token === '') $errors[] = 'нет TG_BOT_TOKEN';
elseif (!$chats) $errors[] = 'нет TG_CHAT_ID';
else {
    foreach ($chats as $chat) {
        $e = tg_send($token, $chat, $text, trim($cfg['tg_relay'] ?? ''));
        if ($e === '') $sent = true; else $errors[] = $e;
    }
}

// Запасной канал — почта, если указана
$email = $cfg['email'] ?? '';
if ($email !== '' && (!$sent || !empty($cfg['email_always']))) {
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта chistka-39.ru') . '?=';
    $headers = "Content-Type: text/plain; charset=utf-8\r\nFrom: chistka-39.ru <noreply@chistka-39.ru>";
    if (@mail($email, $subject, $text, $headers)) $sent = true; else $errors[] = 'mail не ушло';
}

if ($token !== '') $errors = str_replace($token, '***', $errors);
if ($errors) @file_put_contents($dataDir . '/errors.log', date('Y-m-d H:i:s') . ' ' . implode(' | ', $errors) . "\n", FILE_APPEND | LOCK_EX);
if (!$sent) reply(false, 'send: ' . implode(' | ', $errors), 502);
reply(true, implode(' | ', $errors));
