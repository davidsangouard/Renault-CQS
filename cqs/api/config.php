<?php
// config.php — Gestion normalisée de la configuration
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

// ─── Construit la structure config attendue par le frontend ──────────────────
function buildConfig(PDO $db): array {
    $projets = $db->query("SELECT id, code, label FROM projets ORDER BY sort_order, id")->fetchAll();
    $organes = $db->query("SELECT id, projet_id, code, label FROM organes ORDER BY sort_order, id")->fetchAll();

    // Operations avec cordons, pièces et sous-ensembles agrégés
    $opsRaw = $db->query("
        SELECT
            op.id,
            op.organe_id,
            op.op_key,
            GROUP_CONCAT(DISTINCT c.numero          ORDER BY c.sort_order,  c.numero  SEPARATOR ',')   AS cordons_csv,
            GROUP_CONCAT(DISTINCT p.label           ORDER BY p.sort_order,  p.id      SEPARATOR '|||') AS pieces_csv,
            GROUP_CONCAT(DISTINCT se.ref_label      ORDER BY se.sort_order, se.id     SEPARATOR '|||') AS se_csv
        FROM operations op
        LEFT JOIN cordons           c  ON c.operation_id  = op.id
        LEFT JOIN pieces            p  ON p.operation_id  = op.id
        LEFT JOIN op_sous_ensembles se ON se.operation_id = op.id
        GROUP BY op.id
        ORDER BY op.organe_id, op.sort_order, op.id
    ")->fetchAll();

    $managerIpns = $db->query(
        "SELECT ipn FROM ipns WHERE is_manager = 1 ORDER BY id"
    )->fetchAll(PDO::FETCH_COLUMN);

    // Index ops par organe_id
    $opsByOrgane = [];
    foreach ($opsRaw as $row) {
        $cordons = $row['cordons_csv']
            ? array_map('intval', explode(',', $row['cordons_csv']))
            : [];

        $pieces = [];
        if ($row['pieces_csv']) {
            foreach (explode('|||', $row['pieces_csv']) as $lbl) {
                if ($lbl !== '') $pieces[] = $lbl;
            }
        }

        $sousEns = [];
        if ($row['se_csv']) {
            foreach (explode('|||', $row['se_csv']) as $lbl) {
                if ($lbl !== '') $sousEns[] = ['label' => $lbl];
            }
        }

        $opsByOrgane[$row['organe_id']][] = [
            'key'     => $row['op_key'],
            'cordons' => $cordons,
            'sousEns' => $sousEns,
            'pieces'  => $pieces,
        ];
    }

    // Index organes par projet_id
    $orgByProjet = [];
    foreach ($organes as $org) {
        $orgByProjet[$org['projet_id']][] = [
            'id'     => $org['code'],
            'label'  => $org['label'],
            'ops'    => $opsByOrgane[$org['id']] ?? [],
        ];
    }

    $result = [];
    foreach ($projets as $proj) {
        $result[] = [
            'id'      => $proj['code'],
            'label'   => $proj['label'],
            'organes' => $orgByProjet[$proj['id']] ?? [],
        ];
    }

    return ['projets' => $result, 'managerIpns' => array_values($managerIpns)];
}

// ─── Synchronisation config → tables normalisées ─────────────────────────────
function syncConfig(PDO $db, array $body): void {
    $db->beginTransaction();
    try {
        if (isset($body['projets']))     syncProjets($db, $body['projets']);
        if (isset($body['managerIpns'])) syncManagerIpns($db, $body['managerIpns']);
        $db->commit();
    } catch (\Throwable $e) {
        $db->rollBack();
        throw $e;
    }
}

function syncProjets(PDO $db, array $projets): void {
    $upsProj = $db->prepare(
        "INSERT INTO projets (code, label, sort_order) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE label=VALUES(label), sort_order=VALUES(sort_order)"
    );
    $getProj = $db->prepare("SELECT id FROM projets WHERE code=?");

    foreach ($projets as $i => $proj) {
        $upsProj->execute([$proj['id'], $proj['label'], $i]);
        $getProj->execute([$proj['id']]);
        $projId = $getProj->fetchColumn();
        if ($projId) syncOrganes($db, $projId, $proj['organes'] ?? []);
    }
}

function syncOrganes(PDO $db, int $projId, array $organes): void {
    $upsOrg = $db->prepare(
        "INSERT INTO organes (projet_id, code, label, sort_order) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE label=VALUES(label), sort_order=VALUES(sort_order)"
    );
    $getOrg = $db->prepare("SELECT id FROM organes WHERE projet_id=? AND code=?");

    $orgCodes = [];
    foreach ($organes as $j => $org) {
        $orgCodes[] = $org['id'];
        $upsOrg->execute([$projId, $org['id'], $org['label'], $j]);
        $getOrg->execute([$projId, $org['id']]);
        $orgId = $getOrg->fetchColumn();
        if ($orgId) syncOpsForOrgane($db, $orgId, $org['ops'] ?? []);
    }

    // Supprime les organes retirés (seulement si aucun OF attaché)
    if (!empty($orgCodes)) {
        $ph  = implode(',', array_fill(0, count($orgCodes), '?'));
        $del = $db->prepare("
            SELECT o.id FROM organes o
            WHERE o.projet_id = ? AND o.code NOT IN ($ph)
            AND NOT EXISTS (SELECT 1 FROM ordres_fabrication f WHERE f.organe_id = o.id)
        ");
        $del->execute(array_merge([$projId], $orgCodes));
        foreach ($del->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $db->prepare("DELETE FROM organes WHERE id=?")->execute([$id]);
        }
    }
}

function syncOpsForOrgane(PDO $db, int $orgId, array $ops): void {
    $upsOp = $db->prepare(
        "INSERT INTO operations (organe_id, op_key, sort_order) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE op_key=VALUES(op_key), sort_order=VALUES(sort_order)"
    );
    $getOp = $db->prepare("SELECT id FROM operations WHERE organe_id=? AND op_key=?");

    $opKeys = [];
    foreach ($ops as $i => $def) {
        $opKeys[] = $def['key'];
        $upsOp->execute([$orgId, $def['key'], $i]);
        $getOp->execute([$orgId, $def['key']]);
        $opId = $getOp->fetchColumn();
        if (!$opId) continue;
        syncCordons($db, $opId, $def['cordons'] ?? []);
        syncPieces($db, $opId, $def['pieces']   ?? []);
        syncSousEns($db, $opId, $def['sousEns'] ?? []);
    }

    // Supprime les ops retirées (seulement si aucune vérification)
    if (!empty($opKeys)) {
        $ph  = implode(',', array_fill(0, count($opKeys), '?'));
        $del = $db->prepare("
            SELECT op.id FROM operations op
            WHERE op.organe_id = ? AND op.op_key NOT IN ($ph)
            AND NOT EXISTS (SELECT 1 FROM op_verifications ov WHERE ov.operation_id = op.id)
        ");
        $del->execute(array_merge([$orgId], $opKeys));
        foreach ($del->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $db->prepare("DELETE FROM operations WHERE id=?")->execute([$id]);
        }
    }
}

function syncCordons(PDO $db, int $opId, array $nums): void {
    $ins = $db->prepare("INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES (?,?,?)");
    foreach ($nums as $i => $num) $ins->execute([$opId, (int)$num, $i]);

    // Supprime les cordons retirés (seulement si aucune vérification)
    if (!empty($nums)) {
        $ph  = implode(',', array_fill(0, count($nums), '?'));
        $del = $db->prepare("
            SELECT c.id FROM cordons c
            WHERE c.operation_id = ? AND c.numero NOT IN ($ph)
            AND NOT EXISTS (SELECT 1 FROM cordon_verifications cv WHERE cv.cordon_id = c.id)
        ");
        $del->execute(array_merge([$opId], $nums));
    } else {
        $del = $db->prepare("
            SELECT c.id FROM cordons c
            WHERE c.operation_id = ?
            AND NOT EXISTS (SELECT 1 FROM cordon_verifications cv WHERE cv.cordon_id = c.id)
        ");
        $del->execute([$opId]);
    }
    foreach ($del->fetchAll(PDO::FETCH_COLUMN) as $id) {
        $db->prepare("DELETE FROM cordons WHERE id=?")->execute([$id]);
    }
}

function syncPieces(PDO $db, int $opId, array $labels): void {
    $cur = $db->prepare("SELECT id, label FROM pieces WHERE operation_id=?");
    $cur->execute([$opId]);
    $existing = $cur->fetchAll();
    $existingLabels = array_column($existing, 'label');

    foreach ($existing as $row) {
        if (!in_array($row['label'], $labels, true)) {
            $db->prepare("DELETE FROM pieces WHERE id=?")->execute([$row['id']]);
        }
    }
    $ins = $db->prepare("INSERT IGNORE INTO pieces (operation_id, label, sort_order) VALUES (?,?,?)");
    $upd = $db->prepare("UPDATE pieces SET sort_order=? WHERE operation_id=? AND label=?");
    foreach ($labels as $i => $lbl) {
        if (!in_array($lbl, $existingLabels, true)) $ins->execute([$opId, $lbl, $i]);
        else                                         $upd->execute([$i, $opId, $lbl]);
    }
}

function syncSousEns(PDO $db, int $opId, array $sousEns): void {
    $labels  = array_column($sousEns, 'label');
    $cur     = $db->prepare("SELECT id, ref_label FROM op_sous_ensembles WHERE operation_id=?");
    $cur->execute([$opId]);
    $existing       = $cur->fetchAll();
    $existingLabels = array_column($existing, 'ref_label');

    foreach ($existing as $row) {
        if (!in_array($row['ref_label'], $labels, true)) {
            $hasVerif = $db->prepare("SELECT 1 FROM sous_ensemble_verifications WHERE sous_ensemble_id=?");
            $hasVerif->execute([$row['id']]);
            if (!$hasVerif->fetch()) {
                $db->prepare("DELETE FROM op_sous_ensembles WHERE id=?")->execute([$row['id']]);
            }
        }
    }
    $ins = $db->prepare("INSERT IGNORE INTO op_sous_ensembles (operation_id, ref_label, sort_order) VALUES (?,?,?)");
    foreach ($sousEns as $i => $se) {
        if (!in_array($se['label'], $existingLabels, true)) $ins->execute([$opId, $se['label'], $i]);
    }
}

function syncManagerIpns(PDO $db, array $ipns): void {
    $db->query("UPDATE ipns SET is_manager = 0");
    $upsert = $db->prepare(
        "INSERT INTO ipns (ipn, is_manager) VALUES (?,1)
         ON DUPLICATE KEY UPDATE is_manager=1"
    );
    foreach ($ipns as $ipn) {
        $clean = strtoupper(trim((string)$ipn));
        if ($clean !== '') $upsert->execute([$clean]);
    }
}

// ─── Routing ─────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    jsonOk(buildConfig(getDB()));
}

if ($method === 'POST') {
    $db   = getDB();
    $body = getBody();
    syncConfig($db, $body);
    jsonOk(buildConfig($db));
}
