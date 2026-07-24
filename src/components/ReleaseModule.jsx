import React, { useState, useRef } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import CopyButton from './CopyButton'

const SERVICE_TYPES = ['服务', 'API', '前端', '配置', 'APP', '其他']

const MERGE_LABELS = { merged: '已合并', unmerged: '未合并' }
const MERGE_CLASS = { merged: 'badge-merged', unmerged: 'badge-unmerged' }
const DONE_LABELS = { done: '已上线', pending: '未上线' }
const DONE_CLASS = { done: 'badge-done', pending: 'badge-pending' }

function cycleMerge(current) {
  return current === 'merged' ? 'unmerged' : 'merged'
}

function cycleDone(current) {
  return current === 'done' ? 'pending' : 'done'
}

export default function ReleaseModule({ date, items, onDateChange, onItemsChange, onCopy, onConfirmDelete }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const tbodyRef = useRef(null)

  const addRow = () => {
    onItemsChange([...items, { name: '', type: '服务', merged: 'unmerged', done: 'pending', note: '' }])
  }

  const updateRow = (index, field, value) => {
    onItemsChange(items.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const removeRow = (index) => {
    const row = items[index]
    onConfirmDelete(
      '删除确认',
      `确认删除 "${row.name || '未命名'}" 这一行？`,
      () => onItemsChange(items.filter((_, i) => i !== index))
    )
  }

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Make drag image semi-transparent
    if (e.target) {
      e.target.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.opacity = '1'
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== dragIndex) {
      setOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const newItems = [...items]
    const [moved] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, moved)
    onItemsChange(newItems)
    setDragIndex(null)
    setOverIndex(null)
  }

  const doneCount = items.filter(r => r.done === 'done').length
  const mergedCount = items.filter(r => r.merged === 'merged').length
  const total = items.length
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const mergePercent = total > 0 ? Math.round((mergedCount / total) * 100) : 0

  return (
    <section className="card p-6 mt-5 stagger-in" style={{ animationDelay: '.3s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold">上线模块</h2>
        <CopyButton onCopy={() => onCopy({ date, items })} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm" style={{ color: 'var(--text2)' }}>上线日期</span>
        <input type="date" className="date-input" value={date} onChange={e => onDateChange(e.target.value)} />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '3%', padding: '10px 4px' }}></th>
            <th style={{ width: '24%' }}>名称</th>
            <th style={{ width: '12%' }}>类型</th>
            <th style={{ width: '13%' }}>代码合并</th>
            <th style={{ width: '13%' }}>状态</th>
            <th style={{ width: '22%' }}>备注</th>
            <th style={{ width: '13%' }}></th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {items.map((row, i) => (
            <tr
              key={i}
              draggable
              onDragStart={e => handleDragStart(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, i)}
              style={{
                opacity: dragIndex === i ? 0.5 : 1,
                borderTop: overIndex === i && dragIndex !== i && i < dragIndex ? '2px solid #10b981' : 'none',
                borderBottom: overIndex === i && dragIndex !== i && i > dragIndex ? '2px solid #10b981' : 'none',
                cursor: 'grab',
                transition: 'border-color .15s, opacity .15s'
              }}
            >
              <td style={{ padding: '10px 4px', cursor: 'grab', color: '#cbd5e1' }}>
                <GripVertical size={14} style={{ display: 'block' }} />
              </td>
              <td>
                <span
                  className="editable font-mono text-sm"
                  contentEditable
                  suppressContentEditableWarning
                  style={{ cursor: 'text' }}
                  onBlur={e => updateRow(i, 'name', e.target.textContent)}
                >{row.name}</span>
              </td>
              <td>
                <select
                  className="dark-select"
                  value={row.type}
                  onChange={e => updateRow(i, 'type', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td>
                <span
                  className={`badge ${MERGE_CLASS[row.merged]}`}
                  onClick={() => updateRow(i, 'merged', cycleMerge(row.merged))}
                >
                  <span className="badge-dot"></span>{MERGE_LABELS[row.merged]}
                </span>
              </td>
              <td>
                <span
                  className={`badge ${DONE_CLASS[row.done]}`}
                  onClick={() => updateRow(i, 'done', cycleDone(row.done))}
                >
                  <span className="badge-dot"></span>{DONE_LABELS[row.done]}
                </span>
              </td>
              <td>
                <span
                  className="editable"
                  style={{ color: row.note ? 'var(--text2)' : 'var(--text3)', cursor: 'text' }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updateRow(i, 'note', e.target.textContent)}
                >{row.note}</span>
              </td>
              <td><button className="row-del" onClick={() => removeRow(i)} title="删除"><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row mt-3" onClick={addRow}><Plus size={14} /> 添加行</button>

      <div className="summary-bar mt-4">
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text3)' }}>上线状态</span>
            <span className="text-sm font-semibold" style={{ color: doneCount === total && total > 0 ? '#059669' : '#be123c' }}>{doneCount} / {total} 已上线</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text3)' }}>代码合并</span>
            <span className="text-sm font-semibold" style={{ color: mergedCount === total && total > 0 ? '#059669' : '#be123c' }}>{mergedCount} / {total} 已合并</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs w-16 text-right" style={{ color: 'var(--text3)' }}>上线</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
              <div className="h-full rounded-full" style={{ width: donePercent + '%', background: 'linear-gradient(90deg,#10b981,#06b6d4)', transition: 'width .3s' }}></div>
            </div>
            <span className="text-xs font-medium w-10" style={{ color: 'var(--text3)' }}>{donePercent}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs w-16 text-right" style={{ color: 'var(--text3)' }}>合并</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
              <div className="h-full rounded-full" style={{ width: mergePercent + '%', background: 'linear-gradient(90deg,#10b981,#06b6d4)', transition: 'width .3s' }}></div>
            </div>
            <span className="text-xs font-medium w-10" style={{ color: 'var(--text3)' }}>{mergePercent}%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
