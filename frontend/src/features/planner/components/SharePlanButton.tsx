import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Copy, MessageCircle, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import { plannerService } from '@/services/plannerService'

interface Props {
  planId: string
  slug: string
  isPublic: boolean
  onMakePublic: () => void
}

export function SharePlanButton({ planId, slug, isPublic, onMakePublic }: Props) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const shareUrl = `${window.location.origin}/planes/p/${slug}`

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const ensurePublic = (): boolean => {
    if (!isPublic) {
      onMakePublic()
      return false
    }
    return true
  }

  const handleCopy = async () => {
    if (!ensurePublic()) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
  }

  const handleWhatsApp = async () => {
    if (!ensurePublic()) return
    plannerService.sharePlan(planId).catch(() => {})
    const text = encodeURIComponent(`¡Mirá mi plan! ${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
        rightIcon={<ChevronDown className="h-3 w-3" />}
        onClick={() => setOpen(prev => !prev)}
      >
        {copied ? '¡Copiado!' : 'Compartir'}
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl shadow-glass border border-white/10 bg-white z-10">
          <div className="py-1">
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-white/5 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-t-xl"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar link
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-white/5 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-b-xl"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
              Compartir por WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
