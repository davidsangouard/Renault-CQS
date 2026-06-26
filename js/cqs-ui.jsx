// cqs-ui.jsx — Composants UI primitifs partagés

const STATUS_CONFIG = {
  todo:       { label: 'À faire',   color: '#6b7280', bg: '#f9fafb', dot: '#d1d5db' },
  inprogress: { label: 'En cours',  color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  done:       { label: 'Conforme',  color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  nok:        { label: 'Retouché',  color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
};

function getOFStatus(of) {
  const ops = Object.values(of.ops);
  return {
    done:   ops.filter(o => o.status === 'done').length,
    inprog: ops.filter(o => o.status === 'inprogress').length,
    nok:    ops.filter(o => o.status === 'nok').length,
    total:  ops.length,
  };
}

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.dot}55`,
      borderRadius: 99,
      padding: size === 'sm' ? '2px 9px' : '3px 13px',
      fontSize: size === 'sm' ? 12 : 13,
      fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ done, total, color = '#16a34a' }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 36, textAlign: 'right', fontWeight: 600 }}>
        {done}/{total}
      </span>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, full = false, extraStyle = {} }) {
  const variants = {
    primary:   { background: 'var(--accent, #1e3a5f)', color: '#fff', border: 'none', shadow: '0 2px 8px rgba(30,58,95,0.25)' },
    secondary: { background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', shadow: 'none' },
    ok:        { background: '#16a34a', color: '#fff', border: 'none', shadow: '0 2px 8px rgba(22,163,74,0.25)' },
    nok:       { background: '#dc2626', color: '#fff', border: 'none', shadow: 'none' },
    ghost:     { background: 'transparent', color: '#6b7280', border: '1.5px solid #e5e7eb', shadow: 'none' },
    danger:    { background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5', shadow: 'none' },
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13, minHeight: 36, borderRadius: 8 },
    md: { padding: '11px 20px', fontSize: 15, minHeight: 50, borderRadius: 10 },
    lg: { padding: '14px 28px', fontSize: 17, minHeight: 56, borderRadius: 12 },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: v.background, color: v.color, border: v.border,
        boxShadow: v.shadow,
        borderRadius: s.borderRadius, padding: s.padding,
        fontSize: s.fontSize, minHeight: s.minHeight,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.42 : 1,
        fontFamily: 'inherit', transition: 'opacity 0.15s',
        ...extraStyle
      }}
    >
      {children}
    </button>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
        </label>
      )}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: '1.5px solid #d1d5db', borderRadius: 8,
          padding: '11px 14px', fontSize: 16,
          fontFamily: 'inherit', color: '#111', outline: 'none',
          background: '#fff', minHeight: 48,
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          border: '1.5px solid #d1d5db', borderRadius: 8,
          padding: '11px 14px', fontSize: 16,
          fontFamily: 'inherit', color: '#111', outline: 'none',
          background: '#fff', resize: 'vertical', lineHeight: 1.5,
        }}
      />
    </div>
  );
}

function Card({ children, onClick, extraStyle = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, padding: 18,
        border: '1.5px solid #e8e5e0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        ...extraStyle
      }}
    >
      {children}
    </div>
  );
}

function CheckToggle({ checked, onChange, label, color = '#f59e0b' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        background: checked ? color + '18' : '#f9fafb',
        border: `1.5px solid ${checked ? color : '#e5e7eb'}`,
        borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'inherit', transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5,
        border: `2px solid ${checked ? color : '#d1d5db'}`,
        background: checked ? color : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: checked ? color : '#6b7280' }}>{label}</span>
    </button>
  );
}

Object.assign(window, {
  STATUS_CONFIG, getOFStatus,
  StatusBadge, ProgressBar, Btn,
  FieldInput, FieldTextarea, Card, CheckToggle,
});
