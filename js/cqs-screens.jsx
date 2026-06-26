// cqs-screens.jsx — Écrans Home, OF Detail, Wizard + App root

const { useState, useEffect } = React;

// ─── IPN Login Screen (opérateur) ───
function IPNLoginScreen({ onLogin }) {
  const [ipn, setIpn] = React.useState('');
  function submit() { if (ipn.trim()) onLogin(ipn.trim().toUpperCase()); }
  function onKey(e) { if (e.key === 'Enter') submit(); }
  return (
    <div style={{ minHeight:'100vh', background:'var(--accent,#1e3a5f)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:54, fontWeight:900, color:'#fff', letterSpacing:-2, lineHeight:1 }}>CQS</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.6)', marginTop:8 }}>Checklist Qualité Soudure</div>
        </div>
        <Card extraStyle={{ padding:'28px 20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#f4f3ef', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Icon name="user" size={28} color="var(--accent,#1e3a5f)" />
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>Identifiez-vous</div>
              <div style={{ fontSize:14, color:'#6b7280', marginTop:5 }}>Entrez votre IPN pour commencer</div>
            </div>
            <FieldInput label="IPN" value={ipn}
              onChange={v => setIpn(v.toUpperCase())}
              placeholder="ex : OPER01" />
            <Btn variant="primary" onClick={submit} disabled={!ipn.trim()} full>
              <Icon name="logIn" size={18} color="#fff" /> Commencer
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Carte de sélection d'OP (poste) — style des cartes OP du détail OF ───
function OPSelectCard({ opDef, index, active, onClick, verifCount = 0 }) {
  const totC = (opDef.cordons || []).length;
  const totP = (opDef.pieces || []).length;
  const parts = [];
  parts.push(totC > 0 ? `${totC} cordons` : 'Aucun cordon');
  if (totP > 0) parts.push(`${totP} pièce${totP > 1 ? 's' : ''}`);
  if (verifCount > 0) parts.push(`${verifCount} vérif${verifCount > 1 ? 's' : ''}`);
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:12,
      border:`1.5px solid ${active ? 'var(--accent,#1e3a5f)' : '#e8e5e0'}`,
      padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer',
      boxShadow: active ? '0 0 0 3px rgba(30,58,95,0.12)' : 'none',
    }}>
      <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
        background: active ? 'var(--accent,#1e3a5f)' : '#f4f3ef',
        border:`2px solid ${active ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:700, color: active ? '#fff' : '#9ca3af' }}>
        {index + 1}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>{opDef.key}</div>
        <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{parts.join(' · ')}</div>
      </div>
      <Icon name={active ? 'check' : 'chevronRight'} size={20} color={active ? 'var(--accent,#1e3a5f)' : '#d1d5db'} />
    </div>
  );
}

// ─── Carte OF (statut de l'OP sélectionnée dans cet OF) ───
function OFCard({ of, opKey, onClick }) {
  const op = of.ops?.[opKey];
  const st = op?.status || 'todo';
  const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.todo;
  const cordons = op ? Object.values(op.cordons) : [];
  const okC = cordons.filter(v => v === 'ok').length;
  const totC = cordons.length;
  const glyph = st === 'done' ? '✓' : st === 'nok' ? '↩' : st === 'inprogress' ? '●' : '';
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:12,
      border:`1.5px solid ${st === 'inprogress' ? 'var(--accent,#1e3a5f)' : '#e8e5e0'}`,
      padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer',
      boxShadow: st === 'inprogress' ? '0 0 0 3px rgba(30,58,95,0.12)' : 'none',
    }}>
      <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
        background: cfg.bg, border:`2px solid ${cfg.dot}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:700, color: cfg.color }}>
        {glyph}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <span style={{ fontSize:17, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>OF {of.id}</span>
          <StatusBadge status={st} />
        </div>
        <div style={{ fontSize:12, color:'#9ca3af' }}>
          {of.date}
          {totC > 0 ? ` · ${okC}/${totC} cordons` : ''}
          {op?.pieceNum ? ` · ${op.pieceNum}` : ''}
        </div>
      </div>
      <Icon name="chevronRight" size={20} color="#d1d5db" />
    </div>
  );
}

// ─── Projet / Organe + liste des OF (après auth) ───
function ProjetSelectScreen({ config, ofs, userIpn, initial, organeOfs, onPickFilter, onSelectVerif, onNewOF, onDeleteOF, onExport, onDeleteAll, onPdfOF, onManager, onLogout }) {
  const projets = config?.projets || [];
  const [selProjetId, setSelProjetId] = React.useState(initial?.projetId || projets[0]?.id || '');
  const selProjet = projets.find(p => p.id === selProjetId);
  const [selOrganeId, setSelOrganeId] = React.useState(
    initial?.organeId && selProjet?.organes.some(o => o.id === initial.organeId)
      ? initial.organeId
      : selProjet?.organes?.[0]?.id || ''
  );
  const [selOpKey, setSelOpKey] = React.useState(null);

  function pickProjet(pid) {
    setSelProjetId(pid);
    const p = projets.find(pr => pr.id === pid);
    setSelOrganeId(p?.organes?.[0]?.id || '');
    setSelOpKey(null);
  }

  function pickOrgane(oid) {
    setSelOrganeId(oid);
    setSelOpKey(null);
  }

  function pickOp(key) {
    setSelOpKey(k => k === key ? null : key);
  }

  const curProjet = projets.find(p => p.id === selProjetId);
  const curOrgane = curProjet?.organes.find(o => o.id === selOrganeId);
  const opDefs = curOrgane?.ops || [];
  const curOpDef = opDefs.find(o => o.key === selOpKey);
  const opPieces = curOpDef?.pieces || [];
  const showOPs = !!(selProjetId && selOrganeId);
  const showOFs = !!(selProjetId && selOrganeId && selOpKey);

  // Persiste le poste sélectionné dès qu'un couple projet+organe valide est choisi
  React.useEffect(() => {
    if (selProjetId && selOrganeId && curProjet && curOrgane) {
      onPickFilter?.({
        projetId: selProjetId, projetLabel: curProjet.label,
        organeId: selOrganeId, organeLabel: curOrgane.label,
      });
    }
  }, [selProjetId, selOrganeId]); // eslint-disable-line

  // OF filtrés par projet + organe (l'OP sélectionnée existe dans chacun)
  const ofList = Object.values(ofs || {}).filter(o =>
    (!selProjetId || o.projetId === selProjetId) &&
    (!selOrganeId || o.organeId === selOrganeId) &&
    (!selOpKey || !!o.ops?.[selOpKey]));

  return (
    <div style={{ minHeight:'100vh', background:'#f4f3ef', display:'flex', flexDirection:'column' }}>
      {/* Bandeau accent */}
      <div style={{ background:'var(--accent,#1e3a5f)', color:'#fff', padding:'22px 20px 26px' }}>
        <div style={{ maxWidth:920, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Bonjour {userIpn}</div>
            <div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>Choisissez votre poste</div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            {onManager && (
              <button onClick={onManager} title="Manager" style={{
                background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, color:'#fff',
                width:40, height:40, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}><Icon name="settings" size={19} color="#fff" /></button>
            )}
            <button onClick={onLogout} title="Se déconnecter" style={{
              background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, color:'#fff',
              width:40, height:40, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}><Icon name="logOut" size={19} color="#fff" /></button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, padding:'20px 20px 36px' }}>
        <div style={{ maxWidth:920, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
          <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:7 }}>
            <Icon name="filter" size={15} color="#9ca3af" />
            Sélectionnez votre projet, votre organe, puis votre poste (OP).
          </div>

          {/* Projet */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10 }}>Projet</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10 }}>
              {projets.map(p => {
                const active = selProjetId === p.id;
                return (
                  <button key={p.id} onClick={() => pickProjet(p.id)} style={{
                    border:`2px solid ${active ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
                    borderRadius:12, padding:'16px 12px', cursor:'pointer',
                    background: active ? 'var(--accent,#1e3a5f)' : '#fff',
                    color: active ? '#fff' : '#374151',
                    fontFamily:'inherit', fontSize:20, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center', minHeight:60,
                  }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Organe */}
          {curProjet && curProjet.organes.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10 }}>
                Organe <span style={{ color:'#c4c0ba', fontWeight:600, textTransform:'none', letterSpacing:0 }}>· {curProjet.label}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10 }}>
                {curProjet.organes.map(o => {
                  const active = selOrganeId === o.id;
                  return (
                    <button key={o.id} onClick={() => pickOrgane(o.id)} style={{
                      border:`2px solid ${active ? '#6b7280' : '#e5e7eb'}`,
                      borderRadius:12, padding:'16px 12px', cursor:'pointer',
                      background: active ? '#6b7280' : '#fff',
                      color: active ? '#fff' : '#6b7280',
                      fontFamily:'inherit', fontSize:20, fontWeight:800,
                      display:'flex', alignItems:'center', justifyContent:'center', minHeight:60,
                    }}>{o.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Poste (OP) à gauche · Ordres de fabrication à droite */}
          {showOPs && (
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-start' }}>
              {/* Colonne gauche : Poste (OP) */}
              <div style={{ flex:'1 1 300px', minWidth:260 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  Poste (OP)
                  {curProjet && curOrgane && (
                    <span style={{ color:'#c4c0ba', fontWeight:600, textTransform:'none', letterSpacing:0 }}>
                      · {curProjet.label} › {curOrgane.label}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {opDefs.length === 0 && (
                    <div style={{ textAlign:'center', padding:'28px 20px', color:'#9ca3af', background:'#fff', border:'1.5px solid #e8e5e0', borderRadius:12 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#6b7280' }}>Aucune OP pour cet organe</div>
                    </div>
                  )}
                  {opDefs.map((opDef, idx) => {
                    const verifCount = (organeOfs||[]).filter(of => {
                      const st = of.ops?.[opDef.key]?.status;
                      return st && st !== 'todo';
                    }).length;
                    return <OPSelectCard key={opDef.key} opDef={opDef} index={idx}
                      active={selOpKey === opDef.key}
                      verifCount={verifCount}
                      onClick={() => pickOp(opDef.key)} />;
                  })}
                </div>
              </div>

              {/* Colonne droite : Vérification + Pièces — reste visible au scroll */}
              <div style={{ flex:'1.25 1 340px', minWidth:280, position:'sticky', top:16, alignSelf:'flex-start' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  Vérification
                  {showOFs && <span style={{ color:'#c4c0ba', fontWeight:600, textTransform:'none', letterSpacing:0 }}>· {selOpKey}</span>}
                </div>
                {showOFs ? (
                  <>
                    {(() => {
                      const opVerifs = (organeOfs || [])
                        .filter(of => { const st = of.ops?.[selOpKey]?.status; return st && st !== 'todo'; })
                        .map(of => ({ ofId: of.id, verif: of.ops[selOpKey], date: of.date }));
                      return (
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          <button onClick={() => onNewOF(selOpKey)} style={{
                            width:'100%', border:'none', borderRadius:12, cursor:'pointer',
                            background:'var(--accent,#1e3a5f)', color:'#fff', fontFamily:'inherit',
                            padding:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                            fontSize:16, fontWeight:800,
                            boxShadow:'0 3px 14px rgba(30,58,95,0.28)',
                          }}>
                            <Icon name="plus" size={20} color="#fff" />
                            Créer
                          </button>
                          {opVerifs.map(({ ofId, verif, date }) => {
                            const st = verif.status;
                            return (
                              <div key={ofId} style={{
                                background:'#fff', borderRadius:12,
                                border:`1.5px solid ${st === 'done' ? '#bbf7d0' : st === 'nok' ? '#fed7aa' : '#e8e5e0'}`,
                                display:'flex', alignItems:'stretch', overflow:'hidden',
                              }}>
                                <div onClick={() => onSelectVerif(ofId, selOpKey)} style={{
                                  flex:1, padding:'14px 16px', cursor:'pointer',
                                  display:'flex', alignItems:'center', gap:12,
                                }}>
                                  <StatusBadge status={st} />
                                  <div style={{ flex:1, minWidth:0 }}>
                                    {verif.pieceNum && <div style={{ fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>Pièce : {verif.pieceNum}</div>}
                                    {verif.ofNum && <div style={{ fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)', marginTop:2 }}>OF : {verif.ofNum}</div>}
                                    {!verif.pieceNum && !verif.ofNum && <div style={{ fontSize:13, color:'#9ca3af', fontStyle:'italic' }}>Aucun numéro renseigné</div>}
                                    {verif.ipn && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>IPN : {verif.ipn}</div>}
                                    {date && <div style={{ fontSize:11, color:'#c4c0ba', marginTop:2 }}>{date}</div>}
                                  </div>
                                  <Icon name="chevronRight" size={16} color="#c4c0ba" />
                                </div>
                                <button onClick={() => onDeleteOF(ofId)} title="Supprimer cette vérification" style={{
                                  flexShrink:0, width:44, border:'none', borderLeft:'1.5px solid #fca5a5',
                                  background:'#fef2f2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                  <Icon name="trash" size={15} color="#dc2626" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'48px 24px', color:'#9ca3af', background:'#fff', border:'1.5px dashed #e0ddd7', borderRadius:12 }}>
                    <Icon name="arrowLeft" size={28} color="#d1d5db" />
                    <div style={{ fontSize:14, fontWeight:700, marginTop:10, color:'#6b7280' }}>Choisissez un poste</div>
                    <div style={{ fontSize:13, marginTop:4 }}>Sélectionnez une OP à gauche pour lancer une vérification.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selProjetId && selOrganeId && (
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <button onClick={onExport} style={{
                flex:1, border:'none', borderRadius:12, cursor:'pointer',
                background:'var(--accent,#1e3a5f)', color:'#fff', fontFamily:'inherit',
                padding:'18px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                fontSize:16, fontWeight:800, boxShadow:'0 3px 14px rgba(30,58,95,0.28)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Exporter PDF
              </button>
              <button onClick={() => onDeleteAll()} style={{
                flex:1, border:'1.5px solid #fca5a5', borderRadius:12, cursor:'pointer',
                background:'#fef2f2', color:'#dc2626', fontFamily:'inherit',
                padding:'18px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                fontSize:16, fontWeight:800,
              }}>
                <Icon name="trash" size={18} color="#dc2626" />
                Supprimer tout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App Header ───
function AppHeader({ title, subtitle, onBack, right }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--accent, #1e3a5f)', color: '#fff',
      height: 60, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
          color: '#fff', width: 40, height: 40, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontFamily: 'inherit',
        }}><Icon name="arrowLeft" size={22} color="#fff" /></button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </header>
  );
}

// ─── Wrapper page ───
function Page({ children, padBot = 0 }) {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 76, paddingBottom: padBot + 16, paddingLeft: 16, paddingRight: 16 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Modal Nouvel OF ───
function NewOFModal({ config, initial, onCreate, onClose }) {
  const [id, setId] = React.useState('');
  const [selProjetId, setSelProjetId] = React.useState(initial?.projetId || config?.projets?.[0]?.id || '');
  const selProjet = (config?.projets || []).find(p => p.id === selProjetId);
  const [selOrganeId, setSelOrganeId] = React.useState(
    initial?.organeId && selProjet?.organes.some(o => o.id === initial.organeId)
      ? initial.organeId
      : selProjet?.organes?.[0]?.id || ''
  );

  function selectProjet(pid) {
    setSelProjetId(pid);
    const p = (config?.projets || []).find(pr => pr.id === pid);
    setSelOrganeId(p?.organes?.[0]?.id || '');
  }

  const curProjet = (config?.projets || []).find(p => p.id === selProjetId);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:640, margin:'0 auto' }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--accent,#1e3a5f)', marginBottom:20 }}>
          Nouvel ordre de fabrication
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FieldInput label="Numéro OF" value={id} onChange={setId} placeholder="ex : 2024-089" required />

          {/* Sélecteur Projet */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Projet</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {(config?.projets || []).map(p => (
                <button key={p.id} onClick={() => selectProjet(p.id)} style={{
                  border:`2px solid ${selProjetId===p.id ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
                  borderRadius:8, padding:'8px 18px', cursor:'pointer',
                  background: selProjetId===p.id ? 'var(--accent,#1e3a5f)' : '#f9fafb',
                  color: selProjetId===p.id ? '#fff' : '#374151',
                  fontFamily:'inherit', fontSize:16, fontWeight:800,
                }}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Sélecteur Organe */}
          {curProjet && curProjet.organes.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>
                Organe <span style={{ color:'#9ca3af', fontWeight:400 }}>({curProjet.label})</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {curProjet.organes.map(o => (
                  <button key={o.id} onClick={() => setSelOrganeId(o.id)} style={{
                    border:`2px solid ${selOrganeId===o.id ? '#6b7280' : '#e5e7eb'}`,
                    borderRadius:8, padding:'7px 16px', cursor:'pointer',
                    background: selOrganeId===o.id ? '#6b7280' : '#f9fafb',
                    color: selOrganeId===o.id ? '#fff' : '#6b7280',
                    fontFamily:'inherit', fontSize:14, fontWeight:700,
                  }}>{o.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <Btn variant="secondary" onClick={onClose} extraStyle={{ flex:1 }}>Annuler</Btn>
          <Btn variant="primary" disabled={!id.trim() || !selOrganeId} onClick={() => onCreate(id.trim(), selOrganeId)} extraStyle={{ flex:2 }}>
            <Icon name="arrowRight" size={16} color="#fff" /> Créer
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tweaks Panel ───
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#1e3a5f",
  "largeCordons": false
}/*EDITMODE-END*/;

function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const themes = [
    { label: 'Bleu marine', color: '#1e3a5f' },
    { label: 'Vert foncé',  color: '#1a5c2e' },
    { label: 'Ardoise',     color: '#374151' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 20, zIndex: 300,
      background: '#fff', borderRadius: 16, padding: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      border: '1.5px solid #e8e5e0', width: 260,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent,#1e3a5f)' }}>Tweaks</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', fontFamily: 'inherit' }}>✕</button>
      </div>
      {/* Thème couleur */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Thème</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {themes.map(t => (
            <button key={t.color} onClick={() => setTweaks(tw => ({ ...tw, accentColor: t.color }))} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `2px solid ${tweaks.accentColor === t.color ? t.color : '#e5e7eb'}`,
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              background: tweaks.accentColor === t.color ? t.color + '12' : '#f9fafb',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              color: tweaks.accentColor === t.color ? t.color : '#6b7280',
            }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Grands boutons cordons */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Boutons cordons</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Normal', val: false }, { label: 'Grand (gants)', val: true }].map(opt => (
            <button key={String(opt.val)} onClick={() => setTweaks(tw => ({ ...tw, largeCordons: opt.val }))} style={{
              flex: 1, border: `2px solid ${tweaks.largeCordons === opt.val ? 'var(--accent,#1e3a5f)' : '#e5e7eb'}`,
              borderRadius: 8, padding: '8px 6px', cursor: 'pointer',
              background: tweaks.largeCordons === opt.val ? '#eff6ff' : '#f9fafb',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              color: tweaks.largeCordons === opt.val ? 'var(--accent,#1e3a5f)' : '#6b7280',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App Root ───
function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);
  const [config, setConfig]       = React.useState(null);
  const [userIpn, setUserIpn]     = React.useState(null);
  const [filter, setFilter]       = React.useState(null);
  const [ofs, setOfs]             = React.useState({});
  const [view, setView]           = React.useState('home');
  const [curOF, setCurOF]         = React.useState(null);
  const [curOP, setCurOP]         = React.useState(null);
  const [curPiece, setCurPiece]   = React.useState(null);
  const [draftOp, setDraftOp]     = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [pdfBlockModal, setPdfBlockModal] = React.useState(null);
  const [showTweaks, setShowTweaks] = React.useState(false);
  const [tweaks, setTweaks]       = React.useState(TWEAK_DEFAULTS);
  const [exportModal, setExportModal] = React.useState(false);
  const [exportOfNum, setExportOfNum] = React.useState('');
  const [exportError, setExportError] = React.useState(null);
  const [deleteSelectModal, setDeleteSelectModal] = React.useState(null);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accentColor);
    document.documentElement.style.setProperty('--cordon-h', tweaks.largeCordons ? '66px' : '52px');
    try { window.parent.postMessage({ type:'__edit_mode_set_keys', edits:tweaks }, '*'); } catch {}
  }, [tweaks]);

  React.useEffect(() => {
    const handler = e => {
      if (e.data?.type === '__activate_edit_mode')   setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Init: load session + config + OFs ──
  React.useEffect(() => {
    (async () => {
      try {
        const [session, cfg, ofsData] = await Promise.all([
          API.getSession(),
          API.getConfig(),
          API.getOfs(),
        ]);
        if (session.ipn)    setUserIpn(session.ipn);
        if (session.filter) setFilter(session.filter);
        setConfig(cfg);
        setOfs(ofsData);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleLoginIpn(ipn) {
    await API.login(ipn).catch(() => {});
    setUserIpn(ipn);
  }

  async function handlePickFilter(f) {
    setFilter(f);
    await API.saveFilter(f).catch(() => {});
  }

  async function handleLogout() {
    setUserIpn(null); setFilter(null);
    await API.logout().catch(() => {});
  }

  async function handleSaveConfig(newCfg) {
    setConfig(newCfg);
    await API.saveConfig(newCfg).catch(console.error);
  }

  async function handleComplete(opKey, formData) {
    const status = formData.status || (formData.conformite === 'non-conforme' ? 'nok' : 'done');
    const organeId = curOF ? (ofs[curOF]?.organeId || filter?.organeId) : filter?.organeId;

    // curOF set = editing existing verif; null = always create new OF
    const existingOf = curOF ? ofs[curOF] : null;

    if (existingOf) {
      const ofId = existingOf.id;
      setOfs(prev => ({
        ...prev,
        [ofId]: { ...prev[ofId], ops: { ...prev[ofId].ops, [opKey]: { ...(prev[ofId].ops?.[opKey] || {}), ...formData, status } } }
      }));
      await API.saveVerif({
        ofId, opKey,
        organeId: existingOf.organeId, organeLabel: existingOf.organeLabel,
        projetId: existingOf.projetId, projetLabel: existingOf.projetLabel,
        date: existingOf.date, opsList: existingOf.opsList,
        opData: { ...formData, status },
      }).catch(console.error);
    } else {
      const ofId = 'AUTO-' + Date.now();
      const base = makeEmptyOF(ofId, organeId, config);
      if (base) {
        base.ops[opKey] = { ...(base.ops[opKey] || {}), ...formData, status };
        setOfs(prev => ({ ...prev, [ofId]: base }));
        await API.createOf(base).catch(console.error);
        await API.saveVerif({
          ofId, opKey,
          organeId: base.organeId, organeLabel: base.organeLabel,
          projetId: base.projetId, projetLabel: base.projetLabel,
          date: base.date, opsList: base.opsList,
          opData: { ...formData, status },
        }).catch(console.error);
      }
    }
    setCurOP(null); setCurPiece(null); setDraftOp(null); setCurOF(null); setView('home');
  }

  async function handleDeleteOf(ofId) {
    setOfs(prev => { const next = { ...prev }; delete next[ofId]; return next; });
    await API.deleteOf(ofId).catch(console.error);
    setDeleteConfirm(null);
  }

  async function handlePdfOf(displayOfNum) {
    const allOfs = findOrganeOfs();
    if (!allOfs.length || !window.jspdf) return;

    const primaryOf = allOfs[0]; // Use most recent for metadata/opsList

    // Preload schema images (multiple per OP)
    const images = {};  // opKey → [imageData, ...]
    for (const opKey of (primaryOf.opsList || [])) {
      try {
        const d = await API.getOpImages(primaryOf.organeId, opKey);
        const datas = (d.images || []).map(i => i.imageData).filter(Boolean);
        if (datas.length) images[opKey] = datas;
      } catch(e) {}
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 12;
    const inner  = pageW - margin * 2;

    const STATUS_COLORS = { done:[22,163,74], nok:[217,119,6], inprogress:[37,99,235] };
    const STATUS_LABEL  = { done:'Conforme', nok:'Retouché', inprogress:'En cours' };
    const ACCENT = [30, 58, 95];

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(255,255,255);
    doc.text('CQS', margin, 9);
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text('Checklist Qualité Soudure', margin + 16, 9);
    const headerRight = `${primaryOf.projetLabel} › ${primaryOf.organeLabel}   ·   ${primaryOf.date}`;
    doc.text(headerRight, pageW - margin, 9, { align: 'right' });
    // OF bar
    doc.setFillColor(15, 40, 70);
    doc.rect(0, 14, pageW, 8, 'F');
    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(255, 255, 255);
    const safeOfLabel = (displayOfNum && !displayOfNum.startsWith('AUTO-')) ? displayOfNum : '—';
    doc.text(`OF : ${safeOfLabel}`, margin, 19.5);
    doc.setTextColor(0, 0, 0);

    let y = 27;

    function checkPageBreak(needed) {
      if (y + needed > pageH - 10) { doc.addPage(); y = 10; }
    }

    function renderOpBlock(opKey, op, ofDate) {
      const cordonsData = Object.entries(op.cordons||{})
        .sort((a,b) => +a[0]-+b[0])
        .map(([num, statut]) => [
          num,
          statut === 'ok' ? 'OK' : statut === 'retouche' ? 'Retouché' : 'Non Conf.',
        ]);
      const seData = (op.sousEnsembles||[])
        .filter(se => (se.opNum||'').trim() || (se.numD||'').trim() || (se.numG||'').trim())
        .map(se => [se.opNum||'', se.numD||'', se.retoucheD?'Oui':'Non', se.numG||'', se.retoucheG?'Oui':'Non']);

      const estimH = 9 + Math.ceil(cordonsData.length * 5.5) + (seData.length > 0 ? 20 : 0) + ((images[opKey]?.length || 0) * 43) + (op.commentaire ? 6 : 0);
      checkPageBreak(Math.min(estimH, 60));

      const sl = op.conformite === 'non-conforme' ? 'Non Conforme' : op.conformite === 'retouche' ? 'Retouché' : (STATUS_LABEL[op.status] || op.status);
      const [sr, sg, sb] = op.conformite === 'non-conforme' ? [220,38,38] : (STATUS_COLORS[op.status] || [120,120,120]);
      const meta = [
        op.ipn      ? `IPN : ${op.ipn}`        : null,
        op.pieceNum ? `Pièce : ${op.pieceNum}` : null,
        op.ofNum    ? `OF : ${op.ofNum}`        : null,
        ofDate      ? `Date : ${ofDate}`        : null,
      ].filter(Boolean).join('   ·   ');
      const rowH = meta ? 13 : 7;
      doc.setFillColor(sr, sg, sb);
      doc.rect(margin, y, 2.5, rowH, 'F');
      doc.setFillColor(248, 248, 248);
      doc.rect(margin + 2.5, y, inner - 2.5, rowH, 'F');
      doc.setFontSize(9.5); doc.setFont(undefined, 'bold'); doc.setTextColor(...ACCENT);
      doc.text(opKey, margin + 5, y + 5);
      doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(sr, sg, sb);
      doc.text(sl, pageW - margin - 3, y + 5, { align: 'right' });
      if (meta) {
        doc.setFontSize(7.5); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
        doc.text(meta, margin + 5, y + 10.5);
      }
      doc.setTextColor(0, 0, 0);
      y += rowH + 2;

      if (op.commentaire) {
        doc.setFontSize(7.5); doc.setFont(undefined, 'italic'); doc.setTextColor(90, 90, 90);
        const lines = doc.splitTextToSize(`Note : ${op.commentaire}`, inner - 4);
        doc.text(lines, margin + 3, y + 4);
        y += lines.length * 4 + 2;
        doc.setTextColor(0, 0, 0);
      }

      const hasC  = cordonsData.length > 0;
      const hasSe = seData.length > 0;
      const tStyle = { fontSize: 7.5, cellPadding: 1.4, lineWidth: 0.1, lineColor: [210,210,210] };
      const hStyle = { fillColor: ACCENT, textColor: [255,255,255], fontSize: 7.5, fontStyle: 'bold', cellPadding: 1.8 };

      if (hasC) {
        doc.autoTable({
          startY: y, head: [['Cordon','Statut']],
          body: cordonsData,
          theme: 'plain', margin: { left: margin }, tableWidth: inner,
          styles: tStyle, headStyles: hStyle,
          columnStyles: { 0:{ fontStyle:'bold', cellWidth:28 }, 1:{ cellWidth:24, halign:'center' } },
          didParseCell: d => {
            if (d.section==='body' && d.column.index===1) {
              const v = d.cell.raw;
              d.cell.styles.textColor = v==='OK' ? [22,163,74] : v==='Retouché' ? [217,119,6] : [220,38,38];
              d.cell.styles.fontStyle = 'bold';
            }
            if (d.row.index % 2 === 0 && d.section==='body') d.cell.styles.fillColor = [252,252,252];
          },
        });
        y = doc.lastAutoTable.finalY + 3;
      }

      if (hasSe) {
        doc.autoTable({
          startY: y, head: [['OP n°','N° D','Ret.D','N° G','Ret.G']],
          body: seData,
          theme: 'plain', margin: { left: margin }, tableWidth: inner,
          styles: tStyle, headStyles: hStyle,
          columnStyles: { 0:{cellWidth:28, fontStyle:'bold'}, 1:{cellWidth:'auto'}, 2:{cellWidth:14,halign:'center'}, 3:{cellWidth:'auto'}, 4:{cellWidth:14,halign:'center'} },
          didParseCell: d => {
            if (d.section==='body' && (d.column.index===2 || d.column.index===4)) {
              d.cell.styles.textColor = d.cell.raw==='Oui' ? [217,119,6] : [180,180,180];
              d.cell.styles.fontStyle = d.cell.raw==='Oui' ? 'bold' : 'normal';
            }
            if (d.row.index % 2 === 0 && d.section==='body') d.cell.styles.fillColor = [252,252,252];
          },
        });
        y = doc.lastAutoTable.finalY + 3;
      }

      if (hasC || hasSe) y += 1;

      for (const imgData of (images[opKey] || [])) {
        checkPageBreak(44);
        try {
          doc.addImage(imgData, 'JPEG', margin, y, 70, 40);
          y += 43;
        } catch(e) {}
      }

      // Photos (Feature 2)
      if (op.photos && op.photos.length > 0) {
        for (const photo of op.photos) {
          if (!photo.imageData) continue;
          checkPageBreak(52);
          const pLabel = photo.cordonNum ? `Photo — Cordon ${photo.cordonNum}` : 'Photo';
          doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(...ACCENT);
          doc.text(pLabel, margin + 2, y + 5);
          y += 7;
          try {
            doc.addImage(photo.imageData, 'JPEG', margin, y, 80, 45);
            y += 47;
          } catch(e) {}
        }
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }

    // Iterate opsList; for each opKey collect all verifs from all OFs
    for (const opKey of (primaryOf.opsList || [])) {
      for (const of of allOfs) {
        const op = of.ops?.[opKey];
        if (op && op.status !== 'todo' && op.status !== 'inprogress') {
          renderOpBlock(opKey, op, of.date);
        }
      }
    }

    // ── Footer on each page ───────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(160,160,160);
      doc.text(`CQS · OF ${safeOfLabel} · ${primaryOf.projetLabel} › ${primaryOf.organeLabel}`, margin, pageH - 5);
      doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' });
    }

    doc.save(`CQS-OF-${safeOfLabel}.pdf`);
  }

  function findOrganeOfs() {
    return Object.values(ofs)
      .filter(o => o.organeId === filter?.organeId)
      .sort((a, b) => new Date(b.date||0) - new Date(a.date||0));
  }
  function findOrganeOf() {
    return findOrganeOfs()[0] || null;
  }

  function openDeleteSelectModal() {
    const allOfs = findOrganeOfs();
    if (!allOfs.length) return;
    setDeleteSelectModal(allOfs.map(of => ({ ...of, selected: true })));
  }

  function openExportModal() {
    const allOfs = findOrganeOfs();
    const ofNums = allOfs.flatMap(of => Object.values(of.ops || {}).map(op => op.ofNum)).filter(Boolean);
    setExportOfNum(ofNums[0] || '');
    setExportModal(true);
  }

  function handleExportAll() {
    const allOfs = findOrganeOfs();
    if (!allOfs.length) {
      setExportError("Aucune vérification n'a encore été créée pour cet organe. Créez au moins une pièce avant d'exporter.");
      return;
    }
    const hasDone = allOfs.some(of =>
      (of.opsList||[]).some(k => { const st = of.ops?.[k]?.status; return st === 'done' || st === 'nok'; })
    );
    if (!hasDone) {
      setExportError("Aucune opération n'est encore validée. Complétez au moins une vérification avant d'exporter.");
      return;
    }
    const inProgressSet = new Set();
    allOfs.forEach(of => (of.opsList||[]).forEach(k => { if (of.ops?.[k]?.status === 'inprogress') inProgressSet.add(k); }));
    if (inProgressSet.size > 0) {
      setPdfBlockModal({ inProgressOps: [...inProgressSet] });
      return;
    }
    openExportModal();
  }

  async function handleExportConfirm() {
    setExportModal(false);
    if (!window.jspdf) { setExportError("La bibliothèque PDF n'est pas chargée. Vérifiez votre connexion internet et rechargez la page."); return; }
    await handlePdfOf(exportOfNum);
  }

  async function handleDeleteAll() {
    const allOfs = findOrganeOfs();
    if (!allOfs.length) return;
    setOfs(prev => {
      const next = { ...prev };
      allOfs.forEach(of => delete next[of.id]);
      return next;
    });
    for (const of of allOfs) {
      await API.deleteOf(of.id).catch(console.error);
    }
    setDeleteConfirm(null);
  }

  function handleNewVerif(opKey, piece) {
    const found = findOrgane(config, filter?.organeId);
    const opDef = found?.organe?.ops?.find(o => o.key === opKey);
    const draft = opDef
      ? makeEmptyOp(opDef)
      : { status:'todo', pieceNum:'', ipn:'', sousEnsembles:[], cordons:{}, conformite:null, commentaire:'' };
    // Always create a new verif — never overwrite existing
    setDraftOp({ ...draft, pieceNum: piece || '', ipn: userIpn || draft.ipn });
    setCurOF(null);
    setCurOP(opKey); setCurPiece(piece || null);
    setView('wizard');
  }

  function handleSelectVerif(ofId, opKey) {
    setCurOF(ofId);
    setCurOP(opKey);
    setCurPiece(null);
    setDraftOp(null);
    setView('wizard');
  }

  async function handleOpStart() {
    if (!curOF) return;
    const op = ofs[curOF]?.ops?.[curOP];
    if (!op || op.status !== 'todo') return;
    const updated = { ...op, status:'inprogress', ipn: userIpn };
    setOfs(prev => ({
      ...prev,
      [curOF]: { ...prev[curOF], ops: { ...prev[curOF].ops, [curOP]: updated } },
    }));
    await API.saveVerif({
      ofId: curOF, opKey: curOP,
      organeId:    ofs[curOF].organeId,
      organeLabel: ofs[curOF].organeLabel,
      projetId:    ofs[curOF].projetId,
      projetLabel: ofs[curOF].projetLabel,
      date:        ofs[curOF].date,
      opsList:     ofs[curOF].opsList,
      opData:      updated,
    }).catch(console.error);
  }

  // ── Loading screen ──
  if (isLoading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--accent,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}>
        <div style={{ fontSize:54, fontWeight:900, color:'#fff', letterSpacing:-2, lineHeight:1 }}>CQS</div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.6)' }}>Chargement…</div>
        {loadError && (
          <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px 20px', borderRadius:10, fontSize:14, maxWidth:400, textAlign:'center' }}>
            Erreur : {loadError}<br /><small style={{opacity:0.7}}>Vérifiez que la base de données est configurée (setup.sql)</small>
          </div>
        )}
      </div>
    );
  }

  if (!config) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#f4f3ef', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      {!userIpn && <IPNLoginScreen onLogin={handleLoginIpn} />}
      {userIpn && (view === 'home' || view === 'select') && (
        <ProjetSelectScreen config={config} ofs={ofs} userIpn={userIpn} initial={filter}
          organeOfs={findOrganeOfs()}
          onPickFilter={handlePickFilter}
          onSelectVerif={handleSelectVerif}
          onNewOF={handleNewVerif}
          onDeleteOF={id => setDeleteConfirm(id)}
          onExport={handleExportAll}
          onDeleteAll={openDeleteSelectModal}
          onPdfOF={handlePdfOf}
          onManager={() => setView('manager')}
          onLogout={handleLogout} />
      )}
      {userIpn && view === 'wizard' && curOP && (curOF ? ofs[curOF] : draftOp) && (
        <OPForm
          ofId={curOF||''} opKey={curOP}
          opData={curOF ? (ofs[curOF]?.ops?.[curOP] || draftOp || {}) : (draftOp || {})}
          organeLabel={curOF ? (ofs[curOF]?.organeLabel||'') : (filter?.organeLabel||'')}
          projetLabel={curOF ? (ofs[curOF]?.projetLabel||'') : (filter?.projetLabel||'')}
          organeId={curOF ? (ofs[curOF]?.organeId||'') : (filter?.organeId||'')}
          initialPiece={curPiece}
          userIpn={userIpn}
          onStart={handleOpStart}
          onBack={() => { setCurOP(null); setCurPiece(null); setDraftOp(null); setView('home'); }}
          onSave={handleComplete}
        />
      )}
      {pdfBlockModal && (
        <div onClick={() => setPdfBlockModal(null)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:400, width:'100%', padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="clipboardCheck" size={22} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#1f2937' }}>Export PDF bloqué</div>
                <div style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>Les opérations suivantes sont encore en cours :</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'16px 0' }}>
              {pdfBlockModal.inProgressOps.map(opKey => (
                <button key={opKey} onClick={() => {
                  const ofForOp = findOrganeOfs().find(of => of.ops?.[opKey]?.status === 'inprogress');
                  setPdfBlockModal(null);
                  if (ofForOp) { setCurOF(ofForOp.id); setCurOP(opKey); setCurPiece(null); setView('wizard'); }
                }} style={{
                  background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:10,
                  padding:'12px 16px', cursor:'pointer', fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />
                    <span style={{ fontSize:15, fontWeight:700, color:'#92400e' }}>{opKey}</span>
                    <span style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>En cours</span>
                  </div>
                  <Icon name="chevronRight" size={16} color="#d97706" />
                </button>
              ))}
            </div>
            <div style={{ fontSize:13, color:'#9ca3af', marginBottom:16 }}>Cliquez sur une opération pour la finaliser, ou exportez quand même — les OP en cours seront exclues du PDF.</div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" onClick={() => setPdfBlockModal(null)} extraStyle={{ flex:1 }}>Annuler</Btn>
              <Btn variant="primary" onClick={() => { setPdfBlockModal(null); openExportModal(); }} extraStyle={{ flex:2 }}>Exporter quand même</Btn>
            </div>
          </div>
        </div>
      )}
      {exportError && (
        <div onClick={() => setExportError(null)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:360, width:'100%', padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:22 }}>⛔</span>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#dc2626' }}>Export impossible</div>
            </div>
            <div style={{ fontSize:14, color:'#4b5563', lineHeight:1.55, marginBottom:20 }}>{exportError}</div>
            <Btn variant="secondary" onClick={() => setExportError(null)} full>OK</Btn>
          </div>
        </div>
      )}
      {exportModal && (
        <div onClick={() => setExportModal(false)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:380, width:'100%', padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--accent,#1e3a5f)', marginBottom:6 }}>Numéro d'OF</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Ce numéro identifiera le rapport — il apparaîtra sur toutes les pages du PDF.</div>
            <FieldInput label="N° OF" value={exportOfNum} onChange={setExportOfNum} placeholder="ex : 2024-089" required />
            {!exportOfNum.trim() && (
              <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:10, padding:'8px 12px', background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:8 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>Le numéro d'OF est obligatoire avant de générer le PDF.</span>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <Btn variant="secondary" onClick={() => setExportModal(false)} extraStyle={{ flex:1, minHeight:46 }}>Annuler</Btn>
              <Btn variant="primary" onClick={handleExportConfirm} disabled={!exportOfNum.trim()} extraStyle={{ flex:2, minHeight:46 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Générer le PDF
              </Btn>
            </div>
          </div>
        </div>
      )}
      {deleteSelectModal && (() => {
        const toDeleteCount = deleteSelectModal.filter(o => o.selected).length;
        return (
          <div onClick={() => setDeleteSelectModal(null)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)', display:'flex', alignItems:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'#fff', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:540, margin:'0 auto',
              display:'flex', flexDirection:'column', maxHeight:'82vh',
            }}>
              <div style={{ padding:'20px 16px 12px', borderBottom:'1px solid #f0ede8', flexShrink:0 }}>
                <div style={{ fontSize:17, fontWeight:800, color:'#dc2626' }}>Supprimer des vérifications</div>
                <div style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>Décochez les pièces / OF à conserver. Les cases cochées seront supprimées.</div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                  <button onClick={() => setDeleteSelectModal(prev => prev.map(o => ({ ...o, selected: true })))} style={{
                    flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px', cursor:'pointer',
                    background:'#f8f7f5', fontFamily:'inherit', fontSize:13, fontWeight:600, color:'#374151',
                  }}>Tout sélectionner</button>
                  <button onClick={() => setDeleteSelectModal(prev => prev.map(o => ({ ...o, selected: false })))} style={{
                    flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'7px', cursor:'pointer',
                    background:'#f8f7f5', fontFamily:'inherit', fontSize:13, fontWeight:600, color:'#374151',
                  }}>Tout désélectionner</button>
                </div>
                {deleteSelectModal.map((of, idx) => {
                  const opEntries = Object.entries(of.ops || {}).filter(([, v]) => v.status && v.status !== 'todo');
                  const pieces = [...new Set(opEntries.map(([, v]) => v.pieceNum).filter(Boolean))];
                  const ofNums = [...new Set(opEntries.map(([, v]) => v.ofNum).filter(Boolean))];
                  const label = [...pieces, ...ofNums].join(' / ') || `ID ${of.id}`;
                  return (
                    <div key={of.id} onClick={() => setDeleteSelectModal(prev => prev.map((o, i) => i === idx ? { ...o, selected: !o.selected } : o))} style={{
                      display:'flex', alignItems:'center', gap:12,
                      background: of.selected ? '#fef2f2' : '#f8f7f5',
                      borderRadius:12, padding:'12px 14px',
                      border:`1.5px solid ${of.selected ? '#fca5a5' : '#eceae6'}`,
                      cursor:'pointer',
                    }}>
                      <div style={{
                        width:22, height:22, borderRadius:6, flexShrink:0,
                        border:`2px solid ${of.selected ? '#dc2626' : '#d1d5db'}`,
                        background: of.selected ? '#dc2626' : '#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {of.selected && <Icon name="check" size={12} color="#fff" />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color: of.selected ? '#dc2626' : 'var(--accent,#1e3a5f)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
                        {of.date && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{of.date}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:'12px 16px 32px', borderTop:'1px solid #f0ede8', flexShrink:0, display:'flex', gap:10 }}>
                <Btn variant="secondary" onClick={() => setDeleteSelectModal(null)} extraStyle={{ flex:1, minHeight:46 }}>Annuler</Btn>
                <button
                  onClick={async () => {
                    const toDelete = deleteSelectModal.filter(o => o.selected);
                    setDeleteSelectModal(null);
                    if (!toDelete.length) return;
                    setOfs(prev => { const next = { ...prev }; toDelete.forEach(o => delete next[o.id]); return next; });
                    for (const o of toDelete) await API.deleteOf(o.id).catch(console.error);
                  }}
                  disabled={toDeleteCount === 0}
                  style={{
                    flex:2, minHeight:46, border:'none', borderRadius:10, cursor: toDeleteCount > 0 ? 'pointer' : 'default',
                    background: toDeleteCount > 0 ? '#dc2626' : '#f0ede8',
                    color: toDeleteCount > 0 ? '#fff' : '#9ca3af',
                    fontFamily:'inherit', fontSize:15, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  }}
                >
                  <Icon name="trash" size={16} color={toDeleteCount > 0 ? '#fff' : '#9ca3af'} />
                  Supprimer ({toDeleteCount})
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(20,28,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, maxWidth:380, width:'100%', padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="trash" size={20} color="#dc2626" />
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#1f2937' }}>Supprimer la vérification</div>
            </div>
            <div style={{ fontSize:14, color:'#6b7280', lineHeight:1.5, marginBottom:20 }}>
              Supprimer cette vérification ? Cette action est irréversible.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" onClick={() => setDeleteConfirm(null)} extraStyle={{ flex:1, minHeight:46 }}>Annuler</Btn>
              <button onClick={() => handleDeleteOf(deleteConfirm)} style={{
                flex:1, minHeight:46, border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                background:'#dc2626', color:'#fff', fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                <Icon name="trash" size={16} color="#fff" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {userIpn && view === 'manager' && (
        <ManagerScreen config={config} onSaveConfig={handleSaveConfig} onBack={() => setView('home')} />
      )}
      {showTweaks && (
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks}
          onClose={() => { setShowTweaks(false); window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); }} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
