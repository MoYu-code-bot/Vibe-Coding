import React from 'react'

export default function ConfirmDialog({ show, title, message, onConfirm, onCancel, confirmLabel = '确认' }) {
  if (!show) return null
  return (
    <div className="confirm-overlay show" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <h4 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h4>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-ghost" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 14 }} onClick={onCancel}>取消</button>
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 14, background: confirmLabel === '覆盖' ? '#ef4444' : undefined, borderColor: confirmLabel === '覆盖' ? '#ef4444' : undefined }} onClick={onConfirm}><span>{confirmLabel}</span></button>
        </div>
      </div>
    </div>
  )
}
