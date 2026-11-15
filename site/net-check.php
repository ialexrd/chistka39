<?php
// Временная проверка: какие внешние сервисы доступны с хостинга. Удалить после проверки.
header('Content-Type: text/plain; charset=utf-8');
$hosts = ['https://api.telegram.org/', 'https://script.google.com/', 'https://workers.dev/', 'https://www.cloudflare.com/cdn-cgi/trace',
  'https://api.github.com/', 'https://platform-api.max.ru/', 'https://botapi.max.ru/', 'https://functions.yandexcloud.net/', 'https://ya.ru/'];
foreach ($hosts as $u) {
  $ch = curl_init($u);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 8, CURLOPT_NOBODY => true]);
  curl_exec($ch);
  echo $u, ' => ', curl_errno($ch) ? 'ОШИБКА ' . curl_error($ch) : 'HTTP ' . curl_getinfo($ch, CURLINFO_HTTP_CODE), "\n";
  curl_close($ch);
}
echo 'mail(): ', function_exists('mail') ? 'есть' : 'нет', ', sendmail_path=', ini_get('sendmail_path'), "\n";
foreach (['smtp.yandex.ru:465', 'smtp.mail.ru:465'] as $h) { $s = @stream_socket_client('tcp://' . $h, $no, $er, 5); echo $h, ' => ', $s ? 'ok' : "нет ($er)", "\n"; if ($s) fclose($s); }
