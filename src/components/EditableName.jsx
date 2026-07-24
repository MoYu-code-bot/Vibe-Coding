import React, { useRef, useEffect, useState } from 'react'

export default function EditableName({ value, onChange }) {
  const ref = useRef(null)
  const [hint, setHint] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ref.current.blur()
    }
  }

  const handleBlur = () => {
    const text = ref.current.textContent.trim()
    if (text) onChange(text)
    else ref.current.textContent = value
    setHint(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        ref={ref}
        className="iter-name"
        style={{ fontSize: 20, fontWeight: 700 }}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onMouseEnter={() => { if (document.activeElement !== ref.current) setHint(true) }}
        onMouseLeave={() => { if (document.activeElement !== ref.current) setHint(false) }}
        onFocus={() => setHint(false)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {value}
      </span>
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
        style={{ opacity: hint ? 1 : 0, transition: 'opacity .2s', marginTop: 2 }}
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </div>
  )
}
