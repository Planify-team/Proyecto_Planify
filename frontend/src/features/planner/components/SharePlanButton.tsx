import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  slug: string
  isPublic: boolean
  onMakePublic: () => void
}

export function SharePlanButton({ slug, isPublic, onMakePublic }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/planes/p/${slug}`

  const handleCopy = async () => {
    if (!isPublic) {
      onMakePublic()
      return
    }
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      onClick={handleCopy}
    >
      {copied ? '¡Copiado!' : isPublic ? 'Copiar link' : 'Compartir'}
    </Button>
  )
}
