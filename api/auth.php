<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET : état de la session ────────────────────────────────────────────────
if ($method === 'GET') {
    jsonOk([
        'ipn'    => $_SESSION['ipn']    ?? null,
        'filter' => $_SESSION['filter'] ?? null,
    ]);
}

// ── POST ────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body   = getBody();
    $action = $body['action'] ?? 'login';

    if ($action === 'filter') {
        $_SESSION['filter'] = $body['filter'] ?? null;
        jsonOk(['ok' => true]);
    }

    // Login opérateur — tout IPN est accepté
    if ($action === 'login') {
        $ipn = strtoupper(trim($body['ipn'] ?? ''));
        if ($ipn === '') jsonErr('IPN requis');
        $_SESSION['ipn'] = $ipn;
        jsonOk(['ok' => true, 'ipn' => $ipn]);
    }

    // Vérification IPN manager — contrôle dans la table ipns
    if ($action === 'manager_check') {
        $ipn = strtoupper(trim($body['ipn'] ?? ''));
        if ($ipn === '') jsonErr('IPN requis');

        $db  = getDB();
        $row = $db->prepare("SELECT id FROM ipns WHERE ipn = ? AND is_manager = 1");
        $row->execute([$ipn]);

        if ($row->fetch()) jsonOk(['ok' => true, 'ipn' => $ipn]);
        else               jsonErr('IPN non autorisé', 403);
    }
}

// ── DELETE : déconnexion ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $_SESSION = [];
    session_destroy();
    jsonOk(['ok' => true]);
}
