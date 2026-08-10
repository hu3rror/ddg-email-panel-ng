'use client'

import React, { useState } from 'react'

interface CopyButtonProps {
  text: string
  disabled?: boolean
}

export function CopyButton({ text, disabled = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text || disabled) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !text}
      className="px-3 py-1 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-md disabled:opacity-50 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}