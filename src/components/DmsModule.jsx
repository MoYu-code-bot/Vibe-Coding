import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import CopyButton from './CopyButton'

const DMS_TYPE_LABELS = { modify: '修改表', create: '新建表' }
const DMS_TYPE_CLASS = { modify: 'badge-modify', create: 'badge-create' }
const DMS_STATUS_LABELS = { pending: '待审批', approved: '已通过', rejected: '已拒绝' }
const DMS_STATUS_CLASS = { pending: 'badge-pending-status', approved: 'badge-approved-status', rejected: 'badge-rejected-status' }

function cycleDmsType(current) {
  return current === 'modify' ? 'create' : 'modify'
}

function cycleDmsStatus(current) {
  if (current === 'pending') return 'approved'
  if (current === 'approved') return 'rejected'
  return 'pending'
}

export default function DmsModule({ rows, onChange, onCopy, onConfirmDelete }) {
  const addRow = () => {
    onChange([...rows, { id: '', table: '', type: 'modify', approver: '', status: 'pending' }])
  }

  const updateRow = (index, field, value) => {
    onChange(rows.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const removeRow = (index) => {
    const row = rows[index]
    onConfirmDelete(
      '删除确认',
      `确认删除 "${row.id || row.table || '未命名'}" 这一行？`,
      () => onChange(rows.filter((_, i) => i !== index))
    )
  }

  return (
    <section className="card p-6 mt-5 stagger-in" style={{ animationDelay: '.2s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold">DMS 审批</h2>
        <CopyButton onCopy={() => onCopy(rows)} />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '17%' }}>审批编号</th>
            <th style={{ width: '22%' }}>表名</th>
            <th style={{ width: '15%' }}>操作类型</th>
            <th style={{ width: '15%' }}>审批人</th>
            <th style={{ width: '16%' }}>状态</th>
            <th style={{ width: '15%' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td><span className="editable font-mono text-sm" contentEditable suppressContentEditableWarning onBlur={e => updateRow(i, 'id', e.target.textContent)}>{row.id}</span></td>
              <td><span className="editable font-mono text-sm" contentEditable suppressContentEditableWarning onBlur={e => updateRow(i, 'table', e.target.textContent)}>{row.table}</span></td>
              <td>
                <span
                  className={`badge ${DMS_TYPE_CLASS[row.type]}`}
                  onClick={() => updateRow(i, 'type', cycleDmsType(row.type))}
                >
                  <span className="badge-dot"></span>{DMS_TYPE_LABELS[row.type]}
                </span>
              </td>
              <td><span className="editable" contentEditable suppressContentEditableWarning onBlur={e => updateRow(i, 'approver', e.target.textContent)}>{row.approver}</span></td>
              <td>
                <span
                  className={`badge ${DMS_STATUS_CLASS[row.status]}`}
                  onClick={() => updateRow(i, 'status', cycleDmsStatus(row.status))}
                >
                  {DMS_STATUS_LABELS[row.status]}
                </span>
              </td>
              <td><button className="row-del" onClick={() => removeRow(i)} title="删除"><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row mt-3" onClick={addRow}><Plus size={14} /> 添加行</button>
    </section>
  )
}
