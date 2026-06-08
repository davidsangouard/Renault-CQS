<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    jsonOk([
        'ipn'    => $_SESSION['ipn']    ?? null,
        'filter' => isset($_SESSION['filter']) ? $_SESSION['filter'] : null,
    ]);
}

if ($method === 'POST') {
    $body   = getBody();
    $action = $body['action'] ?? 'login';

    if ($action === 'filter') {
        $_SESSION['filter'] = $body['filter'] ?? null;
        jsonOk(['ok' => true]);
    }

    if ($action === 'login') {
        $ipn = strtoupper(trim($body['ipn'] ?? ''));
        if ($ipn === '') jsonErr('IPN requis');
        $_SESSION['ipn'] = $ipn;
        jsonOk(['ok' => true, 'ipn' => $ipn]);
    }

    if ($action === 'manager_check') {
        $ipn = strtoupper(trim($body['ipn'] ?? ''));
        if ($ipn === '') jsonErr('IPN requis');
        $db  = getDB();
        $row = $db->query("SELECT cfg_value FROM app_config WHERE cfg_key = 'manager_ipns'")->fetch();
        $list = $row ? array_map('strtoupper', json_decode($row['cfg_value'], true) ?: []) : ['ADMIN','CHEF01','QUAL01'];
        if (in_array($ipn, $list)) jsonOk(['ok' => true, 'ipn' => $ipn]);
        else jsonErr('IPN non autorisé', 403);
    }
}

if ($method === 'DELETE') {
    $_SESSION = [];
    session_destroy();
    jsonOk(['ok' => true]);
}
