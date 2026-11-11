<?php
header('Content-Type: text/plain');
header('X-Robots-Tag: noindex');
foreach (array('HTTPS','SERVER_PORT','REQUEST_SCHEME','HTTP_X_FORWARDED_PROTO','HTTP_X_FORWARDED_PORT','HTTP_X_FORWARDED_SSL','HTTP_X_HTTPS','HTTP_X_FORWARDED_SCHEME','HTTP_X_SCHEME','HTTP_X_REAL_PORT','HTTP_FRONT_END_HTTPS','HTTP_CF_VISITOR') as $k) echo $k, '=', isset($_SERVER[$k]) ? $_SERVER[$k] : '-', "\n";
foreach ($_SERVER as $k => $v) if (strpos($k, 'HTTP_X') === 0) echo 'ALL ', $k, '=', $v, "\n";
