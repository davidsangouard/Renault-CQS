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
function OPSelectCard({ opDef, index, active, onClick }) {
  const totC = (opDef.cordons || []).length;
  const totP = (opDef.pieces || []).length;
  const parts = [];
  parts.push(totC > 0 ? `${totC} cordons` : 'Aucun cordon');
  if (totP > 0) parts.push(`${totP} pièce${totP > 1 ? 's' : ''}`);
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
      padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer',
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
function ProjetSelectScreen({ config, ofs, userIpn, initial, onPickFilter, onSelectOF, onNewOF, onManager, onLogout }) {
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
                  {opDefs.map((opDef, idx) => (
                    <OPSelectCard key={opDef.key} opDef={opDef} index={idx}
                      active={selOpKey === opDef.key}
                      onClick={() => pickOp(opDef.key)} />
                  ))}
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
                    <button onClick={() => onNewOF(selOpKey)} style={{
                      width:'100%', border:'none', borderRadius:12, cursor:'pointer',
                      background:'var(--accent,#1e3a5f)', color:'#fff', fontFamily:'inherit',
                      padding:'18px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                      fontSize:17, fontWeight:800, boxShadow:'0 3px 14px rgba(30,58,95,0.28)',
                    }}>
                      <Icon name="plus" size={22} color="#fff" />
                      Créer
                    </button>

                    {/* Pièces de l'OP — cliquables → page de vérif */}
                    {opPieces.length > 0 && (
                      <div style={{ marginTop:20 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                          Pièces
                          <span style={{ color:'#c4c0ba', fontWeight:600, textTransform:'none', letterSpacing:0 }}>· {selOpKey}</span>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {opPieces.map(piece => (
                            <button key={piece} onClick={() => onNewOF(selOpKey, piece)} style={{
                              background:'#fff', borderRadius:12, border:'1.5px solid #e8e5e0', cursor:'pointer',
                              padding:'12px 16px', display:'flex', alignItems:'center', gap:12, width:'100%',
                              fontFamily:'inherit', textAlign:'left',
                            }}>
                              <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                                background:'color-mix(in srgb, var(--accent,#1e3a5f) 10%, transparent)',
                                display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon name="layers" size={17} color="var(--accent,#1e3a5f)" />
                              </div>
                              <span style={{ flex:1, minWidth:0, fontSize:15, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>{piece}</span>
                              <Icon name="chevronRight" size={16} color="#c4c0ba" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Liste des OF existants */}
                    <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.8, textTransform:'uppercase', margin:'20px 0 10px', display:'flex', alignItems:'center', gap:6 }}>
                      Ordres de fabrication
                      <span style={{ color:'#c4c0ba', fontWeight:600, textTransform:'none', letterSpacing:0 }}>· {selOpKey}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {ofList.length === 0 && (
                        <div style={{ textAlign:'center', padding:'24px 20px', color:'#9ca3af', background:'#fff', border:'1.5px solid #e8e5e0', borderRadius:12 }}>
                          <Icon name="clipboardCheck" size={36} color="#d1d5db" />
                          <div style={{ fontSize:14, fontWeight:700, marginTop:8, color:'#6b7280' }}>Aucun OF pour ce poste</div>
                        </div>
                      )}
                      {ofList.map(of => (
                        <OFCard key={of.id} of={of} opKey={selOpKey} onClick={() => onSelectOF(of.id, selOpKey, null)} />
                      ))}
                    </div>
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
  const [config, setConfig] = useState(() => loadConfig());
  const [userIpn, setUserIpn] = useState(() => {
    try { return localStorage.getItem('cqs_ipn') || null; } catch { return null; }
  });
  const [filter, setFilter] = useState(() => {
    try { const s = localStorage.getItem('cqs_filter'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [ofs, setOfs] = useState(() => {
    try {
      const cfg = loadConfig();
      const s = localStorage.getItem('cqs_v3');
      const data = s ? JSON.parse(s) : makeDemoData(cfg);
      // Migration : backfill projetLabel/organeLabel manquants
      const firstProjet = cfg.projets?.[0];
      const firstOrgane = firstProjet?.organes?.[0];
      Object.values(data).forEach(of => {
        if (!of.projetLabel || !of.organeLabel) {
          const found = of.organeId ? findOrgane(cfg, of.organeId) : null;
          const proj  = found?.projet || firstProjet;
          const org   = found?.organe || firstOrgane;
          if (proj) { of.projetId = of.projetId || proj.id; of.projetLabel = of.projetLabel || proj.label; }
          if (org)  { of.organeId = of.organeId || org.id;  of.organeLabel = of.organeLabel || org.label; }
        }
      });
      return data;
    } catch { return makeDemoData(loadConfig()); }
  });  const [view, setView]       = useState('home');
  const [curOF, setCurOF]     = useState(null);
  const [curOP, setCurOP]     = useState(null);
  const [curPiece, setCurPiece] = useState(null);
  const [draftOp, setDraftOp] = useState(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [tweaks, setTweaks]   = useState(TWEAK_DEFAULTS);

  // Persist tweaks → CSS vars on :root
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accentColor);
    document.documentElement.style.setProperty('--cordon-h', tweaks.largeCordons ? '66px' : '52px');
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*'); } catch {}
  }, [tweaks]);

  useEffect(() => {
    try { localStorage.setItem('cqs_v3', JSON.stringify(ofs)); } catch {}
  }, [ofs]);

  // Tweaks toggle from host toolbar
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode')   setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  function handleLoginIpn(ipn) {
    setUserIpn(ipn);
    try { localStorage.setItem('cqs_ipn', ipn); } catch {}
  }

  function handlePickFilter(f) {
    setFilter(f);
    try { localStorage.setItem('cqs_filter', JSON.stringify(f)); } catch {}
  }

  function handleLogout() {
    setUserIpn(null); setFilter(null);
    try { localStorage.removeItem('cqs_ipn'); localStorage.removeItem('cqs_filter'); } catch {}
  }

  function handleSaveConfig(newCfg) {
    saveConfig(newCfg);
    setConfig(newCfg);
  }

  function handleComplete(opKey, formData) {
    const status = formData.conformite === 'conforme' ? 'done' : 'nok';
    if (curOF && ofs[curOF]) {
      // OF existant
      setOfs(prev => ({
        ...prev,
        [curOF]: {
          ...prev[curOF],
          ops: { ...prev[curOF].ops, [opKey]: { ...prev[curOF].ops[opKey], ...formData, status } }
        }
      }));
    } else {
      // Création directe depuis la vérif — l'OF est saisi dans le formulaire
      const ofId = (formData.ofNum || '').trim() || `SANS-OF-${Date.now()}`;
      const base = makeEmptyOF(ofId, filter?.organeId, config);
      base.ops[opKey] = { ...(base.ops[opKey] || {}), ...formData, status };
      setOfs(prev => ({ ...prev, [ofId]: base }));
    }
    setCurOP(null);
    setCurPiece(null);
    setDraftOp(null);
    setView('home');
  }

  // Lance une vérification SANS OF : on construit une OP vierge depuis la déf. de l'organe filtré
  function handleNewVerif(opKey, piece) {
    const found = findOrgane(config, filter?.organeId);
    const opDef = found?.organe?.ops?.find(o => o.key === opKey);
    const draft = opDef
      ? makeEmptyOp(opDef)
      : { status:'todo', pieceNum:'', ipn:'', sousEnsembles:[], cordons:{}, retouches:{}, conformite:null, commentaire:'' };
    setDraftOp(draft);
    setCurOF(null);
    setCurOP(opKey);
    setCurPiece(piece || null);
    setView('wizard');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3ef', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {!userIpn && <IPNLoginScreen onLogin={handleLoginIpn} />}
      {userIpn && (view === 'home' || view === 'select') && (
        <ProjetSelectScreen config={config} ofs={ofs} userIpn={userIpn} initial={filter}
          onPickFilter={handlePickFilter}
          onSelectOF={(id, opKey, piece) => {
            setCurOF(id);
            setCurOP(opKey || null);
            setCurPiece(piece || null);
            setView('wizard');
          }}
          onNewOF={handleNewVerif}
          onManager={() => setView('manager')}
          onLogout={handleLogout} />
      )}
      {userIpn && view === 'wizard' && curOP && (curOF ? ofs[curOF] : draftOp) && (
        <OPForm
          ofId={curOF || ''} opKey={curOP}
          opData={curOF ? ofs[curOF].ops[curOP] : draftOp}
          organeLabel={curOF ? (ofs[curOF]?.organeLabel || '') : (filter?.organeLabel || '')}
          projetLabel={curOF ? (ofs[curOF]?.projetLabel || '') : (filter?.projetLabel || '')}
          initialPiece={curPiece}
          userIpn={userIpn}
          onStart={() => {
            if (!curOF) return;
            const op = ofs[curOF].ops[curOP];
            if (op.status === 'todo') {
              setOfs(prev => ({
                ...prev,
                [curOF]: { ...prev[curOF], ops: { ...prev[curOF].ops, [curOP]: {
                  ...prev[curOF].ops[curOP], status: 'inprogress', ipn: userIpn
                }}}
              }));
            }
          }}
          onBack={() => { setCurOP(null); setCurPiece(null); setDraftOp(null); setView('home'); }}
          onSave={handleComplete}
        />
      )}
      {userIpn && view === 'manager' && (
        <ManagerScreen config={config} onSaveConfig={handleSaveConfig} onBack={() => setView('home')} />
      )}
      {showTweaks && (
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks}
          onClose={() => { setShowTweaks(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); }} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
