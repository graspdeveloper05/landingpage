import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'

/** §3 — BM | EN | 中文 | தமிழ், with tap targets that clear 44px on a phone. */
export function LanguageSwitcher({
  className,
  tone = 'light',
}: {
  className?: string
  tone?: 'light' | 'dark'
}) {
  const { locale, setLocale, localeNames, t } = useI18n()
  const idle = tone === 'light' ? 'text-cream/60 hover:text-cream' : 'text-slate hover:text-navy-900'
  const rule = tone === 'light' ? 'bg-cream/25' : 'bg-navy-900/15'
  const active = tone === 'light' ? 'text-gold-500' : 'text-gold-600'

  return (
    <div className={cn('flex items-center', className)} role="group" aria-label={t('nav.language')}>
      {localeNames.map(({ code, short, name }, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span aria-hidden className={cn('h-3.5 w-px', rule)} />}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-current={locale === code ? 'true' : undefined}
            title={name}
            className={cn(
              'min-h-[44px] px-2.5 text-small transition-colors duration-200 sm:px-3',
              locale === code ? cn('font-semibold', active) : idle,
            )}
          >
            {short}
          </button>
        </span>
      ))}
    </div>
  )
}
