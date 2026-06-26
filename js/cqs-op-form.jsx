// cqs-op-form.jsx — Formulaire OP page unique (style Excel)

function initSousEns(list) {
  const rows = (list || []).map(se => ({ ...se }));
  while (rows.length < 2) rows.push({ opNum: '', numD: '', numG: '', retoucheD: false, retoucheG: false });
  return rows;
}

function OPForm({ ofId, opKey, opData, organeLabel, projetLabel, organeId, initialPiece, userIpn, onStart, onBack, onSave }) {
  const [form, setForm] = React.useState({
    pieceNum:      opData.pieceNum || initialPiece || '',
    ofNum:         (opData.ofNum) || ((ofId && !ofId.startsWith('AUTO-')) ? ofId : ''),
    ipn:           opData.ipn || userIpn || '',
    sousEnsembles: initSousEns(opData.sousEnsembles),
    cordons:       Object.fromEntries(Object.entries(opData.cordons || {}).map(([k,v]) => [k, v ?? 'ok'])),
    commentaire:   opData.commentaire || '',
    conformite:    opData.conformite || null,
  });
  const [started, setStarted] = React.useState(false);
  const [schemaImages, setSchemaImages] = React.useState([]);
  const [photos, setPhotos] = React.useState(opData.photos || []);
  const [photoManagerOpen, setPhotoManagerOpen] = React.useState(false);
  const [pendingPhoto, setPendingPhoto] = React.useState(null);
  const [carouselIdx, setCarouselIdx] = React.useState(0);

  // Toujours arriver en haut de la page de vérification
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  // Charge les images schéma si disponibles
  React.useEffect(() => {
    if (!organeId || !opKey) return;
    API.getOpImages(organeId, opKey)
      .then(d => { setSchemaImages(d.images || []); })
      .catch(() => {});
  }, [organeId, opKey]);

  const cordonsNums = Object.keys(form.cordons).map(Number).sort((a,b) => a-b);
  const nokCount     = Object.values(form.cordons).filter(v => v === 'nok').length;
  const okCount      = Object.values(form.cordons).filter(v => v === 'ok').length;
  const retoucheCount = Object.values(form.cordons).filter(v => v === 'retouche').length;

  // Auto-conformité quand les cordons changent
  React.useEffect(() => {
    if (cordonsNums.length === 0) return;
    setForm(f => ({
      ...f,
      conformite: nokCount > 0 ? 'non-conforme' : (retoucheCount > 0 ? 'retouche' : 'conforme'),
    }));
  }, [nokCount, retoucheCount]);

  function touch() {
    if (!started) { setStarted(true); onStart?.(); }
  }
  function setField(k, v)        { touch(); setForm(f => ({ ...f, [k]: v })); }
  function setCordon(num, val)   { touch(); setForm(f => ({ ...f, cordons: { ...f.cordons, [num]: val } })); }
  function updateSE(i, fld, val) {
    touch();
    setForm(f => {
      const ses = [...(f.sousEnsembles || [])];
      while (ses.length <= i) ses.push({ opNum:'', numD:'', numG:'', retoucheD:false, retoucheG:false });
      ses[i] = { ...ses[i], [fld]: val };
      return { ...f, sousEnsembles: ses };
    });
  }

  function handleSave() {
    const status = (form.conformite === 'non-conforme' || form.conformite === 'retouche') ? 'nok' : 'done';
    onSave(opKey, { ...form, photos, status });
  }

  async function handleExportThisOP() {
    if (!window.jspdf) { alert('Bibliothèque PDF non chargée — rechargez la page.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12, inner = pageW - margin * 2;
    const ACCENT = [30, 58, 95];

    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255);
    doc.text('CQS', margin, 9);
    doc.setFontSize(9); doc.setFont(undefined,'normal');
    doc.text('Checklist Qualité Soudure', margin + 16, 9);
    doc.text(`${projetLabel} › ${organeLabel}`, pageW - margin, 9, { align:'right' });
    doc.setFillColor(15, 40, 70);
    doc.rect(0, 14, pageW, 8, 'F');
    doc.setFontSize(9); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255);
    const ofLabel = form.ofNum || '—';
    doc.text(`OP : ${opKey}   ·   OF : ${ofLabel}${form.pieceNum ? '   ·   Pièce : '+form.pieceNum : ''}`, margin, 19.5);
    if (form.ipn) doc.text(`IPN : ${form.ipn}`, pageW - margin, 19.5, { align:'right' });
    doc.setTextColor(0,0,0);
    let y = 28;

    function checkBreak(h) { if (y + h > pageH - 10) { doc.addPage(); y = 10; } }

    const [sr,sg,sb] = form.conformite === 'non-conforme' ? [220,38,38] : form.conformite === 'retouche' ? [217,119,6] : [22,163,74];
    const sl = form.conformite === 'non-conforme' ? 'Non Conforme' : form.conformite === 'retouche' ? 'Retouché' : 'Conforme';
    doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(sr,sg,sb);
    doc.text(`Statut : ${sl}`, margin, y + 5);
    doc.setTextColor(0,0,0); y += 10;

    if (form.commentaire) {
      checkBreak(12);
      doc.setFontSize(7.5); doc.setFont(undefined,'italic'); doc.setTextColor(90,90,90);
      const lines = doc.splitTextToSize(`Note : ${form.commentaire}`, inner - 4);
      doc.text(lines, margin + 3, y + 4); y += lines.length * 4 + 4;
      doc.setTextColor(0,0,0);
    }

    const cordonsData = Object.entries(form.cordons||{}).sort((a,b)=>+a[0]-+b[0])
      .map(([num,s]) => [num, s==='ok'?'OK':s==='retouche'?'Retouché':'Non Conf.']);
    if (cordonsData.length) {
      checkBreak(20);
      doc.autoTable({
        startY:y, head:[['Cordon','Statut']], body:cordonsData,
        theme:'plain', margin:{left:margin}, tableWidth:inner,
        styles:{fontSize:7.5,cellPadding:1.4,lineWidth:0.1,lineColor:[210,210,210]},
        headStyles:{fillColor:ACCENT,textColor:[255,255,255],fontSize:7.5,fontStyle:'bold',cellPadding:1.8},
        columnStyles:{0:{fontStyle:'bold',cellWidth:28},1:{cellWidth:24,halign:'center'}},
        didParseCell: d => {
          if (d.section==='body'&&d.column.index===1) { const v=d.cell.raw; d.cell.styles.textColor=v==='OK'?[22,163,74]:v==='Retouché'?[217,119,6]:[220,38,38]; d.cell.styles.fontStyle='bold'; }
          if (d.row.index%2===0&&d.section==='body') d.cell.styles.fillColor=[252,252,252];
        },
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    const seData = (form.sousEnsembles||[]).filter(se=>(se.opNum||'').trim()||(se.numD||'').trim()||(se.numG||'').trim())
      .map(se=>[se.opNum||'',se.numD||'',se.retoucheD?'Oui':'Non',se.numG||'',se.retoucheG?'Oui':'Non']);
    if (seData.length) {
      checkBreak(20);
      doc.autoTable({
        startY:y, head:[['OP n°','N° D','Ret.D','N° G','Ret.G']], body:seData,
        theme:'plain', margin:{left:margin}, tableWidth:inner,
        styles:{fontSize:7.5,cellPadding:1.4,lineWidth:0.1,lineColor:[210,210,210]},
        headStyles:{fillColor:ACCENT,textColor:[255,255,255],fontSize:7.5,fontStyle:'bold',cellPadding:1.8},
        columnStyles:{0:{cellWidth:28,fontStyle:'bold'},2:{cellWidth:14,halign:'center'},4:{cellWidth:14,halign:'center'}},
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    for (const img of schemaImages) {
      checkBreak(44);
      try { doc.addImage(img.imageData,'JPEG',margin,y,70,40); y+=43; } catch(e){}
    }
    for (const photo of photos) {
      if (!photo.imageData) continue;
      checkBreak(54);
      const pLabel = photo.cordonNum ? `Photo — Cordon ${photo.cordonNum}` : 'Photo';
      doc.setFontSize(8); doc.setFont(undefined,'bold'); doc.setTextColor(...ACCENT);
      doc.text(pLabel, margin+2, y+5); y+=7;
      try { doc.addImage(photo.imageData,'JPEG',margin,y,80,45); y+=47; } catch(e){}
    }

    const total = doc.getNumberOfPages();
    for (let i=1;i<=total;i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setFont(undefined,'normal'); doc.setTextColor(160,160,160);
      doc.text(`CQS · ${opKey} · ${projetLabel} › ${organeLabel}`, margin, pageH-5);
      doc.text(`${i} / ${total}`, pageW-margin, pageH-5, {align:'right'});
    }
    doc.save(`CQS-${opKey.replace(/[\s/\\]/g,'-')}.pdf`);
  }

  // Photo capture
  function handlePhotoCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPendingPhoto({ imageData: ev.target.result, mimeType: file.type || 'image/jpeg' });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function confirmPhoto(cordonNum) {
    if (!pendingPhoto) return;
    setPhotos(prev => [...prev, { cordonNum, imageData: pendingPhoto.imageData, mimeType: pendingPhoto.mimeType }]);
    setPendingPhoto(null);
  }

  function deletePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  const seValid = (form.sousEnsembles || []).every(se => {
    const hasData = (se.numD||'').trim() || (se.numG||'').trim() || se.retoucheD || se.retoucheG;
    return !hasData || (se.opNum||'').trim() !== '';
  });
  const canSave = (form.pieceNum.trim() !== '' || form.ofNum.trim() !== '') && seValid;

  // Le carousel n'affiche que les schémas (les photos sont gérées via le bouton Photo)
  const carouselItems = schemaImages.map((img, i) => ({
    type:'schema', imageData: img.imageData,
    label: schemaImages.length > 1 ? `Schéma ${i+1}` : 'Schéma',
  }));

  const clampedIdx = carouselItems.length > 0 ? Math.min(carouselIdx, carouselItems.length - 1) : 0;

  // ─── Sous-ensembles table (style fiche papier) ───
  const SousEnsTable = () => {
    const cell = { border:'1.5px solid #1f2937', padding:0 };
    const headCell = { ...cell, padding:'7px 6px', textAlign:'center', fontSize:13, fontWeight:700, color:'#1f2937', whiteSpace:'pre-line', lineHeight:1.15 };
    const inputStyle = { border:'none', background:'transparent', padding:'9px 8px', fontSize:13, fontFamily:'inherit', width:'100%', outline:'none', textAlign:'center', boxSizing:'border-box' };
    // Compute rows to display: last filled row + 1 empty, minimum 2
    const rows = form.sousEnsembles || [];
    let lastFilled = -1;
    for (let i = 0; i < rows.length; i++) {
      const se = rows[i];
      if (se.opNum || se.numD || se.numG || se.retoucheD || se.retoucheG) lastFilled = i;
    }
    const needed = Math.max(2, lastFilled + 2);
    const displaySE = [...rows];
    while (displaySE.length < needed) displaySE.push({ opNum:'', numD:'', numG:'', retoucheD:false, retoucheG:false });
    const visibleRows = displaySE.slice(0, needed);
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
          {visibleRows.map((se, i) => {
            const hasData = (se.numD||'').trim() || (se.numG||'').trim() || se.retoucheD || se.retoucheG;
            const missingOp = hasData && !(se.opNum||'').trim();
            return (
            <tr key={i}>
              <td style={{ ...cell, ...(missingOp ? { background:'#fffbeb' } : {}) }}>
                <input value={se.opNum} onChange={e => updateSE(i,'opNum',e.target.value)}
                  style={{ ...inputStyle, fontWeight:700, color:'var(--accent,#1e3a5f)', ...(missingOp ? { outline:'2px solid #f59e0b' } : {}) }}
                  placeholder="⚠" />
              </td>
              <td style={cell}>
                <input value={se.numD} onChange={e => updateSE(i,'numD',e.target.value)} style={inputStyle} placeholder="—" />
              </td>
              <td style={{ ...cell, textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <CheckCell checked={se.retoucheD} onChange={v => updateSE(i,'retoucheD',v)} color="#dc2626" alwaysOutline />
                </div>
              </td>
              <td style={cell}>
                <input value={se.numG} onChange={e => updateSE(i,'numG',e.target.value)} style={inputStyle} placeholder="—" />
              </td>
              <td style={{ ...cell, textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <CheckCell checked={se.retoucheG} onChange={v => updateSE(i,'retoucheG',v)} color="#dc2626" alwaysOutline />
                </div>
              </td>
            </tr>
            );
          })}
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
              <th style={{ padding:'7px 6px', textAlign:'center', fontSize:12, color:'#d97706', fontWeight:700, width:52 }}>Ret.</th>
              <th style={{ padding:'7px 6px', textAlign:'center', fontSize:12, color:'#dc2626', fontWeight:700, width:48 }}>N.C.</th>
            </tr>
          </thead>
          <tbody>
            {cordonsNums.length === 0 ? (
              <tr><td colSpan={4} style={{ padding:'16px', textAlign:'center', fontSize:13, color:'#d1d5db', fontStyle:'italic' }}>Aucun cordon défini</td></tr>
            ) : cordonsNums.map((num) => {
              const val = form.cordons[num];
              const isNok = val === 'nok';
              return (
                <tr key={num} style={{ borderBottom:'1px solid #f0ede8', background: isNok ? '#fff8f5' : 'transparent' }}>
                  <td style={{ padding:'5px 10px', fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)', whiteSpace:'nowrap' }}>C {num}</td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={val === 'ok'} onChange={() => setCordon(num, 'ok')} color="#16a34a" alwaysOutline />
                  </td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={val === 'retouche'} onChange={() => setCordon(num, 'retouche')} color="#d97706" alwaysOutline />
                  </td>
                  <td style={{ padding:'4px 5px', textAlign:'center' }}>
                    <CheckCell checked={val === 'nok'} onChange={() => setCordon(num, 'nok')} color="#dc2626" alwaysOutline />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Cordons that are retouche or nok (for photo association)
  const nokRetoucheNums = cordonsNums.filter(num => {
    const v = form.cordons[num];
    return v === 'nok' || v === 'retouche';
  });

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
          </div>
          {/* Bouton export PDF individuel */}
          <button onClick={handleExportThisOP} title="Exporter cette OP en PDF" style={{
            display:'flex', alignItems:'center', gap:7, flexShrink:0,
            background:'rgba(255,255,255,0.15)',
            border:'1.5px solid rgba(255,255,255,0.28)',
            borderRadius:8, padding:'8px 12px', cursor:'pointer', fontFamily:'inherit',
            fontSize:13, fontWeight:700, color:'#fff', height:38,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ whiteSpace:'nowrap' }}>PDF</span>
          </button>
          {/* Bouton photo */}
          <button onClick={() => setPhotoManagerOpen(true)} title="Gérer les photos" style={{
            display:'flex', alignItems:'center', gap:7, flexShrink:0,
            background: photos.length > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            border:'1.5px solid rgba(255,255,255,0.28)',
            borderRadius:8, padding:'8px 12px', cursor:'pointer', fontFamily:'inherit',
            fontSize:13, fontWeight:700, color:'#fff', height:38,
          }}>
            <Icon name="camera" size={18} color="#fff" />
            <span style={{ whiteSpace:'nowrap' }}>Photo{photos.length > 0 ? ` (${photos.length})` : ''}</span>
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
          {/* OF */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap' }}>OF</span>
            <input value={form.ofNum}
              onChange={e => setField('ofNum', e.target.value)}
              placeholder="ex : 2024-089"
              style={{ background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:6, padding:'4px 10px', fontSize:14, fontWeight:700, color:'#fff', fontFamily:'inherit', outline:'none', width:120 }}
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

          {/* Ligne 2 : Schéma/Photos + Cordons */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'stretch' }}>
            {/* Carousel schéma + photos (gauche) */}
            <div style={{ flex:'1 1 400px', background:'#fff', borderRadius:12, border:'1.5px solid #e8e5e0', minHeight:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
              {carouselItems.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:20, flex:1 }}>
                  <Icon name="clipboardCheck" size={52} color="#e5e3de" />
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#9ca3af' }}>Fiche schéma à l'opération</div>
                    <div style={{ fontSize:12, color:'#d1d5db', marginTop:4 }}>Uploadable via le Manager → Fiches</div>
                  </div>
                </div>
              ) : (
                <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                  <img src={carouselItems[clampedIdx].imageData}
                    alt={carouselItems[clampedIdx].label}
                    style={{ maxWidth:'100%', maxHeight:380, objectFit:'contain', display:'block' }} />
                  {carouselItems.length > 1 && (
                    <>
                      <button onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} style={{
                        position:'absolute', left:6, top:'50%', transform:'translateY(-50%)',
                        background:'rgba(0,0,0,0.35)', border:'none', borderRadius:'50%',
                        width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        opacity: clampedIdx === 0 ? 0.3 : 1,
                      }}>
                        <Icon name="arrowLeft" size={16} color="#fff" />
                      </button>
                      <button onClick={() => setCarouselIdx(i => Math.min(carouselItems.length - 1, i + 1))} style={{
                        position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
                        background:'rgba(0,0,0,0.35)', border:'none', borderRadius:'50%',
                        width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        opacity: clampedIdx === carouselItems.length - 1 ? 0.3 : 1,
                      }}>
                        <Icon name="arrowRight" size={16} color="#fff" />
                      </button>
                    </>
                  )}
                  <div style={{ padding:'6px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#6b7280' }}>{carouselItems[clampedIdx].label}</div>
                    {carouselItems.length > 1 && (
                      <div style={{ fontSize:11, color:'#c4c0ba', marginTop:2 }}>{clampedIdx + 1} / {carouselItems.length}</div>
                    )}
                  </div>
                </div>
              )}
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
          <Btn variant="ok" onClick={handleSave} disabled={!canSave} extraStyle={{ flex:3, minHeight:48 }} title={!seValid ? "Remplissez le n° OP pour chaque ligne de sous-ensemble renseignée" : ""}>
            <Icon name="check" size={18} color="#fff" /> Valider la pièce
          </Btn>
        </div>
      </div>

      {/* ── Gestionnaire de photos CRUD ── */}
      {photoManagerOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'flex-end' }}>
          <div style={{
            background:'#fff', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:540, margin:'0 auto',
            display:'flex', flexDirection:'column', maxHeight:'88vh',
          }}>
            {!pendingPhoto ? (
              /* ── Vue liste ── */
              <>
                <div style={{ padding:'20px 16px 12px', borderBottom:'1px solid #f0ede8', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>Photos de vérification</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} — incluses dans le PDF</div>
                  </div>
                  <button onClick={() => setPhotoManagerOpen(false)} style={{ background:'#f0ede8', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon name="x" size={16} color="#6b7280" />
                  </button>
                </div>

                <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                  {photos.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <Icon name="camera" size={44} color="#e5e3de" />
                      <div style={{ fontSize:14, fontWeight:700, color:'#9ca3af' }}>Aucune photo</div>
                      <div style={{ fontSize:12, color:'#c4c0ba', maxWidth:280 }}>Photographiez les cordons retouchés ou non-conformes pour les documenter dans le PDF</div>
                    </div>
                  ) : photos.map((p, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#f8f7f5', borderRadius:12, padding:10, border:'1.5px solid #eceae6' }}>
                      <img src={p.imageData} alt={`Photo ${i+1}`}
                        style={{ width:72, height:72, objectFit:'cover', borderRadius:8, flexShrink:0, border:'1.5px solid #e5e3de', cursor:'pointer' }}
                        onClick={() => setPendingPhoto({ ...p, viewOnly: true, idx: i })}
                      />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>Photo {i + 1}</div>
                        {p.cordonNum ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background: form.cordons[p.cordonNum] === 'nok' ? '#dc2626' : '#d97706', flexShrink:0 }} />
                            <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>
                              Cordon {p.cordonNum} — {form.cordons[p.cordonNum] === 'nok' ? 'Non conforme' : 'Retouché'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>Sans association</div>
                        )}
                      </div>
                      <button onClick={() => deletePhoto(i)} style={{
                        background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8,
                        width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      }}>
                        <Icon name="trash" size={15} color="#dc2626" />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ padding:'12px 16px 32px', borderTop:'1px solid #f0ede8', flexShrink:0 }}>
                  <label style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    background:'var(--accent,#1e3a5f)', color:'#fff', border:'none',
                    borderRadius:12, padding:'14px', cursor:'pointer', fontFamily:'inherit', fontSize:15, fontWeight:700, width:'100%',
                  }}>
                    <Icon name="camera" size={18} color="#fff" />
                    Prendre / Ajouter une photo
                    <input type="file" accept="image/*" capture="environment" style={{ display:'none' }}
                      onChange={handlePhotoCapture} />
                  </label>
                </div>
              </>
            ) : pendingPhoto.viewOnly ? (
              /* ── Vue plein écran d'une photo existante ── */
              <div style={{ padding:'20px 16px 32px', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>Photo {(pendingPhoto.idx ?? 0) + 1}</div>
                  <button onClick={() => setPendingPhoto(null)} style={{ background:'#f0ede8', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="x" size={16} color="#6b7280" />
                  </button>
                </div>
                <img src={pendingPhoto.imageData} alt="Photo"
                  style={{ width:'100%', maxHeight:280, objectFit:'contain', borderRadius:10, border:'1.5px solid #e5e7eb' }} />
                {pendingPhoto.cordonNum ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: form.cordons[pendingPhoto.cordonNum] === 'nok' ? '#dc2626' : '#d97706' }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>
                      Cordon {pendingPhoto.cordonNum} — {form.cordons[pendingPhoto.cordonNum] === 'nok' ? 'Non conforme' : 'Retouché'}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize:13, color:'#9ca3af', textAlign:'center' }}>Sans association cordon</div>
                )}
                <button onClick={() => setPendingPhoto(null)} style={{
                  border:'none', borderRadius:10, padding:'11px', cursor:'pointer',
                  background:'#f0ede8', fontFamily:'inherit', fontSize:14, fontWeight:700, color:'#6b7280',
                }}>
                  Retour
                </button>
              </div>
            ) : (
              /* ── Vue association cordon (nouvelle photo) ── */
              <div style={{ padding:'20px 16px 32px', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--accent,#1e3a5f)' }}>Associer la photo à un cordon</div>
                <img src={pendingPhoto.imageData} alt="Aperçu"
                  style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:8, border:'1.5px solid #e5e7eb' }} />
                <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Cordon concerné :</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflowY:'auto' }}>
                  {nokRetoucheNums.length === 0 && (
                    <div style={{ fontSize:13, color:'#9ca3af', fontStyle:'italic', padding:'8px 0' }}>
                      Aucun cordon retouché / non-conforme pour le moment
                    </div>
                  )}
                  {nokRetoucheNums.map(num => (
                    <button key={num} onClick={() => confirmPhoto(String(num))} style={{
                      border:'1.5px solid #e5e7eb', borderRadius:10, padding:'11px 14px', cursor:'pointer',
                      background:'#f8f7f5', fontFamily:'inherit', textAlign:'left',
                      display:'flex', alignItems:'center', gap:10,
                    }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background: form.cordons[num] === 'nok' ? '#dc2626' : '#d97706', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--accent,#1e3a5f)' }}>Cordon {num}</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>{form.cordons[num] === 'nok' ? 'Non conforme' : 'Retouché'}</div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => confirmPhoto(null)} style={{
                    border:'1.5px dashed #d1d5db', borderRadius:10, padding:'11px 14px', cursor:'pointer',
                    background:'#fafafa', fontFamily:'inherit', fontSize:14, fontWeight:600, color:'#6b7280', textAlign:'left',
                  }}>
                    Sans association
                  </button>
                </div>
                <button onClick={() => setPendingPhoto(null)} style={{
                  border:'none', borderRadius:10, padding:'11px', cursor:'pointer',
                  background:'#f0ede8', fontFamily:'inherit', fontSize:14, fontWeight:700, color:'#6b7280',
                }}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
