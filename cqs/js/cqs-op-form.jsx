// cqs-op-form.jsx — Formulaire OP page unique (style Excel)

function OPForm({ ofId, opKey, opData, organeLabel, projetLabel, initialPiece, userIpn, onStart, onBack, onSave }) {
  const [form, setForm] = React.useState({
    pieceNum:      opData.pieceNum || initialPiece || '',
    ofNum:         ofId || '',
    ipn:           opData.ipn || userIpn || '',
    sousEnsembles: (opData.sousEnsembles || []).map(se => ({ ...se })),
    cordons:       Object.fromEntries(Object.entries(opData.cordons || {}).map(([k,v]) => [k, v ?? 'ok'])),
    retouches:     { ...(opData.retouches || {}) },
    commentaire:   opData.commentaire || '',
    conformite:    opData.conformite || null,
  });
  const [started, setStarted] = React.useState(false);

  // Toujours arriver en haut de la page de vérification
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const cordonsNums = Object.keys(form.cordons).map(Number).sort((a,b) => a-b);
  const nokCount  = Object.values(form.cordons).filter(v => v === 'nok').length;
  const okCount   = Object.values(form.cordons).filter(v => v === 'ok').length;
  const isConforme = form.conformite === 'conforme';

  // Auto-conformité quand les cordons changent
  React.useEffect(() => {
    if (cordonsNums.length === 0) return;
    setForm(f => ({ ...f, conformite: nokCount > 0 ? 'non-conforme' : 'conforme' }));
  }, [nokCount]);

  function touch() {
    if (!started) { setStarted(true); onStart?.(); }
  }
  function setField(k, v)        { touch(); setForm(f => ({ ...f, [k]: v })); }
  function setCordon(num, val)   { touch(); setForm(f => ({ ...f, cordons: { ...f.cordons, [num]: val } })); }
  function setRetouche(num, val) { touch(); setForm(f => ({ ...f, retouches: { ...f.retouches, [num]: val } })); }
  function updateSE(i, fld, val) {
    touch();
    setForm(f => ({ ...f, sousEnsembles: f.sousEnsembles.map((s, idx) => idx === i ? { ...s, [fld]: val } : s) }));
  }

  function handleSave() {
    const status = form.conformite === 'conforme' ? 'done' : 'nok';
    onSave(opKey, { ...form, status });
  }

  const canSave = form.pieceNum.trim() !== '';

  // ─── Sous-ensembles table (style fiche papier) ───
  const SousEnsTable = () => {
    const cell = { border:'1.5px solid #1f2937', padding:0 };
    const headCell = { ...cell, padding:'7px 6px', textAlign:'center', fontSize:13, fontWeight:700, color:'#1f2937', whiteSpace:'pre-line', lineHeight:1.15 };
    const inputStyle = { border:'none', background:'transparent', padding:'9px 8px', fontSize:14, fontFamily:'inherit', width:'100%', outline:'none', textAlign:'center', boxSizing:'border-box' };
    return (
      <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
        <thead>
          <tr>
            <th colSpan={5} style={{ ...cell, padding:'8px 6px', textAlign:'center', fontSize:15, fontWeight:800, color:'#1f2937', letterSpacing:0.3 }}>
              Sous ensembles utilisés
            </th>
          </tr>
          <tr>
            <th style={{ ...headCell, width:'20%' }}>{'OP n°'}</th>
            <th style={{ ...headCell, width:'22%' }}>{'N° Pièce\nD'}</th>
            <th style={{ ...headCell, width:'16%' }}>{'Retouché\nO/N'}</th>
            <th style={{ ...headCell, width:'22%' }}>{'N° Pièce\nG'}</th>
            <th style={{ ...headCell, width:'16%' }}>{'Retouché\nO/N'}</th>
          </tr>
        </thead>
        <tbody>
          {form.sousEnsembles.length === 0 ? (
            <tr><td colSpan={5} style={{ ...cell, padding:'14px', textAlign:'center', fontSize:13, color:'#9ca3af', fontStyle:'italic' }}>Aucun sous-ensemble requis</td></tr>
          ) : form.sousEnsembles.map((se, i) => (
            <tr key={i}>
              <td style={{ ...cell, textAlign:'center', fontWeight:700, color:'var(--accent,#1e3a5f)', fontSize:14 }}>{se.label}</td>
              <td style={cell}>
                <input value={se.numD} onChange={e => updateSE(i,'numD',e.target.value)} style={inputStyle} />
              </td>
              <td style={{ ...cell, textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <CheckCell checked={se.retoucheD} onChange={v => updateSE(i,'retoucheD',v)} color="#dc2626" alwaysOutline />
                </div>
              </td>
              <td style={cell}>
                <input value={se.numG} onChange={e => updateSE(i,'numG',e.target.value)} style={inputStyle} />
              </td>
              <td style={{ ...cell, textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <CheckCell checked={se.retoucheG} onChange={v => updateSE(i,'retoucheG',v)} color="#dc2626" alwaysOutline />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ─── Cordon table ───
  const CordonTable = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--accent,#1e3a5f)', padding:'9px 14px', borderRadius:'10px 10px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:0.8 }}>Conformité Soudure</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{okCount}/{cordonsNums.length} OK</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', border:'1.5px solid #e5e3de', borderTop:'none', borderRadius:'0 0 10px 10px' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ position:'sticky', top:0, zIndex:1 }}>
            <tr style={{ background:'#f8f7f5', borderBottom:'2px solid #e5e3de' }}>
              <th style={{ padding:'7px 10px', textAlign:'left', fontSize:12, color:'#374151', fontWeight:700 }}>Cordons</th>
              <th style={{ padding:'7px 6px', textAlign:'center', fontSize:12, color:'#16a34a', fontWeight:700, width:40 }}>OK</th>
              <th style={{ padding:'7px 6px', textAlign:'center', fontSize:12, color:'#dc2626', fontWeight:700, width:40 }}>N</th>
              <th style={{ padding:'7px 6px', textAlign:'center', fontSize:12, color:'#d97706', fontWeight:700, width:48 }}>Ret.</th>
            </tr>
          </thead>
          <tbody>
            {cordonsNums.length === 0 ? (
              <tr><td colSpan={4} style={{ padding:'16px', textAlign:'center', fontSize:13, color:'#d1d5db', fontStyle:'italic' }}>Aucun cordon défini</td></tr>
            ) : cordonsNums.map((num) => {
              const val = form.cordons[num];
              const ret = !!form.retouches[num];
              const isOk  = val === 'ok';
              const isNok = val === 'nok';
              return (
                <tr key={num} style={{ borderBottom:'1px solid #f0ede8', background: isNok ? '#fff8f5' : 'transparent' }}>
                  <td style={{ padding:'5px 10px', fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)', whiteSpace:'nowrap' }}>C {num}</td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={isOk} onChange={v => setCordon(num, v ? 'ok' : null)} color="#16a34a" />
                  </td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={isNok} onChange={v => setCordon(num, v ? 'nok' : null)} color="#dc2626" />
                  </td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={ret && isNok} onChange={v => setRetouche(num, v)} color="#d97706" disabled={!isNok} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background:'var(--accent,#1e3a5f)',
        boxShadow:'0 2px 12px rgba(0,0,0,0.22)',
      }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 12px', height:52 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, color:'#fff', width:38, height:38, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="arrowLeft" size={20} color="#fff" />
          </button>
          <div style={{ display:'flex', gap:0, flex:1, flexWrap:'wrap', alignItems:'center', overflow:'hidden' }}>
            {[
              ['Projet', projetLabel || '—'],
              ['Organe', organeLabel || '—'],
              ['OP',     opKey],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, marginRight:16 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase' }}>{lbl}</span>
                <span style={{ fontSize:15, color:'#fff', fontWeight:800 }}>{val}</span>
              </div>
            ))}
            {/* OF — champ libre */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:8 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap' }}>OF</span>
              <input
                value={form.ofNum}
                onChange={e => setField('ofNum', e.target.value)}
                placeholder="n° OF"
                style={{ background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:6, padding:'3px 9px', fontSize:15, fontWeight:800, color:'#fff', fontFamily:'inherit', outline:'none', width:110 }}
              />
            </div>
          </div>
          {/* Bouton photo — facultatif */}
          <button type="button" title="Prendre une photo (facultatif)" style={{
            display:'flex', alignItems:'center', gap:7, flexShrink:0,
            background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.28)',
            borderRadius:8, padding:'8px 12px', cursor:'pointer', fontFamily:'inherit',
            fontSize:13, fontWeight:700, color:'#fff', height:38,
          }}>
            <Icon name="camera" size={18} color="#fff" />
            <span style={{ whiteSpace:'nowrap' }}>Photo</span>
          </button>
        </div>

        {/* Info row */}
        <div style={{ background:'rgba(0,0,0,0.18)', padding:'6px 12px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {/* n° Pièce */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap' }}>n° Pièce</span>
            <input value={form.pieceNum}
              onChange={e => setField('pieceNum', e.target.value)}
              placeholder="ex : 087-D-001"
              style={{ background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:6, padding:'4px 10px', fontSize:14, fontWeight:700, color:'#fff', fontFamily:'inherit', outline:'none', width:140 }}
            />
          </div>
          {/* IPN */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon name="user" size={13} color="rgba(255,255,255,0.5)" />
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{form.ipn || '—'}</span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ paddingTop:100, paddingBottom:76, background:'#f4f3ef', minHeight:'100vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'12px 12px 0' }}>

          {/* Ligne 1 : Sous-ensembles + Commentaires */}
          <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px', background:'#fff', borderRadius:12, border:'1.5px solid #e8e5e0', padding:'14px 16px' }}>
              {SousEnsTable()}
            </div>
            <div style={{ flex:'1 1 260px', background:'#fff', borderRadius:12, border:'1.5px solid #e8e5e0', padding:'14px 16px', display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Infos et Commentaires</div>
              <textarea value={form.commentaire}
                onChange={e => setField('commentaire', e.target.value)}
                placeholder="Observations, défauts constatés…"
                style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, fontFamily:'inherit', resize:'none', outline:'none', minHeight:90 }}
              />
            </div>
          </div>

          {/* Ligne 2 : Schéma + Cordons */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'stretch' }}>
            {/* Schéma (gauche) */}
            <div style={{ flex:'1 1 400px', background:'#fff', borderRadius:12, border:'1.5px solid #e8e5e0', minHeight:320, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:20 }}>
              <Icon name="clipboardCheck" size={52} color="#e5e3de" />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#9ca3af' }}>Fiche schéma à l'opération</div>
                <div style={{ fontSize:12, color:'#d1d5db', marginTop:4 }}>Zone réservée — image à venir</div>
              </div>
            </div>

            {/* Cordons (droite) */}
            <div style={{ flex:'0 1 260px', minWidth:220 }}>
              {CordonTable()}
            </div>
          </div>



        </div>
      </div>

      {/* ── Footer sticky ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'#fff', borderTop:'1.5px solid #e8e5e0', padding:'10px 12px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', gap:10 }}>
          <Btn variant="secondary" onClick={onBack} extraStyle={{ flex:1, minHeight:48 }}>
            <Icon name="arrowLeft" size={16} /> Retour
          </Btn>
          <Btn variant="ok" onClick={handleSave} disabled={!canSave} extraStyle={{ flex:3, minHeight:48 }}>
            <Icon name="check" size={18} color="#fff" /> Valider la pièce
          </Btn>
        </div>
      </div>
    </>
  );
}

// ─── CheckCell : petite case à cocher stylisée ───
function CheckCell({ checked, onChange, color = '#16a34a', disabled = false, alwaysOutline = false }) {
  const emptyBorder = alwaysOutline ? color : '#e5e7eb';
  return (
    <button onClick={() => !disabled && onChange(!checked)} style={{
      width:34, height:34, borderRadius:6, cursor: disabled ? 'default' : 'pointer',
      border:`2px solid ${checked && !disabled ? color : emptyBorder}`,
      background: checked && !disabled ? color : '#fff',
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: disabled ? 0.25 : 1, transition:'all 0.12s',
      flexShrink:0,
    }}>
      {checked && !disabled && <Icon name="check" size={15} color="#fff" />}
    </button>
  );
}

Object.assign(window, { OPForm, CheckCell });
