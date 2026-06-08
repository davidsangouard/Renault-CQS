<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

function fetchAllOfs(PDO $db): array {
    $rows   = $db->query("SELECT * FROM ordres_fabrication ORDER BY created_at DESC")->fetchAll();
    $verifs = $db->query("SELECT * FROM op_verifications")->fetchAll();

    $byOf = [];
    foreach ($verifs as $v) $byOf[$v['of_id']][$v['op_key']] = $v;

    $out = [];
    foreach ($rows as $of) {
        $opsList = json_decode($of['ops_list'] ?? '[]', true) ?: [];
        $ops = [];
        foreach ($opsList as $k) {
            $v = $byOf[$of['of_id']][$k] ?? null;
            $ops[$k] = $v ? [
                'status'        => $v['status']     ?? 'todo',
                'pieceNum'      => $v['piece_num']  ?? '',
                'ipn'           => $v['ipn']        ?? '',
                'conformite'    => $v['conformite'] ?? null,
                'commentaire'   => $v['commentaire']?? '',
                'cordons'       => json_decode($v['cordons']        ?? '{}', true) ?: (object)[],
                'retouches'     => json_decode($v['retouches']      ?? '{}', true) ?: (object)[],
                'sousEnsembles' => json_decode($v['sous_ensembles'] ?? '[]', true) ?: [],
            ] : ['status'=>'todo','pieceNum'=>'','ipn'=>'','conformite'=>null,'commentaire'=>'','cordons'=>(object)[],'retouches'=>(object)[],'sousEnsembles'=>[]];
        }
        $out[$of['of_id']] = [
            'id'          => $of['of_id'],
            'organeId'    => $of['organe_id'],
            'organeLabel' => $of['organe_label'],
            'projetId'    => $of['projet_id'],
            'projetLabel' => $of['projet_label'],
            'date'        => $of['of_date'],
            'ops'         => $ops,
            'opsList'     => $opsList,
        ];
    }
    return $out;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: liste tous les OFs ──────────────────────────────────────────────
if ($method === 'GET') {
    jsonOk(fetchAllOfs(getDB()));
}

// ── POST: crée un nouvel OF avec ses vérifications initiales ─────────────
if ($method === 'POST') {
    $b  = getBody();
    $db = getDB();

    $ofId = trim($b['id'] ?? '');
    if (!$ofId) jsonErr('id requis');

    $opsList = $b['opsList'] ?? [];
    $ops     = $b['ops']     ?? [];

    $db->prepare(
        "INSERT INTO ordres_fabrication (of_id,projet_id,projet_label,organe_id,organe_label,of_date,ops_list)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           projet_id=VALUES(projet_id), projet_label=VALUES(projet_label),
           organe_id=VALUES(organe_id), organe_label=VALUES(organe_label),
           of_date=VALUES(of_date), ops_list=VALUES(ops_list), updated_at=NOW()"
    )->execute([
        $ofId,
        $b['projetId']    ?? '', $b['projetLabel']  ?? '',
        $b['organeId']    ?? '', $b['organeLabel']   ?? '',
        $b['date']        ?? date('d/m/Y'),
        json_encode($opsList),
    ]);

    $ins = $db->prepare(
        "INSERT IGNORE INTO op_verifications (of_id,op_key,status,cordons,retouches,sous_ensembles)
         VALUES (?,?,'todo',?,?,?)"
    );
    foreach ($ops as $opKey => $opData) {
        $ins->execute([
            $ofId, $opKey,
            json_encode($opData['cordons']       ?? [], JSON_FORCE_OBJECT),
            json_encode($opData['retouches']     ?? [], JSON_FORCE_OBJECT),
            json_encode($opData['sousEnsembles'] ?? []),
        ]);
    }

    jsonOk(['ok' => true, 'id' => $ofId]);
}

// ── PATCH: upsert d'une vérification d'OP ───────────────────────────────
if ($method === 'PATCH') {
    $b  = getBody();
    $db = getDB();

    $ofId  = trim($b['ofId']  ?? '');
    $opKey = trim($b['opKey'] ?? '');
    if (!$ofId || !$opKey) jsonErr('ofId et opKey requis');

    $opData  = $b['opData']  ?? [];
    $opsList = $b['opsList'] ?? [];

    // Ensure OF row exists (using proper prepared statement)
    $stmt = $db->prepare("SELECT ops_list FROM ordres_fabrication WHERE of_id=?");
    $stmt->execute([$ofId]);
    $row = $stmt->fetch();

    if (!$row) {
        $db->prepare(
            "INSERT INTO ordres_fabrication (of_id,projet_id,projet_label,organe_id,organe_label,of_date,ops_list)
             VALUES (?,?,?,?,?,?,?)"
        )->execute([
            $ofId,
            $b['projetId'] ?? '', $b['projetLabel'] ?? '',
            $b['organeId'] ?? '', $b['organeLabel'] ?? '',
            $b['date']     ?? date('d/m/Y'),
            json_encode($opsList),
        ]);
    } else {
        $current = json_decode($row['ops_list'] ?? '[]', true) ?: [];
        if (!in_array($opKey, $current)) {
            $current[] = $opKey;
            $db->prepare("UPDATE ordres_fabrication SET ops_list=?,updated_at=NOW() WHERE of_id=?")
               ->execute([json_encode($current), $ofId]);
        }
    }

    // Upsert the OP verification
    $db->prepare(
        "INSERT INTO op_verifications (of_id,op_key,status,piece_num,ipn,conformite,commentaire,cordons,retouches,sous_ensembles)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           status=VALUES(status), piece_num=VALUES(piece_num), ipn=VALUES(ipn),
           conformite=VALUES(conformite), commentaire=VALUES(commentaire),
           cordons=VALUES(cordons), retouches=VALUES(retouches),
           sous_ensembles=VALUES(sous_ensembles), updated_at=NOW()"
    )->execute([
        $ofId, $opKey,
        $opData['status']      ?? 'todo',
        $opData['pieceNum']    ?? '',
        $opData['ipn']         ?? '',
        $opData['conformite']  ?? null,
        $opData['commentaire'] ?? '',
        json_encode($opData['cordons']       ?? [], JSON_FORCE_OBJECT),
        json_encode($opData['retouches']     ?? [], JSON_FORCE_OBJECT),
        json_encode($opData['sousEnsembles'] ?? []),
    ]);

    jsonOk(['ok' => true]);
}
