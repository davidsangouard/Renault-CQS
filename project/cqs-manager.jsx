// cqs-manager.jsx — Page Manager (accès restreint par IPN)

/* ─── Confirmation de suppression (partagée) ─── */
let _confirmFn = null;
function requestConfirm(opts) { if (_confirmFn) _confirmFn(opts); }

function ConfirmModal({ title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:16, maxWidth:380, width:'100%',
        padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="trash" size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#1f2937' }}>{title}</div>
        </div>
        <div style={{ fontSize:14, color:'#6b7280', lineHeight:1.5, marginBottom:20 }}>{message}</div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="secondary" onClick={onCancel} extraStyle={{ flex:1, minHeight:46 }}>Annuler</Btn>
          <button onClick={onConfirm} style={{
            flex:1, minHeight:46, border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit',
            background:'#dc2626', color:'#fff', fontSize:15, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            <Icon name="trash" size={16} color="#fff" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagerLogin({ config, onLogin, onBack }) {
  const [ipn, setIpn] = React.useState('');
  const [error, setError] = React.useState('');
  function tryLogin() {
    const ok = (config.managerIpns || []).map(i => i.toUpperCase());
    if (ok.includes(ipn.trim().toUpperCase())) onLogin(ipn.trim().toUpperCase());
    else setError('IPN non autorisé — accès refusé');
  }
  return (
    <>
      <AppHeader title="Accès Manager" onBack={onBack} />
      <Page>
        <Card extraStyle={{ marginTop:24, padding:'32px 20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20, alignItems:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#f4f3ef', border:'2px solid #e5e3de', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="lock" size={30} color="var(--accent,#1e3a5f)" />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:19, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>Zone Manager</div>
              <div style={{ fontSize:14, color:'#6b7280', marginTop:5 }}>Entrez votre IPN pour accéder à la configuration</div>
            </div>
            <div style={{ width:'100%' }}>
              <FieldInput label="IPN Manager" value={ipn} onChange={v => { setIpn(v.toUpperCase()); setError(''); }} placeholder="ex : CHEF01" />
              {error && (
                <div style={{ marginTop:8, background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 12px', color:'#dc2626', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  <Icon name="x" size={15} color="#dc2626" /> {error}
                </div>
              )}
            </div>
            <Btn variant="primary" onClick={tryLogin} disabled={!ipn.trim()} full>
              <Icon name="logIn" size={18} color="#fff" /> Accéder
            </Btn>
          </div>
        </Card>
      </Page>
    </>
  );
}

/* ─── Onglet Projets & Organes ─── */
function ProjetsManager({ config, onSave }) {
  const [projets, setProjets] = React.useState(() => JSON.parse(JSON.stringify(config.projets || [])));
  const [newProjetLabel, setNewProjetLabel] = React.useState('');
  const [editProjetId, setEditProjetId] = React.useState(null);
  const [newOrgane, setNewOrgane] = React.useState({});   // { [projetId]: label }

  function updateProjetLabel(id, label) {
    setProjets(p => p.map(pr => pr.id === id ? { ...pr, label } : pr));
  }
  // Persiste immédiatement (utilisé par les suppressions)
  function commit(next) { setProjets(next); onSave({ ...config, projets: next }); }
  function deleteProjet(id) {
    if (projets.length <= 1) return;
    commit(projets.filter(pr => pr.id !== id));
  }
  function addProjet() {
    const label = newProjetLabel.trim(); if (!label) return;
    const id = 'p-' + Date.now();
    setProjets(p => [...p, { id, label, organes:[] }]);
    setNewProjetLabel('');
  }
  function addOrgane(projetId) {
    const label = (newOrgane[projetId] || '').trim(); if (!label) return;
    const id = projetId + '-' + label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    setProjets(p => p.map(pr => pr.id !== projetId ? pr : {
      ...pr, organes: [...pr.organes, { id, label, ops:[] }]
    }));
    setNewOrgane(n => ({ ...n, [projetId]: '' }));
  }
  function deleteOrgane(projetId, organeId) {
    commit(projets.map(pr => pr.id !== projetId ? pr : {
      ...pr, organes: pr.organes.filter(o => o.id !== organeId)
    }));
  }
  function updateOrganeLabel(projetId, organeId, label) {
    setProjets(p => p.map(pr => pr.id !== projetId ? pr : {
      ...pr, organes: pr.organes.map(o => o.id !== organeId ? o : { ...o, label })
    }));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {projets.map(pr => (
        <Card key={pr.id} extraStyle={{ padding:'16px' }}>
          {/* Projet header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            {editProjetId === pr.id ? (
              <input value={pr.label} onChange={e => updateProjetLabel(pr.id, e.target.value)} autoFocus
                style={{ flex:1, border:'1.5px solid var(--accent,#1e3a5f)', borderRadius:8, padding:'7px 12px', fontSize:17, fontFamily:'inherit', outline:'none', fontWeight:800 }} />
            ) : (
              <span style={{ flex:1, fontSize:18, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>{pr.label}</span>
            )}
            <button onClick={() => setEditProjetId(editProjetId===pr.id ? null : pr.id)} style={{ background:'#f4f3ef', border:'1.5px solid #e5e3de', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={editProjetId===pr.id ? 'check' : 'pencil'} size={15} color={editProjetId===pr.id ? '#16a34a' : '#6b7280'} />
            </button>
            {projets.length > 1 && (
              <button onClick={() => requestConfirm({
                title:'Supprimer le projet',
                message:`Supprimer le projet « ${pr.label} » et tous ses organes et opérations ? Cette action est irréversible.`,
                onConfirm: () => deleteProjet(pr.id),
              })} style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="trash" size={15} color="#dc2626" />
              </button>
            )}
          </div>
          {/* Organes */}
          <div style={{ paddingLeft:8, borderLeft:'2px solid #e5e3de', display:'flex', flexDirection:'column', gap:8 }}>
            {(pr.organes || []).map(org => (
              <OrganeRow key={org.id} organe={org}
                onLabelChange={label => updateOrganeLabel(pr.id, org.id, label)}
                onDelete={() => requestConfirm({
                  title:'Supprimer l\'organe',
                  message:`Supprimer l'organe « ${org.label} » et ses ${(org.ops||[]).length} opération(s) ?`,
                  onConfirm: () => deleteOrgane(pr.id, org.id),
                })} />
            ))}
            {/* Ajout organe */}
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input value={newOrgane[pr.id] || ''} onChange={e => setNewOrgane(n => ({ ...n, [pr.id]: e.target.value }))}
                placeholder="Nouveau organe (ex : TAR)"
                style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px 12px', fontSize:14, fontFamily:'inherit', outline:'none' }} />
              <button onClick={() => addOrgane(pr.id)} disabled={!(newOrgane[pr.id]||'').trim()} style={{
                background:'var(--accent,#1e3a5f)', border:'none', borderRadius:8, width:40, height:40, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:!(newOrgane[pr.id]||'').trim()?0.4:1,
              }}>
                <Icon name="plus" size={18} color="#fff" />
              </button>
            </div>
          </div>
        </Card>
      ))}
      {/* Ajouter projet */}
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ flex:1 }}><FieldInput value={newProjetLabel} onChange={setNewProjetLabel} placeholder="Nouveau projet (ex : X92)" /></div>
        <Btn variant="primary" onClick={addProjet} disabled={!newProjetLabel.trim()} extraStyle={{ alignSelf:'flex-end', minHeight:48 }}>
          <Icon name="plus" size={18} color="#fff" />
        </Btn>
      </div>
      <Btn variant="ok" onClick={() => onSave({ ...config, projets })} full>
        <Icon name="save" size={18} color="#fff" /> Enregistrer
      </Btn>
    </div>
  );
}

function OrganeRow({ organe, onLabelChange, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f9f8f6', borderRadius:8, padding:'8px 12px' }}>
      {editing ? (
        <input value={organe.label} onChange={e => onLabelChange(e.target.value)} autoFocus
          style={{ flex:1, border:'1.5px solid var(--accent,#1e3a5f)', borderRadius:6, padding:'5px 10px', fontSize:15, fontFamily:'inherit', outline:'none', fontWeight:700 }} />
      ) : (
        <span style={{ flex:1, fontSize:15, fontWeight:700, color:'#374151' }}>{organe.label}</span>
      )}
      <span style={{ fontSize:12, color:'#9ca3af' }}>{(organe.ops||[]).length} ops</span>
      <button onClick={() => setEditing(v => !v)} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28 }}>
        <Icon name={editing ? 'check' : 'pencil'} size={14} color={editing ? '#16a34a' : '#9ca3af'} />
      </button>
      <button onClick={onDelete} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28 }}>
        <Icon name="trash" size={14} color="#dc2626" />
      </button>
    </div>
  );
}

/* ─── Éditeur de pièces d'une OP ─── */
function PiecesEditor({ pieces, onChange, onDelete }) {
  const [val, setVal] = React.useState('');
  const list = pieces || [];
  function add() { const v = val.trim(); if (!v) return; onChange([...list, v]); setVal(''); }
  function update(i, v) { onChange(list.map((p, idx) => idx === i ? v : p)); }
  function remove(i) { onDelete ? onDelete(i) : onChange(list.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Pièces</label>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {list.length === 0 && (
          <div style={{ fontSize:13, color:'#d1d5db', fontStyle:'italic', padding:'2px 0' }}>Aucune pièce pour cette opération</div>
        )}
        {list.map((p, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input value={p} onChange={e => update(i, e.target.value)}
              style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px 12px', fontSize:14, fontFamily:'inherit', outline:'none' }} />
            <button onClick={() => requestConfirm({
              title:'Supprimer la pièce',
              message:`Supprimer la pièce « ${p || '—'} » ?`,
              onConfirm: () => remove(i),
            })} style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="trash" size={15} color="#dc2626" />
            </button>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder="Nouvelle pièce (ex : Longeron)"
            style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px 12px', fontSize:14, fontFamily:'inherit', outline:'none' }} />
          <button onClick={add} disabled={!val.trim()} style={{
            background:'var(--accent,#1e3a5f)', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: val.trim() ? 1 : 0.4,
          }}><Icon name="plus" size={17} color="#fff" /></button>
        </div>
      </div>
      <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{list.length} pièce(s)</div>
    </div>
  );
}

/* ─── Onglet Opérations ─── */
function OpsManager({ config, onSave }) {
  const [projets, setProjets] = React.useState(() => JSON.parse(JSON.stringify(config.projets || [])));
  const [selProjetId, setSelProjetId] = React.useState(config.projets?.[0]?.id || '');
  const [selOrganeId, setSelOrganeId] = React.useState(config.projets?.[0]?.organes?.[0]?.id || '');
  const [expanded, setExpanded] = React.useState(null);
  const [newOpKey, setNewOpKey] = React.useState('');

  const selProjet = projets.find(p => p.id === selProjetId);
  const selOrgane = selProjet?.organes?.find(o => o.id === selOrganeId);

  function selectProjet(id) {
    setSelProjetId(id);
    const p = projets.find(pr => pr.id === id);
    setSelOrganeId(p?.organes?.[0]?.id || '');
    setExpanded(null);
  }

  function updateOp(organeId, idx, field, val) {
    setProjets(ps => ps.map(p => ({ ...p, organes: p.organes.map(o => o.id !== organeId ? o : {
      ...o, ops: o.ops.map((op, i) => i === idx ? { ...op, [field]: val } : op)
    })})));
  }
  // Persiste immédiatement (suppressions)
  function commit(next) { setProjets(next); onSave({ ...config, projets: next }); }
  function deleteOp(organeId, idx) {
    commit(projets.map(p => ({ ...p, organes: p.organes.map(o => o.id !== organeId ? o : {
      ...o, ops: o.ops.filter((_, i) => i !== idx)
    })})));
    setExpanded(null);
  }
  // Suppression d'une pièce d'une OP, persistée immédiatement
  function deletePiece(organeId, opIdx, pieceIdx) {
    commit(projets.map(p => ({ ...p, organes: p.organes.map(o => o.id !== organeId ? o : {
      ...o, ops: o.ops.map((op, i) => i !== opIdx ? op : { ...op, pieces: (op.pieces||[]).filter((_, pi) => pi !== pieceIdx) })
    })})));
  }
  function addOp() {
    const key = newOpKey.trim(); if (!key) return;
    setProjets(ps => ps.map(p => ({ ...p, organes: p.organes.map(o => o.id !== selOrganeId ? o : {
      ...o, ops: [...o.ops, { key, cordons:[], sousEns:[], pieces:[] }]
    })})));
    setNewOpKey('');
  }
  const cordonsToStr = op => (op.cordons||[]).join(', ');
  const strToCordons = str => str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Sélecteur Projet */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {projets.map(p => (
          <button key={p.id} onClick={() => selectProjet(p.id)} style={{
            border:`2px solid ${selProjetId===p.id ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
            borderRadius:8, padding:'6px 16px', cursor:'pointer', fontFamily:'inherit',
            background: selProjetId===p.id ? 'var(--accent,#1e3a5f)' : '#f9fafb',
            color: selProjetId===p.id ? '#fff' : '#374151', fontWeight:700, fontSize:15,
          }}>{p.label}</button>
        ))}
      </div>
      {/* Sélecteur Organe */}
      {selProjet && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {selProjet.organes.map(o => (
            <button key={o.id} onClick={() => { setSelOrganeId(o.id); setExpanded(null); }} style={{
              border:`2px solid ${selOrganeId===o.id ? '#6b7280' : '#e5e7eb'}`,
              borderRadius:8, padding:'5px 14px', cursor:'pointer', fontFamily:'inherit',
              background: selOrganeId===o.id ? '#6b7280' : '#f9fafb',
              color: selOrganeId===o.id ? '#fff' : '#6b7280', fontWeight:600, fontSize:13,
            }}>{o.label}</button>
          ))}
        </div>
      )}
      {/* Ops list */}
      {selOrgane && (
        <>
          <p style={{ fontSize:13, color:'#6b7280', margin:0 }}><strong>{selProjet.label} › {selOrgane.label}</strong> — {selOrgane.ops.length} opération(s)</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {selOrgane.ops.map((op, idx) => (
              <div key={idx} style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e5e3de', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer' }} onClick={() => setExpanded(expanded===idx ? null : idx)}>
                  <span style={{ fontSize:15, fontWeight:700, color:'var(--accent,#1e3a5f)', flex:1 }}>{op.key}</span>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{(op.cordons||[]).length} cordons</span>
                  {(op.pieces||[]).length > 0 && <span style={{ fontSize:12, color:'#9ca3af' }}>· {(op.pieces||[]).length} pièces</span>}
                  <Icon name={expanded===idx ? 'chevronUp' : 'chevronDown'} size={16} color="#9ca3af" />
                </div>
                {expanded === idx && (
                  <div style={{ padding:'12px 14px', borderTop:'1px solid #f0ede8', display:'flex', flexDirection:'column', gap:10 }}>
                    <FieldInput label="Nom de l'opération" value={op.key} onChange={v => updateOp(selOrganeId, idx, 'key', v)} />
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Cordons (séparés par virgule)</label>
                      <textarea value={cordonsToStr(op)} onChange={e => updateOp(selOrganeId, idx, 'cordons', strToCordons(e.target.value))}
                        rows={3} placeholder="ex : 100, 101, 102"
                        style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:8, padding:'10px 12px', fontSize:14, fontFamily:'inherit', resize:'vertical', outline:'none' }} />
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{(op.cordons||[]).length} cordon(s)</div>
                    </div>
                    <PiecesEditor pieces={op.pieces} onChange={arr => updateOp(selOrganeId, idx, 'pieces', arr)} onDelete={pi => deletePiece(selOrganeId, idx, pi)} />
                    <button onClick={() => requestConfirm({
                      title:'Supprimer l\'opération',
                      message:`Supprimer l'opération « ${op.key} » ?`,
                      onConfirm: () => deleteOp(selOrganeId, idx),
                    })} style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'#dc2626' }}>
                      <Icon name="trash" size={15} color="#dc2626" /> Supprimer cette opération
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}><FieldInput value={newOpKey} onChange={setNewOpKey} placeholder="ex : OP 270" /></div>
            <Btn variant="primary" onClick={addOp} disabled={!newOpKey.trim()} extraStyle={{ alignSelf:'flex-end', minHeight:48 }}>
              <Icon name="plus" size={18} color="#fff" />
            </Btn>
          </div>
        </>
      )}
      <Btn variant="ok" onClick={() => onSave({ ...config, projets })} full>
        <Icon name="save" size={18} color="#fff" /> Enregistrer les opérations
      </Btn>
    </div>
  );
}

/* ─── Onglet IPN ─── */
function IpnManager({ config, onSave }) {
  const [ipns, setIpns] = React.useState([...config.managerIpns]);
  const [newIpn, setNewIpn] = React.useState('');
  function addIpn() {
    const v = newIpn.trim().toUpperCase(); if (!v || ipns.includes(v)) return;
    setIpns(p => [...p, v]); setNewIpn('');
  }
  function removeIpn(ipn) {
    if (ipns.length <= 1) return;
    const next = ipns.filter(i => i !== ipn);
    setIpns(next);
    onSave({ ...config, managerIpns: next });
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>Seuls ces IPN peuvent accéder au Manager.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {ipns.map(ipn => (
          <Card key={ipn} extraStyle={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="user" size={18} color="#fff" />
              </div>
              <span style={{ flex:1, fontSize:16, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>{ipn}</span>
              {ipns.length > 1 && (
                <button onClick={() => requestConfirm({
                  title:'Supprimer l\'IPN',
                  message:`Retirer l'accès Manager pour « ${ipn} » ?`,
                  onConfirm: () => removeIpn(ipn),
                })} style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="trash" size={15} color="#dc2626" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1 }}><FieldInput value={newIpn} onChange={v => setNewIpn(v.toUpperCase())} placeholder="ex : QUAL02" /></div>
        <Btn variant="primary" onClick={addIpn} disabled={!newIpn.trim()} extraStyle={{ alignSelf:'flex-end', minHeight:48 }}>
          <Icon name="plus" size={18} color="#fff" />
        </Btn>
      </div>
      <Btn variant="ok" onClick={() => onSave({ ...config, managerIpns: ipns })} full>
        <Icon name="save" size={18} color="#fff" /> Enregistrer les IPN
      </Btn>
    </div>
  );
}

/* ─── Manager Home ─── */
function ManagerHome({ config, ipn, onSave, onBack }) {
  const [tab, setTab] = React.useState('projets');
  const [toast, setToast] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);
  React.useEffect(() => { _confirmFn = setConfirm; return () => { _confirmFn = null; }; }, []);
  function handleSave(newCfg) { onSave(newCfg); setToast(true); setTimeout(() => setToast(false), 2500); }
  const tabs = [
    { id:'projets', label:'Projets',    icon:'layers' },
    { id:'ops',     label:'Opérations', icon:'clipboardCheck' },
    { id:'ipns',    label:'IPN',        icon:'shield' },
  ];
  return (
    <>
      <AppHeader title="Manager" subtitle={`Connecté : ${ipn}`} onBack={onBack} />
      <Page>
        {toast && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #22c55e', borderRadius:10, padding:'10px 16px', marginBottom:16, color:'#16a34a', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
            <Icon name="check" size={16} color="#16a34a" /> Modifications enregistrées
          </div>
        )}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'10px 4px', borderRadius:10,
              border:`2px solid ${tab===t.id ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
              background: tab===t.id ? 'var(--accent,#1e3a5f)' : '#f9fafb',
              color: tab===t.id ? '#fff' : '#6b7280',
              fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <Icon name={t.icon} size={18} color={tab===t.id ? '#fff' : '#6b7280'} />
              {t.label}
            </button>
          ))}
        </div>
        {tab==='projets' && <ProjetsManager config={config} onSave={handleSave} />}
        {tab==='ops'     && <OpsManager     config={config} onSave={handleSave} />}
        {tab==='ipns'    && <IpnManager     config={config} onSave={handleSave} />}
      </Page>
      {confirm && (
        <ConfirmModal {...confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { confirm.onConfirm?.(); setConfirm(null); }} />
      )}
    </>
  );
}

function ManagerScreen({ config, onSaveConfig, onBack }) {
  const [authed, setAuthed] = React.useState(null);
  if (!authed) return <ManagerLogin config={config} onLogin={setAuthed} onBack={onBack} />;
  return <ManagerHome config={config} ipn={authed} onSave={onSaveConfig} onBack={onBack} />;
}

Object.assign(window, { ManagerScreen });
