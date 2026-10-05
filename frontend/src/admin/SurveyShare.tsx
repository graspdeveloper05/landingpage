import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { AdminButton, AdminCard } from './ui'
import { useToast } from './Toast'

/** The survey's own link. Each survey has one, so a live poll and the post-event survey can be shared apart. */
export function surveyUrl(surveyId: number) {
  return `${window.location.origin}/survey/${surveyId}`
}

/** The QR code and link to show on the hall screen. */
export function SurveyShare({ surveyId }: { surveyId: number }) {
  const url = surveyUrl(surveyId)
  const [src, setSrc] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: '#0B2140', light: '#FFFFFF' } })
      .then(setSrc)
      .catch(() => setSrc(null))
  }, [url])

  return (
    <AdminCard className="flex flex-wrap items-center gap-4">
      {src && (
        <img src={src} alt={`QR code for ${url}`} className="h-32 w-32 rounded-sm border border-hair" />
      )}
      <div className="min-w-[12rem] flex-1 space-y-2">
        <p className="text-[0.85rem] font-semibold text-navy-950">Show this on the screen</p>
        <p className="break-all text-small text-slate">{url}</p>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="quiet"
            onClick={() =>
              navigator.clipboard.writeText(url).then(
                () => toast.success('Link copied.'),
                () => toast.error('Could not copy. Select the link instead.'),
              )
            }
          >
            Copy link
          </AdminButton>
          {src && (
            <a
              href={src}
              download={`survey-${surveyId}-qr.png`}
              className="inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
            >
              Download QR
            </a>
          )}
        </div>
      </div>
    </AdminCard>
  )
}
