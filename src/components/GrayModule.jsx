import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import CopyButton from './CopyButton'

export default function GrayModule({ frontend, backend, onFrontendChange, onBackendChange, onCopy, onConfirmDelete }) {
  const [tab, setTab] = useState('frontend')

  const addRow = (type) => {
    const row = type === 'frontend'
      ? { app: '', version: '', note: '' }
      : { lane: '', service: '', note: '' }
    if (type === 'frontend') onFrontendChange([...frontend, row])
    else onBackendChange([...backend, row])
  }

  const updateRow = (type, index, field, value) => {
    if (type === 'frontend') {
      onFrontendChange(frontend.map((r, i) => i === index ? { ...r, [field]: value } : r))
    } else {
      onBackendChange(backend.map((r, i) => i === index ? { ...r, [field]: value } : r))
    }
  }

  const removeRow = (type, index) => {
    const data = type === 'frontend' ? frontend : backend
    const row = data[index]
    const name = type === 'frontend' ? (row.app || '未命名') : (row.service || '未命名')
    onConfirmDelete(
      '删除确认',
      `确认删除 "${name}" 这一行？`,
      () => {
        const filtered = data.filter((_, i) => i !== index)
        if (type === 'frontend') onFrontendChange(filtered)
        else onBackendChange(filtered)
      }
    )
  }

  return (
    <section className="card p-6 mt-5 stagger-in" style={{ animationDelay: '.15s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold">灰度创建</h2>
        <CopyButton onCopy={() => onCopy({ frontend, backend })} />
      </div>
      <div className="flex gap-2 mb-4">
        <button className={`tab-btn ${tab === 'frontend' ? 'active' : ''}`} onClick={() => setTab('frontend')}>
          前端灰度 (MSE)
        </button>
        <button className={`tab-btn ${tab === 'backend' ? 'active' : ''}`} onClick={() => setTab('backend')}>
          后端灰度 (SAE)
        </button>
      </div>

      {tab === 'frontend' && (
        <div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>应用名</th>
                <th style={{ width: '30%' }}>灰度版本 / 标签</th>
                <th style={{ width: '25%' }}>备注</th>
                <th style={{ width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {frontend.map((row, i) => (
                <tr key={i}>
                  <td><span className="editable" contentEditable suppressContentEditableWarning onBlur={e => updateRow('frontend', i, 'app', e.target.textContent)}>{row.app}</span></td>
                  <td><span className="editable" style={{ color: row.version ? 'var(--text2)' : 'var(--text3)' }} contentEditable suppressContentEditableWarning onBlur={e => updateRow('frontend', i, 'version', e.target.textContent)}>{row.version}</span></td>
                  <td><span className="editable" style={{ color: row.note ? 'var(--text2)' : 'var(--text3)' }} contentEditable suppressContentEditableWarning onBlur={e => updateRow('frontend', i, 'note', e.target.textContent)}>{row.note}</span></td>
                  <td><button className="row-del" onClick={() => removeRow('frontend', i)} title="删除"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row mt-3" onClick={() => addRow('frontend')}><Plus size={14} /> 添加行</button>
        </div>
      )}

      {tab === 'backend' && (
        <div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>服务名</th>
                <th style={{ width: '22%' }}>泳道标签</th>
                <th style={{ width: '35%' }}>备注</th>
                <th style={{ width: '13%' }}></th>
              </tr>
            </thead>
            <tbody>
              {backend.map((row, i) => (
                <tr key={i}>
                  <td><span className="editable" contentEditable suppressContentEditableWarning onBlur={e => updateRow('backend', i, 'service', e.target.textContent)}>{row.service}</span></td>
                  <td><span className="editable" contentEditable suppressContentEditableWarning onBlur={e => updateRow('backend', i, 'lane', e.target.textContent)}>{row.lane}</span></td>
                  <td><span className="editable" style={{ color: row.note ? 'var(--text2)' : 'var(--text3)' }} contentEditable suppressContentEditableWarning onBlur={e => updateRow('backend', i, 'note', e.target.textContent)}>{row.note}</span></td>
                  <td><button className="row-del" onClick={() => removeRow('backend', i)} title="删除"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row mt-3" onClick={() => addRow('backend')}><Plus size={14} /> 添加行</button>
        </div>
      )}
    </section>
  )
}
