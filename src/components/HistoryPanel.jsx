import React from 'react'
import { X, Trash2 } from 'lucide-react'

export default function HistoryPanel({ show, archives, onClose, onDelete, onLoad }) {
  return (
    <>
      <div className={`history-overlay ${show ? 'show' : ''}`} onClick={onClose}></div>
      <div className={`history-panel ${show ? 'show' : ''}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold gradient-text">历史迭代</h3>
            <button style={{ color: 'var(--text3)' }} className="hover:text-gray-700 transition-colors" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {archives.length === 0 && (
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>暂无归档记录</p>
            )}
            {archives.map(archive => (
              <div
                key={archive.id}
                className="card p-4 flex items-center justify-between group cursor-pointer"
                onClick={() => onLoad(archive)}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {archive.iterationName}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    归档于 {new Date(archive.archivedAt).toLocaleDateString('zh-CN')}
                    {archive.releaseDate && ` · 上线 ${archive.releaseDate}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-done text-xs">
                    <span className="badge-dot"></span>已完成
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    style={{ color: 'var(--text3)' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text3)'}
                    onClick={e => { e.stopPropagation(); onDelete(archive) }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
