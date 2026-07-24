import React from 'react'
import CopyButton from './CopyButton'

export default function EmailModule({ content, onChange, onCopy }) {
  return (
    <section className="card p-6 mt-5 stagger-in" style={{ animationDelay: '.25s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold">邮箱配置</h2>
        <CopyButton onCopy={() => onCopy(content)} />
      </div>
      <textarea
        className="code-area p-4"
        rows={10}
        placeholder="记录邮箱模板配置变更..."
        value={content}
        onChange={e => onChange(e.target.value)}
      />
    </section>
  )
}
