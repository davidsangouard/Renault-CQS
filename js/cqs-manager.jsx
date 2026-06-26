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
  async function tryLogin() {
    try {
      await API.checkManager(ipn.trim().toUpperCase());
      onLogin(ipn.trim().toUpperCase());
    } catch(e) {
      setError(e.message || 'IPN non autorisé — accès refusé');
    }
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
    const next = [...projets, { id, label, organes:[] }];
    commit(next);
    setNewProjetLabel('');
  }
  function addOrgane(projetId) {
    const label = (newOrgane[projetId] || '').trim(); if (!label) return;
    const id = projetId + '-' + label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    const next = projets.map(pr => pr.id !== projetId ? pr : {
      ...pr, organes: [...pr.organes, { id, label, ops:[] }]
    });
    commit(next);
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
            <button onClick={() => {
              if (editProjetId === pr.id) onSave({ ...config, projets });
              setEditProjetId(editProjetId===pr.id ? null : pr.id);
            }} style={{ background:'#f4f3ef', border:'1.5px solid #e5e3de', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
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
                onEditConfirm={() => onSave({ ...config, projets })}
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

function OrganeRow({ organe, onLabelChange, onEditConfirm, onDelete }) {
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
      <button onClick={() => { if (editing) onEditConfirm?.(); setEditing(v => !v); }} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28 }}>
        <Icon name={editing ? 'check' : 'pencil'} size={14} color={editing ? '#16a34a' : '#9ca3af'} />
      </button>
      <button onClick={onDelete} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28 }}>
        <Icon name="trash" size={14} color="#dc2626" />
      </button>
    </div>
  );
}

/* ─── Éditeur de sous-ensembles pré-configurés d'une OP ─── */
function SousEnsEditor({ sousEns, onChange }) {
  const [val, setVal] = React.useState('');
  const list = sousEns || [];
  function add() { const v = val.trim(); if (!v) return; onChange([...list, { label: v }]); setVal(''); }
  function remove(i) { onChange(list.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Sous-ensembles utilisés (présets)</label>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {list.length === 0 && (
          <div style={{ fontSize:13, color:'#d1d5db', fontStyle:'italic', padding:'2px 0' }}>Aucun préset — l'opérateur saisira manuellement</div>
        )}
        {list.map((se, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'7px 12px', fontSize:14, fontWeight:700, color:'#1d4ed8' }}>{se.label}</div>
            <button onClick={() => remove(i)} style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="trash" size={15} color="#dc2626" />
            </button>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="ex : OP 80"
            style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px 12px', fontSize:14, fontFamily:'inherit', outline:'none' }} />
          <button onClick={add} disabled={!val.trim()} style={{
            background:'var(--accent,#1e3a5f)', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: val.trim() ? 1 : 0.4,
          }}><Icon name="plus" size={17} color="#fff" /></button>
        </div>
      </div>
      <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Ces OP pré-rempliront la colonne « OP n° » lors d'une nouvelle vérification.</div>
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
  const [newCordon, setNewCordon] = React.useState('');

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
    const next = projets.map(p => ({ ...p, organes: p.organes.map(o => o.id !== selOrganeId ? o : {
      ...o, ops: [...o.ops, { key, cordons:[], sousEns:[], pieces:[] }]
    })}));
    commit(next);
    setNewOpKey('');
  }
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
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Cordons</label>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8, minHeight:28 }}>
                        {(op.cordons||[]).length === 0 && <span style={{ fontSize:13, color:'#c4c0ba', fontStyle:'italic' }}>Aucun cordon</span>}
                        {(op.cordons||[]).map(n => (
                          <div key={n} style={{ display:'flex', alignItems:'center', gap:4, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'3px 10px', fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
                            {n}
                            <button onClick={() => updateOp(selOrganeId, idx, 'cordons', (op.cordons||[]).filter(x => x !== n))}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', fontSize:16, lineHeight:1, padding:'0 0 0 4px', fontFamily:'inherit', fontWeight:700 }}>×</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <input value={newCordon} onChange={e => setNewCordon(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const n = parseInt(newCordon.trim(), 10); if (!isNaN(n) && !(op.cordons||[]).includes(n)) { updateOp(selOrganeId, idx, 'cordons', [...(op.cordons||[]), n].sort((a,b)=>a-b)); } setNewCordon(''); } }}
                          placeholder="N° cordon ex: 260" type="number"
                          style={{ flex:1, border:'1.5px solid #d1d5db', borderRadius:8, padding:'8px 12px', fontSize:14, fontFamily:'inherit', outline:'none', minHeight:40 }} />
                        <button onClick={() => { const n = parseInt(newCordon.trim(), 10); if (!isNaN(n) && !(op.cordons||[]).includes(n)) { updateOp(selOrganeId, idx, 'cordons', [...(op.cordons||[]), n].sort((a,b)=>a-b)); } setNewCordon(''); }}
                          style={{ background:'var(--accent,#1e3a5f)', border:'none', borderRadius:8, width:40, height:40, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon name="plus" size={17} color="#fff" />
                        </button>
                      </div>
                    </div>
                    <PiecesEditor pieces={op.pieces} onChange={arr => updateOp(selOrganeId, idx, 'pieces', arr)} onDelete={pi => deletePiece(selOrganeId, idx, pi)} />
                    <SousEnsEditor sousEns={op.sousEns||[]} onChange={arr => updateOp(selOrganeId, idx, 'sousEns', arr)} />
                    <Btn variant="ok" onClick={() => commit(projets)} full>
                      <Icon name="save" size={16} color="#fff" /> Sauvegarder cette opération
                    </Btn>
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
    const next = [...ipns, v];
    setIpns(next);
    onSave({ ...config, managerIpns: next });
    setNewIpn('');
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

/* ─── Compression image côté client (canvas, max 1200px, JPEG 0.75) ─── */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxW = 1200;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ─── Onglet Fiches schéma ─── */
function FichesManager({ config }) {
  const [selProjetId, setSelProjetId] = React.useState(config.projets?.[0]?.id || '');
  const [selOrganeId, setSelOrganeId] = React.useState(config.projets?.[0]?.organes?.[0]?.id || '');
  const [images, setImages] = React.useState({});   // { opKey: [{id, imageData, mimeType}] }
  const [uploading, setUploading] = React.useState(null);
  const [toast, setToast] = React.useState('');

  const selProjet = config.projets?.find(p => p.id === selProjetId);
  const selOrgane = selProjet?.organes?.find(o => o.id === selOrganeId);
  const ops = selOrgane?.ops || [];

  // Charge toutes les images au changement d'organe
  React.useEffect(() => {
    if (!selOrgane) return;
    setImages({});
    const pending = ops.map(op =>
      API.getOpImages(selOrgane.id, op.key)
        .then(d => ({ opKey: op.key, imgs: d.images || [] }))
        .catch(() => ({ opKey: op.key, imgs: [] }))
    );
    Promise.all(pending).then(results => {
      const map = {};
      results.forEach(r => { map[r.opKey] = r.imgs; });
      setImages(map);
    });
  }, [selOrganeId, selProjetId]);

  function selectProjet(pid) {
    setSelProjetId(pid);
    const p = config.projets?.find(pr => pr.id === pid);
    setSelOrganeId(p?.organes?.[0]?.id || '');
  }

  async function handleUpload(opKey, file) {
    if (!file || !selOrgane) return;
    if ((images[opKey] || []).length >= 10) return;
    setUploading(opKey);
    try {
      const imageData = await compressImage(file);
      const res = await API.uploadOpImage({ organe: selOrgane.id, op: opKey, imageData, mimeType: 'image/jpeg' });
      const newImg = { id: res.id, imageData, mimeType: 'image/jpeg' };
      setImages(prev => ({ ...prev, [opKey]: [...(prev[opKey] || []), newImg] }));
      setToast(`Image ajoutée pour ${opKey}`);
      setTimeout(() => setToast(''), 2500);
    } catch(err) {
      setToast(`Erreur : ${err.message}`);
      setTimeout(() => setToast(''), 4000);
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(opKey, imgId) {
    try {
      await API.deleteOpImage(imgId);
      setImages(prev => ({ ...prev, [opKey]: (prev[opKey] || []).filter(i => i.id !== imgId) }));
    } catch(err) {
      setToast(`Erreur : ${err.message}`);
      setTimeout(() => setToast(''), 3000);
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>Uploadez une ou plusieurs images de schéma par opération. Elles s'afficheront en carousel lors de la vérification.</p>
      {toast && (
        <div style={{ background:'#f0fdf4', border:'1.5px solid #22c55e', borderRadius:10, padding:'10px 16px', color:'#16a34a', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
          <Icon name="check" size={16} color="#16a34a" /> {toast}
        </div>
      )}
      {/* Sélecteur Projet */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {(config.projets||[]).map(p => (
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
            <button key={o.id} onClick={() => setSelOrganeId(o.id)} style={{
              border:`2px solid ${selOrganeId===o.id ? '#6b7280' : '#e5e7eb'}`,
              borderRadius:8, padding:'5px 14px', cursor:'pointer', fontFamily:'inherit',
              background: selOrganeId===o.id ? '#6b7280' : '#f9fafb',
              color: selOrganeId===o.id ? '#fff' : '#6b7280', fontWeight:600, fontSize:13,
            }}>{o.label}</button>
          ))}
        </div>
      )}
      {/* Liste des OPs */}
      {ops.map(op => {
        const opImgs = images[op.key] || [];
        const isUploading = uploading === op.key;
        return (
          <div key={op.key} style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e5e3de', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--accent,#1e3a5f)', flex:1 }}>{op.key}</span>
              <span style={{ fontSize:12, fontWeight: opImgs.length >= 10 ? 700 : 400, color: opImgs.length >= 10 ? '#dc2626' : '#9ca3af' }}>
                {opImgs.length}/10
              </span>
              <label style={{
                display:'flex', alignItems:'center', gap:8,
                cursor: (isUploading || opImgs.length >= 10) ? 'not-allowed' : 'pointer',
                background: opImgs.length >= 10 ? '#9ca3af' : 'var(--accent,#1e3a5f)', color:'#fff',
                border:`1.5px solid ${opImgs.length >= 10 ? '#9ca3af' : 'var(--accent,#1e3a5f)'}`,
                borderRadius:8, padding:'7px 14px', fontFamily:'inherit', fontSize:13, fontWeight:700,
                opacity: (isUploading || opImgs.length >= 10) ? 0.6 : 1,
              }}>
                <Icon name="camera" size={15} color="#fff" />
                {isUploading ? 'Upload…' : opImgs.length >= 10 ? 'Limite atteinte' : 'Ajouter'}
                <input type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleUpload(op.key, e.target.files[0]); e.target.value=''; }}
                  disabled={isUploading || opImgs.length >= 10} />
              </label>
            </div>
            {opImgs.length > 0 && (
              <div style={{ padding:'0 14px 14px', display:'flex', gap:10, flexWrap:'wrap' }}>
                {opImgs.map((img, idx) => (
                  <div key={img.id} style={{ position:'relative' }}>
                    <img src={img.imageData} alt={`${op.key} ${idx+1}`}
                      style={{ height:80, maxWidth:140, borderRadius:8, border:'1.5px solid #e5e3de', objectFit:'contain', display:'block' }} />
                    <button onClick={() => handleDelete(op.key, img.id)} title="Supprimer"
                      style={{
                        position:'absolute', top:-7, right:-7,
                        background:'#dc2626', border:'2px solid #fff', borderRadius:'50%',
                        width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
                      }}>
                      <Icon name="x" size={11} color="#fff" />
                    </button>
                    {opImgs.length > 1 && (
                      <div style={{ textAlign:'center', fontSize:10, color:'#9ca3af', marginTop:2 }}>{idx+1}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
    { id:'fiches',  label:'Fiches',     icon:'camera' },
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
        {tab==='fiches'  && <FichesManager  config={config} />}
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
