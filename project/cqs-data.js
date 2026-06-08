'use strict';

/* ─── Structure : Projet → Organe → OPs ─── */
const CEV_BAR_OPS = [
  { key:'OP 80',      cordons:[260,261,262,263],                                                                    sousEns:[], pieces:['Tôle latérale D','Tôle latérale G'] },
  { key:'OP 110',     cordons:[100,101,102,103,164,165,166,167,168,169,22,23],                                      sousEns:[{label:'OP 80'}], pieces:['Longeron','Renfort avant'] },
  { key:'OP 140',     cordons:[308,309,304,305,334,335,312,313,270,271],                                            sousEns:[] },
  { key:'OP 150',     cordons:[30,31,32,33,350,351,36,37,38,39,365,352,353,10,11,14,15],                            sousEns:[], pieces:['Traverse centrale'] },
  { key:'OP 210_1',   cordons:[180,181,52,53,132,133,140,141,64,65,142,143,68,69,182,183,200,201,208,209,206,207],  sousEns:[{label:'OP 110'},{label:'OP 140'},{label:'OP 150'}] },
  { key:'OP 210_2',   cordons:[336,337,190,191,66,67,54,55,56,57,202,203],                                          sousEns:[] },
  { key:'OP 250_1',   cordons:[74,75,72,73,76,77,78,79,80,81,90,91,92,93,42,43],                                   sousEns:[{label:'OP 210'}], pieces:['Platine','Gousset D','Gousset G'] },
  { key:'OP 250_2WS', cordons:[284,285,282,283,288,289,290,291,294,295],                                            sousEns:[] },
  { key:'OP 250_3',   cordons:[],                                                                                   sousEns:[] },
  { key:'OP 260_1',   cordons:[58,59,50,51,16,17,12,13,34,35,238,239],                                             sousEns:[{label:'OP 250'}] },
  { key:'OP 260_2',   cordons:[20,21,82,83,314,315,70,71,292,293,122,123,126,127,120,121,124,125],                  sousEns:[] },
  { key:'OP 260_3',   cordons:[280,281,176,173,174,40,41],                                                          sousEns:[] },
  { key:'OP 260_4',   cordons:[302,303,306,307,300,301,162,163,310,311],                                            sousEns:[] },
  { key:'OP 260_5',   cordons:[84,85,86,87,354,355,286,287,204,205],                                                sousEns:[] },
  { key:'OP 260_6',   cordons:[338,339],                                                                            sousEns:[] },
  { key:'OP 260_7',   cordons:[],                                                                                   sousEns:[] },
];

const DEFAULT_CONFIG = {
  projets: [
    {
      id: 'cev', label: 'CEV',
      organes: [
        { id: 'cev-bar', label: 'BAR', ops: CEV_BAR_OPS },
        { id: 'cev-bav', label: 'BAV', ops: JSON.parse(JSON.stringify(CEV_BAR_OPS)) },
      ],
    },
    {
      id: 'x82', label: 'X82',
      organes: [
        { id: 'x82-tar', label: 'TAR', ops: JSON.parse(JSON.stringify(CEV_BAR_OPS)) },
        { id: 'x82-bav', label: 'BAV', ops: JSON.parse(JSON.stringify(CEV_BAR_OPS)) },
      ],
    },
  ],
  managerIpns: ['ADMIN', 'CHEF01', 'QUAL01'],
};

function loadConfig() {
  try {
    const s = localStorage.getItem('cqs_config_v2');
    if (!s) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    const cfg = JSON.parse(s);
    // Migration : backfill ops vides depuis DEFAULT_CONFIG
    (cfg.projets || []).forEach(proj => {
      (proj.organes || []).forEach(org => {
        if (!org.ops || org.ops.length === 0) {
          const defProj = DEFAULT_CONFIG.projets.find(p => p.id === proj.id);
          const defOrg  = defProj?.organes.find(o => o.id === org.id);
          if (defOrg && defOrg.ops.length > 0) {
            org.ops = JSON.parse(JSON.stringify(defOrg.ops));
          } else {
            // Fallback : copier CEV BAR
            org.ops = JSON.parse(JSON.stringify(CEV_BAR_OPS));
          }
        }
        // Backfill pièces manquantes depuis la config par défaut (par clé d'OP)
        const dProj = DEFAULT_CONFIG.projets.find(p => p.id === proj.id);
        const dOrg  = dProj?.organes.find(o => o.id === org.id);
        (org.ops || []).forEach(op => {
          if (op.pieces === undefined) {
            const dOp = (dOrg?.ops || CEV_BAR_OPS).find(d => d.key === op.key);
            op.pieces = dOp?.pieces ? [...dOp.pieces] : [];
          }
        });
      });
    });
    return cfg;
  } catch { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
}

function saveConfig(cfg) {
  try { localStorage.setItem('cqs_config_v2', JSON.stringify(cfg)); } catch {}
}

/* ─── Helpers ─── */
function findOrgane(config, organeId) {
  for (const p of (config.projets || [])) {
    const o = p.organes.find(o => o.id === organeId);
    if (o) return { projet: p, organe: o };
  }
  return null;
}

function makeEmptyOp(opDef) {
  const cordons = {};
  (opDef.cordons || []).forEach(c => { cordons[c] = 'ok'; });
  return {
    status: 'todo', pieceNum: '', ipn: '',
    sousEnsembles: (opDef.sousEns || []).map(se => ({ ...se, numD:'', numG:'', retoucheD:false, retoucheG:false })),
    cordons, retouches: {}, conformite: null, commentaire: '',
  };
}

function makeEmptyOF(id, organeId, cfg) {
  const config = cfg || loadConfig();
  const found  = findOrgane(config, organeId) || findOrgane(config, config.projets?.[0]?.organes?.[0]?.id);
  const projet = found?.projet || config.projets?.[0] || { id:'?', label:'?' };
  const organe = found?.organe || projet.organes?.[0] || { id:'?', label:'?', ops:[] };

  const ops = {};
  (organe.ops || []).forEach(opDef => { ops[opDef.key] = makeEmptyOp(opDef); });
  return {
    id, organeId: organe.id, organeLabel: organe.label,
    projetId: projet.id, projetLabel: projet.label,
    date: new Date().toLocaleDateString('fr-FR'),
    ops, opsList: (organe.ops || []).map(o => o.key),
  };
}

function makeDemoData(cfg) {
  const config = cfg || loadConfig();

  // Hydrate un OF selon un "profil" d'avancement
  // profile: { doneRatio, nokKeys: [opKey], inprogKey, todoFrom } — sinon répartition auto
  function hydrate(of, organe, seed) {
    const opDefs = organe.ops || [];
    const ops = of.ops;
    const ipns = ['OPER01', 'OPER02', 'OPER03', 'SOUD04'];
    let n = seed;
    opDefs.forEach((opDef, idx) => {
      const op = ops[opDef.key];
      if (!op) return;
      // Position relative pour décider du statut
      const frac = opDefs.length > 1 ? idx / (opDefs.length - 1) : 0;
      const cut = ((seed * 7 + 3) % 5) / 6 + 0.25;  // 0.25..0.92 selon seed
      const pieceBase = of.id.split('-')[1] || '001';
      const ipn = ipns[(idx + seed) % ipns.length];
      const cordonNums = opDef.cordons || [];

      if (cordonNums.length === 0) {
        // Pas de cordons → laisser à faire
        return;
      }

      if (frac < cut - 0.18) {
        // Terminé conforme
        const c = {}; cordonNums.forEach(cn => { c[cn] = 'ok'; });
        ops[opDef.key] = { ...op, status:'done', pieceNum:`${pieceBase}-D-${String(idx+1).padStart(3,'0')}`, ipn, cordons:c, conformite:'conforme' };
      } else if (frac < cut - 0.06) {
        // Terminé avec retouche (nok)
        const c = {}; cordonNums.forEach((cn,i) => { c[cn] = (i === 1 % cordonNums.length) ? 'nok' : 'ok'; });
        const badCordon = cordonNums[1 % cordonNums.length];
        ops[opDef.key] = { ...op, status:'nok', pieceNum:`${pieceBase}-D-${String(idx+1).padStart(3,'0')}`, ipn, cordons:c, retouches:{ [badCordon]:true }, conformite:'non-conforme', commentaire:`C${badCordon} retouché.` };
      } else if (frac < cut + 0.02) {
        // En cours
        ops[opDef.key] = { ...op, status:'inprogress', pieceNum:`${pieceBase}-D-${String(idx+1).padStart(3,'0')}`, ipn };
      }
      // sinon : reste 'todo'
      n++;
    });
    return of;
  }

  const out = {};
  let serial = 84;
  let seed = 1;

  (config.projets || []).forEach(projet => {
    (projet.organes || []).forEach(organe => {
      // 3 OF par couple projet/organe, à des stades différents
      const count = 3;
      for (let k = 0; k < count; k++) {
        const ofId = `2024-${String(serial++).padStart(3,'0')}`;
        const of = makeEmptyOF(ofId, organe.id, config);
        // dates décroissantes pour varier
        const d = new Date(2024, 8, 2 + (seed * 3) % 25);
        of.date = d.toLocaleDateString('fr-FR');
        hydrate(of, organe, seed);
        out[ofId] = of;
        seed++;
      }
    });
  });

  return out;
}

// rétro-compat
const OPS_LIST = CEV_BAR_OPS.map(o => o.key);

Object.assign(window, {
  DEFAULT_CONFIG, loadConfig, saveConfig, findOrgane,
  makeEmptyOp, makeEmptyOF, makeDemoData, OPS_LIST,
});
