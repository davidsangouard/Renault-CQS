<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

define('MAX_IMAGES_PER_OP', 10);

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: toutes les images schéma pour organe + op ───────────────────────────
if ($method === 'GET') {
    $organe = trim($_GET['organe'] ?? '');
    $op     = trim($_GET['op']     ?? '');
    if (!$organe || !$op) jsonErr('organe et op requis');

    $db = getDB();
    $stmt = $db->prepare("
        SELECT img.id, img.image_data, img.mime_type
        FROM op_schema_images img
        JOIN operations op  ON op.id  = img.operation_id
        JOIN organes    org ON org.id  = op.organe_id
        WHERE org.code = ? AND op.op_key = ?
        ORDER BY img.id
    ");
    $stmt->execute([$organe, $op]);
    $rows   = $stmt->fetchAll();
    $images = array_map(fn($r) => [
        'id'        => (int)$r['id'],
        'imageData' => $r['image_data'],
        'mimeType'  => $r['mime_type'],
    ], $rows);
    jsonOk(['images' => $images]);
}

// ── POST: ajoute une image schéma ────────────────────────────────────────────
if ($method === 'POST') {
    $b      = getBody();
    $organe = trim($b['organe']    ?? '');
    $op     = trim($b['op']        ?? '');
    $data   = $b['imageData']      ?? '';
    $mime   = trim($b['mimeType']  ?? 'image/jpeg');

    if (!$organe || !$op || !$data) jsonErr('organe, op et imageData requis');
    if (!str_starts_with($data, 'data:')) jsonErr('imageData doit être un data URL');

    $db   = getDB();
    $stmt = $db->prepare("
        SELECT op.id FROM operations op
        JOIN organes org ON org.id = op.organe_id
        WHERE org.code = ? AND op.op_key = ?
        LIMIT 1
    ");
    $stmt->execute([$organe, $op]);
    $opId = $stmt->fetchColumn();
    if (!$opId) jsonErr('Opération introuvable : organe=' . $organe . ' op=' . $op);

    // Limite 10 images par OP
    $cntStmt = $db->prepare("SELECT COUNT(*) FROM op_schema_images WHERE operation_id = ?");
    $cntStmt->execute([$opId]);
    if ((int)$cntStmt->fetchColumn() >= MAX_IMAGES_PER_OP) {
        jsonErr('Maximum ' . MAX_IMAGES_PER_OP . ' images par opération atteint');
    }

    try {
        $db->prepare("INSERT INTO op_schema_images (operation_id, image_data, mime_type) VALUES (?,?,?)")
           ->execute([$opId, $data, $mime]);
    } catch (\PDOException $e) {
        jsonErr('Erreur DB : ' . $e->getMessage());
    }

    jsonOk(['ok' => true, 'id' => (int)$db->lastInsertId()]);
}

// ── DELETE: supprime une image par son id ────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonErr('id requis');

    getDB()->prepare("DELETE FROM op_schema_images WHERE id=?")->execute([$id]);
    jsonOk(['ok' => true]);
}
