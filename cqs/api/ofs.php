<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

function fetchAllOfs(PDO $db): array {
    $ofs = $db->query("
        SELECT
            f.of_number,
            f.of_date,
            o.id    AS organe_db_id,
            o.code  AS organe_code,
            o.label AS organe_label,
            p.code  AS projet_code,
            p.label AS projet_label
        FROM ordres_fabrication f
        JOIN organes o ON o.id = f.organe_id
        JOIN projets p ON p.id = o.projet_id
        ORDER BY f.created_at DESC
    ")->fetchAll();

    if (empty($ofs)) return [];

    // All operations ordered per organe
    $opsRows = $db->query("
        SELECT id, organe_id, op_key
        FROM operations
        ORDER BY organe_id, sort_order, id
    ")->fetchAll();
    $opsByOrgane = [];
    foreach ($opsRows as $op) {
        $opsByOrgane[(int)$op['organe_id']][] = ['id' => (int)$op['id'], 'key' => $op['op_key']];
    }

    // All op_verifications indexed by of_number + operation_id
    $verifs = $db->query("
        SELECT id, of_number, operation_id, status, piece_num, ipn, conformite, commentaire
        FROM op_verifications
    ")->fetchAll();
    $verifsByOf = [];
    foreach ($verifs as $v) {
        $verifsByOf[$v['of_number']][(int)$v['operation_id']] = $v;
    }

    // All cordon_verifications indexed by op_verif_id
    $cvRows = $db->query("
        SELECT cv.op_verif_id, c.numero, cv.statut, cv.retouche
        FROM cordon_verifications cv
        JOIN cordons c ON c.id = cv.cordon_id
    ")->fetchAll();
    $cvsByVerif = [];
    foreach ($cvRows as $cv) {
        $cvsByVerif[(int)$cv['op_verif_id']][] = $cv;
    }

    // All sous_ensemble_verifications indexed by op_verif_id
    $sevRows = $db->query("
        SELECT sev.op_verif_id, se.ref_label, sev.num_d, sev.num_g, sev.retouche_d, sev.retouche_g
        FROM sous_ensemble_verifications sev
        JOIN op_sous_ensembles se ON se.id = sev.sous_ensemble_id
        ORDER BY se.sort_order, se.id
    ")->fetchAll();
    $sevsByVerif = [];
    foreach ($sevRows as $sev) {
        $sevsByVerif[(int)$sev['op_verif_id']][] = $sev;
    }

    $out = [];
    foreach ($ofs as $of) {
        $orgOps  = $opsByOrgane[(int)$of['organe_db_id']] ?? [];
        $opsList = array_column($orgOps, 'key');
        $opsData = [];

        foreach ($orgOps as $opDef) {
            $opId  = $opDef['id'];
            $opKey = $opDef['key'];
            $verif = $verifsByOf[$of['of_number']][$opId] ?? null;

            if ($verif) {
                $ovId      = (int)$verif['id'];
                $cordons   = [];
                $retouches = [];
                foreach ($cvsByVerif[$ovId] ?? [] as $cv) {
                    $num = (string)$cv['numero'];
                    $cordons[$num] = $cv['statut'];
                    if ($cv['retouche']) $retouches[$num] = true;
                }
                $seList = [];
                foreach ($sevsByVerif[$ovId] ?? [] as $sev) {
                    $seList[] = [
                        'label'     => $sev['ref_label'],
                        'numD'      => $sev['num_d']      ?? '',
                        'numG'      => $sev['num_g']      ?? '',
                        'retoucheD' => (bool)$sev['retouche_d'],
                        'retoucheG' => (bool)$sev['retouche_g'],
                    ];
                }
                $opsData[$opKey] = [
                    'status'        => $verif['status']      ?? 'todo',
                    'pieceNum'      => $verif['piece_num']   ?? '',
                    'ipn'           => $verif['ipn']         ?? '',
                    'conformite'    => $verif['conformite']  ?? null,
                    'commentaire'   => $verif['commentaire'] ?? '',
                    'cordons'       => (object)$cordons,
                    'retouches'     => (object)$retouches,
                    'sousEnsembles' => $seList,
                ];
            } else {
                $opsData[$opKey] = [
                    'status'        => 'todo',
                    'pieceNum'      => '',
                    'ipn'           => '',
                    'conformite'    => null,
                    'commentaire'   => '',
                    'cordons'       => (object)[],
                    'retouches'     => (object)[],
                    'sousEnsembles' => [],
                ];
            }
        }

        $out[$of['of_number']] = [
            'id'          => $of['of_number'],
            'organeId'    => $of['organe_code'],
            'organeLabel' => $of['organe_label'],
            'projetId'    => $of['projet_code'],
            'projetLabel' => $of['projet_label'],
            'date'        => $of['of_date'],
            'ops'         => $opsData,
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

// ── POST: crée un nouvel OF (+ vérifications initiales si fournies) ─────────
if ($method === 'POST') {
    $b  = getBody();
    $db = getDB();

    $ofNumber = trim($b['id'] ?? '');
    if (!$ofNumber) jsonErr('id requis');

    $stmt = $db->prepare("SELECT id FROM organes WHERE code=?");
    $stmt->execute([$b['organeId'] ?? '']);
    $orgId = $stmt->fetchColumn();
    if (!$orgId) jsonErr('Organe introuvable: ' . ($b['organeId'] ?? ''));

    $db->prepare(
        "INSERT INTO ordres_fabrication (of_number, organe_id, of_date)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE organe_id=VALUES(organe_id), of_date=VALUES(of_date), updated_at=NOW()"
    )->execute([$ofNumber, (int)$orgId, $b['date'] ?? date('d/m/Y')]);

    // Persist any non-todo verifications (e.g. demo data seeding)
    foreach ($b['ops'] ?? [] as $opKey => $opData) {
        if (($opData['status'] ?? 'todo') === 'todo') continue;

        $stOp = $db->prepare("SELECT id FROM operations WHERE organe_id=? AND op_key=?");
        $stOp->execute([(int)$orgId, $opKey]);
        $opId = $stOp->fetchColumn();
        if (!$opId) continue;

        $db->prepare(
            "INSERT INTO op_verifications (of_number, operation_id, status, piece_num, ipn, conformite, commentaire)
             VALUES (?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               status=VALUES(status), piece_num=VALUES(piece_num), ipn=VALUES(ipn),
               conformite=VALUES(conformite), commentaire=VALUES(commentaire), updated_at=NOW()"
        )->execute([
            $ofNumber, $opId,
            $opData['status']      ?? 'todo',
            $opData['pieceNum']    ?? '',
            $opData['ipn']         ?? '',
            $opData['conformite']  ?? null,
            $opData['commentaire'] ?? '',
        ]);

        $stOv = $db->prepare("SELECT id FROM op_verifications WHERE of_number=? AND operation_id=?");
        $stOv->execute([$ofNumber, $opId]);
        $ovId = (int)$stOv->fetchColumn();

        $cordons   = $opData['cordons']   ?? [];
        $retouches = $opData['retouches'] ?? [];
        if (!empty($cordons)) {
            $insCv = $db->prepare(
                "INSERT INTO cordon_verifications (op_verif_id, cordon_id, statut, retouche)
                 SELECT ?, c.id, ?, ?
                 FROM cordons c WHERE c.operation_id = ? AND c.numero = ?"
            );
            foreach ($cordons as $num => $statut) {
                $insCv->execute([$ovId, $statut, !empty($retouches[(string)$num]) ? 1 : 0, $opId, (int)$num]);
            }
        }

        $seList = $opData['sousEnsembles'] ?? [];
        if (!empty($seList)) {
            $insSev = $db->prepare(
                "INSERT INTO sous_ensemble_verifications
                   (op_verif_id, sous_ensemble_id, num_d, num_g, retouche_d, retouche_g)
                 SELECT ?, se.id, ?, ?, ?, ?
                 FROM op_sous_ensembles se WHERE se.operation_id = ? AND se.ref_label = ?"
            );
            foreach ($seList as $se) {
                $insSev->execute([
                    $ovId,
                    $se['numD'] ?? '', $se['numG'] ?? '',
                    !empty($se['retoucheD']) ? 1 : 0,
                    !empty($se['retoucheG']) ? 1 : 0,
                    $opId, $se['label'] ?? '',
                ]);
            }
        }
    }

    jsonOk(['ok' => true, 'id' => $ofNumber]);
}

// ── PATCH: upsert d'une vérification d'OP ───────────────────────────────
if ($method === 'PATCH') {
    $b  = getBody();
    $db = getDB();

    $ofNumber = trim($b['ofId']  ?? '');
    $opKey    = trim($b['opKey'] ?? '');
    if (!$ofNumber || !$opKey) jsonErr('ofId et opKey requis');

    $opData = $b['opData'] ?? [];

    // Ensure OF row exists
    $stmt = $db->prepare("SELECT organe_id FROM ordres_fabrication WHERE of_number=?");
    $stmt->execute([$ofNumber]);
    $ofRow = $stmt->fetch();

    if (!$ofRow) {
        $stmt2 = $db->prepare("SELECT id FROM organes WHERE code=?");
        $stmt2->execute([$b['organeId'] ?? '']);
        $orgId = $stmt2->fetchColumn();
        if (!$orgId) jsonErr('Organe introuvable: ' . ($b['organeId'] ?? ''));

        $db->prepare(
            "INSERT INTO ordres_fabrication (of_number, organe_id, of_date) VALUES (?,?,?)"
        )->execute([$ofNumber, $orgId, $b['date'] ?? date('d/m/Y')]);

        $dbOrganeId = (int)$orgId;
    } else {
        $dbOrganeId = (int)$ofRow['organe_id'];
    }

    // Find operation_id
    $stmt = $db->prepare("SELECT id FROM operations WHERE organe_id=? AND op_key=?");
    $stmt->execute([$dbOrganeId, $opKey]);
    $opId = $stmt->fetchColumn();
    if (!$opId) jsonErr('Opération introuvable: ' . $opKey);

    // Upsert op_verification
    $db->prepare(
        "INSERT INTO op_verifications (of_number, operation_id, status, piece_num, ipn, conformite, commentaire)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           status=VALUES(status), piece_num=VALUES(piece_num), ipn=VALUES(ipn),
           conformite=VALUES(conformite), commentaire=VALUES(commentaire), updated_at=NOW()"
    )->execute([
        $ofNumber, $opId,
        $opData['status']      ?? 'todo',
        $opData['pieceNum']    ?? '',
        $opData['ipn']         ?? '',
        $opData['conformite']  ?? null,
        $opData['commentaire'] ?? '',
    ]);

    $stmt = $db->prepare("SELECT id FROM op_verifications WHERE of_number=? AND operation_id=?");
    $stmt->execute([$ofNumber, $opId]);
    $ovId = (int)$stmt->fetchColumn();

    // Replace cordon verifications
    $db->prepare("DELETE FROM cordon_verifications WHERE op_verif_id=?")->execute([$ovId]);
    $cordons   = $opData['cordons']   ?? [];
    $retouches = $opData['retouches'] ?? [];
    if (!empty($cordons)) {
        $insCv = $db->prepare(
            "INSERT INTO cordon_verifications (op_verif_id, cordon_id, statut, retouche)
             SELECT ?, c.id, ?, ?
             FROM cordons c
             WHERE c.operation_id = ? AND c.numero = ?"
        );
        foreach ($cordons as $num => $statut) {
            $retouche = !empty($retouches[(string)$num]) ? 1 : 0;
            $insCv->execute([$ovId, $statut, $retouche, $opId, (int)$num]);
        }
    }

    // Replace sous_ensemble verifications
    $db->prepare("DELETE FROM sous_ensemble_verifications WHERE op_verif_id=?")->execute([$ovId]);
    $seList = $opData['sousEnsembles'] ?? [];
    if (!empty($seList)) {
        $insSev = $db->prepare(
            "INSERT INTO sous_ensemble_verifications
               (op_verif_id, sous_ensemble_id, num_d, num_g, retouche_d, retouche_g)
             SELECT ?, se.id, ?, ?, ?, ?
             FROM op_sous_ensembles se
             WHERE se.operation_id = ? AND se.ref_label = ?"
        );
        foreach ($seList as $se) {
            $insSev->execute([
                $ovId,
                $se['numD']      ?? '',
                $se['numG']      ?? '',
                !empty($se['retoucheD']) ? 1 : 0,
                !empty($se['retoucheG']) ? 1 : 0,
                $opId,
                $se['label']     ?? '',
            ]);
        }
    }

    jsonOk(['ok' => true]);
}
