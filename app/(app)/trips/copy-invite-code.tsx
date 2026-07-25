'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault() 
    e.stopPropagation()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      Invite code: <code className="bg-muted text-primary px-2 py-1 rounded">{code}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </p>
  )
}