import { useState } from 'react'
import { Copy, CopyCheck } from 'lucide-react'

interface CopyButtonProps {
  value: string
}

export default function CopyButton({ value }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  const onCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" onClick={() => void onCopy()} className="arbiter-button-secondary p-2" title="Copy">
      {copied ? <CopyCheck size={14} /> : <Copy size={14} />}
    </button>
  )
}

