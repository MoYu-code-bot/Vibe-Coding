import React from 'react'
import { ClipboardCopy } from 'lucide-react'

export default function CopyButton({ onCopy }) {
  const handleClick = () => {
    onCopy()
  }
  return (
    <button className="btn-copy flex items-center gap-1.5" onClick={handleClick}>
      <ClipboardCopy size={12} /> 复制
    </button>
  )
}
