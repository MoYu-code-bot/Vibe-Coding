import React, { useState } from 'react'
import { Clipboard, ArrowRight } from 'lucide-react'

const MODULES = ['Nacos', '灰度创建', 'DMS 审批', '邮箱配置', '上线模块']

function recognize(text) {
  const lines = text.split('\n')

  // Structured results
  const nacosBlocks = []   // [{filename, content}]
  const frontendApps = []  // [{app}]
  const backendServices = [] // [{lane, service}]
  const dmsRows = []       // [{id, table}]
  const emailLines = []
  const releaseLines = []

  // State machine
  let section = 'auto' // 'auto' | 'frontend' | 'backend'
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) { i++; continue }

    // --- Explicit section markers ---
    if (/前端/.test(trimmed) && /[:：]?\s*$/.test(trimmed) && trimmed.length < 30) {
      section = 'frontend'
      i++; continue
    }
    if (/后端/.test(trimmed) && /[:：]?\s*$/.test(trimmed) && trimmed.length < 30) {
      section = 'backend'
      i++; continue
    }

    // --- Nacos: .yaml / .yml / .properties filename as block header ---
    if (/^[\w][\w\-\/]*\.(yaml|yml|properties)$/i.test(trimmed)) {
      // Collect subsequent YAML content lines
      const contentLines = []
      i++
      while (i < lines.length) {
        const next = lines[i].trim()
        // Stop at next filename-like line or empty section break
        if (/^[\w][\w\-\/]*\.(yaml|yml|properties)$/i.test(next)) break
        // Stop at explicit section markers
        if ((/前端/.test(next) || /后端/.test(next)) && /[:：]?\s*$/.test(next) && next.length < 30) break
        contentLines.push(lines[i])
        i++
      }
      // Trim leading/trailing empty lines from content
      while (contentLines.length && !contentLines[0].trim()) contentLines.shift()
      while (contentLines.length && !contentLines[contentLines.length - 1].trim()) contentLines.pop()
      nacosBlocks.push({ filename: trimmed, content: contentLines.join('\n') })
      continue
    }

    // --- DMS: approval number, table name, and/or approver ---
    // Matches lines with digits (4+), English identifiers, or Chinese characters separated by commas
    if (/^[\d\w\u4e00-\u9fff][\d\w\u4e00-\u9fff\s]*[,，][\d\w\u4e00-\u9fff]/.test(trimmed) &&
        !/\.yaml$|\.yml$|\.properties$/i.test(trimmed)) {
      const parts = trimmed.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      const tokens = parts.map(p => {
        if (/^\d{4,}$/.test(p)) return { type: 'id', value: p }
        if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(p)) return { type: 'table', value: p }
        if (/^[\u4e00-\u9fff]+$/.test(p)) return { type: 'approver', value: p }
        return { type: 'other', value: p }
      })
      const id = (tokens.find(t => t.type === 'id') || {}).value || ''
      const table = (tokens.find(t => t.type === 'table') || {}).value || ''
      const approver = (tokens.find(t => t.type === 'approver') || {}).value || ''
      if (id || table || approver) {
        dmsRows.push({ id, table, approver })
        section = 'auto'
        i++; continue
      }
    }
    // DMS: just a number (4+ digits) alone on a line
    if (/^\d{4,}$/.test(trimmed)) {
      dmsRows.push({ id: trimmed, table: '', approver: '' })
      section = 'auto'
      i++; continue
    }
    // DMS: just a table name (English identifier) alone on a line
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed) && trimmed.length >= 3) {
      dmsRows.push({ id: '', table: trimmed, approver: '' })
      section = 'auto'
      i++; continue
    }

    // --- Email ---
    if (/directmail|邮箱|template[Ii]d|dm-/i.test(trimmed)) {
      emailLines.push(trimmed)
      section = 'auto'
      i++; continue
    }

    // --- Frontend section context ---
    if (section === 'frontend') {
      // App names possibly with (ToC), (ToB) annotations
      const appNames = trimmed.split(/[,，\s]+/).filter(s => s && !/前端|MSE|灰度/i.test(s))
      appNames.forEach(app => frontendApps.push({ app }))
      i++; continue
    }

    // --- Backend section context ---
    if (section === 'backend') {
      // Each line is one table row; the full line content is the service name(s)
      // Lane tag is auto-derived from iteration name in App.jsx
      backendServices.push({ service: trimmed })
      i++; continue
    }

    // --- Generic gray keywords ---
    if (/MSE|SAE|灰度/i.test(trimmed)) {
      i++; continue
    }

    // --- Release: prod- or vg- prefixed names ---
    if (/^(prod[\-_]|vg[\-_])/i.test(trimmed)) {
      releaseLines.push(trimmed)
      i++; continue
    }

    // --- Unclassified: try to infer ---
    // Lines that look like YAML indented content (start with - or # or spaces+key:)
    if (/^\s*[\-#]/.test(line) || /^\s+\w+:\s/.test(line)) {
      // Attach to last nacos block if exists
      if (nacosBlocks.length > 0) {
        const last = nacosBlocks[nacosBlocks.length - 1]
        last.content += (last.content ? '\n' : '') + line
      }
      i++; continue
    }

    i++
  }

  return {
    nacosBlocks,
    frontendApps,
    backendServices,
    dmsRows,
    emailText: emailLines.join('\n'),
    releaseLines,
    detected: {
      'Nacos': nacosBlocks.length > 0,
      '灰度创建': frontendApps.length > 0 || backendServices.length > 0,
      'DMS 审批': dmsRows.length > 0,
      '邮箱配置': emailLines.length > 0,
      '上线模块': releaseLines.length > 0,
    }
  }
}

export default function SmartClipboard({ onImport }) {
  const [text, setText] = useState('')
  const [checked, setChecked] = useState({})

  const handlePaste = (e) => {
    const val = e.target.value
    setText(val)
    if (val.trim()) {
      const result = recognize(val)
      setChecked({
        Nacos: result.detected['Nacos'],
        '灰度创建': result.detected['灰度创建'],
        'DMS 审批': result.detected['DMS 审批'],
        '邮箱配置': result.detected['邮箱配置'],
        '上线模块': result.detected['上线模块'],
      })
    }
  }

  const toggleCheck = (mod) => {
    setChecked(prev => ({ ...prev, [mod]: !prev[mod] }))
  }

  const handleImport = () => {
    if (!text.trim()) return
    const result = recognize(text)
    const selected = {}
    MODULES.forEach(m => { if (checked[m]) selected[m] = true })
    onImport({ ...result, selected })
    setText('')
    setChecked({})
  }

  return (
    <section className="card p-6 mt-6 stagger-in" style={{ animationDelay: '.05s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="module-title text-base font-semibold flex items-center gap-2">
          <Clipboard size={16} color="#10b981" />
          智能剪贴板
        </h2>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>粘贴迭代文档，自动识别并分发到各模块</span>
      </div>
      <div className="clipboard-zone p-4 mb-4">
        <textarea
          className="w-full bg-transparent text-sm resize-none focus:outline-none"
          style={{ color: 'var(--text2)' }}
          rows={5}
          value={text}
          onChange={handlePaste}
          placeholder={"将原始迭代文档内容粘贴到这里...\n\n工具会自动识别 Nacos 配置、灰度服务、DMS 审批、邮箱模板、上线服务等内容。"}
        />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5">
          <span style={{ color: 'var(--text3)', fontSize: 12, marginRight: 4 }}>识别结果：</span>
          {MODULES.map(mod => (
            <div
              key={mod}
              className={`check-item ${checked[mod] ? 'checked' : ''}`}
              onClick={() => toggleCheck(mod)}
            >
              <div className="check-box">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-sm">{mod}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary rounded-lg px-5 py-2 text-sm" onClick={handleImport}>
          <span className="flex items-center gap-2">
            导入选中模块 <ArrowRight size={12} />
          </span>
        </button>
      </div>
    </section>
  )
}
