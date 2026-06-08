<?php
session_start();
require_once __DIR__ . '/db.php';
setCorsHeaders();

function defaultCevBarOps(): array {
    return [
        ['key'=>'OP 80',      'cordons'=>[260,261,262,263],                                                                    'sousEns'=>[], 'pieces'=>['Tôle latérale D','Tôle latérale G']],
        ['key'=>'OP 110',     'cordons'=>[100,101,102,103,164,165,166,167,168,169,22,23],                                      'sousEns'=>[['label'=>'OP 80']], 'pieces'=>['Longeron','Renfort avant']],
        ['key'=>'OP 140',     'cordons'=>[308,309,304,305,334,335,312,313,270,271],                                            'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 150',     'cordons'=>[30,31,32,33,350,351,36,37,38,39,365,352,353,10,11,14,15],                            'sousEns'=>[], 'pieces'=>['Traverse centrale']],
        ['key'=>'OP 210_1',   'cordons'=>[180,181,52,53,132,133,140,141,64,65,142,143,68,69,182,183,200,201,208,209,206,207],  'sousEns'=>[['label'=>'OP 110'],['label'=>'OP 140'],['label'=>'OP 150']], 'pieces'=>[]],
        ['key'=>'OP 210_2',   'cordons'=>[336,337,190,191,66,67,54,55,56,57,202,203],                                          'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 250_1',   'cordons'=>[74,75,72,73,76,77,78,79,80,81,90,91,92,93,42,43],                                   'sousEns'=>[['label'=>'OP 210']], 'pieces'=>['Platine','Gousset D','Gousset G']],
        ['key'=>'OP 250_2WS', 'cordons'=>[284,285,282,283,288,289,290,291,294,295],                                            'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 250_3',   'cordons'=>[], 'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_1',   'cordons'=>[58,59,50,51,16,17,12,13,34,35,238,239],                                             'sousEns'=>[['label'=>'OP 250']], 'pieces'=>[]],
        ['key'=>'OP 260_2',   'cordons'=>[20,21,82,83,314,315,70,71,292,293,122,123,126,127,120,121,124,125],                  'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_3',   'cordons'=>[280,281,176,173,174,40,41],                                                          'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_4',   'cordons'=>[302,303,306,307,300,301,162,163,310,311],                                            'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_5',   'cordons'=>[84,85,86,87,354,355,286,287,204,205],                                                'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_6',   'cordons'=>[338,339], 'sousEns'=>[], 'pieces'=>[]],
        ['key'=>'OP 260_7',   'cordons'=>[], 'sousEns'=>[], 'pieces'=>[]],
    ];
}

function defaultConfig(): array {
    $ops = defaultCevBarOps();
    return [
        'projets' => [
            ['id'=>'cev','label'=>'CEV','organes'=>[
                ['id'=>'cev-bar','label'=>'BAR','ops'=>$ops],
                ['id'=>'cev-bav','label'=>'BAV','ops'=>$ops],
            ]],
            ['id'=>'x82','label'=>'X82','organes'=>[
                ['id'=>'x82-tar','label'=>'TAR','ops'=>$ops],
                ['id'=>'x82-bav','label'=>'BAV','ops'=>$ops],
            ]],
        ],
        'managerIpns' => ['ADMIN','CHEF01','QUAL01'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db   = getDB();
    $rows = $db->query("SELECT cfg_key, cfg_value FROM app_config")->fetchAll();
    $stored = [];
    foreach ($rows as $r) $stored[$r['cfg_key']] = json_decode($r['cfg_value'], true);
    $def = defaultConfig();
    jsonOk([
        'projets'     => $stored['projets']      ?? $def['projets'],
        'managerIpns' => $stored['manager_ipns'] ?? $def['managerIpns'],
    ]);
}

if ($method === 'POST') {
    $body = getBody();
    $db   = getDB();
    $upsert = $db->prepare(
        "INSERT INTO app_config (cfg_key, cfg_value) VALUES (?,?)
         ON DUPLICATE KEY UPDATE cfg_value=VALUES(cfg_value), updated_at=NOW()"
    );
    if (array_key_exists('projets',     $body)) $upsert->execute(['projets',      json_encode($body['projets'],     JSON_UNESCAPED_UNICODE)]);
    if (array_key_exists('managerIpns', $body)) $upsert->execute(['manager_ipns', json_encode($body['managerIpns'], JSON_UNESCAPED_UNICODE)]);
    jsonOk(['ok' => true]);
}
