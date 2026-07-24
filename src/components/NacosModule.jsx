import React from 'react'
import { FileText, Plus, X } from 'lucide-react'
import CopyButton from './CopyButton'

export default function NacosModule({ blocks, onChange, onCopy, onConfirmDelete }) {
  const addBlock = () => {
    onChange([...blocks, { filename: '', content: '' }])
  }

  const updateBlock = (index, field, value) => {
    const updated = blocks.map((b, i) => i === index ? { ...b, [field]: value } : b)
    onChange(updated)
  }

  const removeBlock = (index) => {
    const block = blocks[index]
    onConfirmDelete(
      '删除确认',
      `确认删除配置文件 "${block.filename || '未命名'}" ？`,
      () => onChange(blocks.filter((_, i) => i !== index))
    )
  }

  return (
    <section className="card p-6 mt-5 stagger-in" style={{ animationDelay: '.1s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold">Nacos 配置变更</h2>
        <CopyButton onCopy={() => onCopy(blocks)} />
      </div>
      <div className="space-y-4">
        {blocks.map((block, i) => (
          <div key={i} className="nacos-block p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                <FileText size={14} color="#10b981" />
                <input
                  className="nacos-filename"
                  value={block.filename}
                  placeholder="配置文件名"
                  onChange={e => updateBlock(i, 'filename', e.target.value)}
                />
              </div>
              <button className="nacos-del ml-2" title="删除" onClick={() => removeBlock(i)}>
                <X size={14} />
              </button>
            </div>
            <textarea
              className="code-area"
              rows={4}
              value={block.content}
              placeholder="修改内容..."
              onChange={e => updateBlock(i, 'content', e.target.value)}
            />
          </div>
        ))}
      </div>
      <button className="add-row mt-4" onClick={addBlock}>
        <Plus size={14} /> 添加配置文件
      </button>
    </section>
  )
}
