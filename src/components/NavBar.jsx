import React from 'react'
import EditableName from './EditableName'
import { Archive, Clock, ClipboardCopy, ArrowLeft, LogOut, Pencil, Save, Check } from 'lucide-react'

export default function NavBar({ name, onNameChange, onArchive, onHistory, onCopyAll, readOnly, onBack, username, onLogout, viewingArchive, editingArchive, onEditArchive, onSaveArchive, onSave, saved }) {
  return (
    <nav className="nav-bar sticky top-0 z-50 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        {(readOnly && !editingArchive) ? (
          <span className="text-base font-semibold" style={{ color: 'var(--text)' }}>{name}</span>
        ) : (
          <EditableName value={name} onChange={onNameChange} />
        )}
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>迭代上线清单</span>
        {viewingArchive && (
          <span
            className="badge text-xs ml-2"
            style={{
              fontSize: 11,
              background: editingArchive ? '#dbeafe' : '#fef3c7',
              color: editingArchive ? '#1d4ed8' : '#b45309',
              border: editingArchive ? '1px solid #bfdbfe' : '1px solid #fde68a'
            }}
          >
            {editingArchive ? '编辑中' : '历史快照'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {viewingArchive ? (
          <>
            {editingArchive ? (
              <button className="btn-primary rounded-lg px-4 py-2 text-sm flex items-center gap-2" onClick={onSaveArchive}>
                <Save size={14} /> 保存
              </button>
            ) : (
              <button className="btn-ghost rounded-lg px-4 py-2 text-sm flex items-center gap-2" onClick={onEditArchive}>
                <Pencil size={14} /> 编辑
              </button>
            )}
            <button className="btn-primary rounded-lg px-4 py-2 text-sm flex items-center gap-2" onClick={onBack}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}>
              <ArrowLeft size={14} /> 返回当前迭代
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-primary rounded-lg px-4 py-2 text-sm flex items-center gap-2"
              onClick={onSave}
              style={saved ? { background: '#059669', borderColor: '#059669', transition: 'all .3s' } : {}}
            >
              {saved ? <><Check size={14} /> 已保存</> : <><Save size={14} /> 保存</>}
            </button>
            <button className="btn-ghost rounded-lg px-4 py-2 text-sm flex items-center gap-2" onClick={onArchive}>
              <Archive size={14} /> 归档
            </button>
            <button className="btn-ghost rounded-lg px-4 py-2 text-sm flex items-center gap-2" onClick={onHistory}>
              <Clock size={14} /> 历史迭代
            </button>
          </>
        )}
        <button className="btn-primary rounded-lg px-4 py-2 text-sm" onClick={onCopyAll}>
          <span className="flex items-center gap-2">
            <ClipboardCopy size={14} /> 复制全部
          </span>
        </button>
        {/* User info & logout */}
        {username && (
          <div className="flex items-center gap-2 ml-2" style={{ paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{username}</span>
            <button
              onClick={onLogout}
              title="退出登录"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', transition: 'color .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
