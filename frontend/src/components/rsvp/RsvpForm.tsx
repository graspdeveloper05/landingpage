import { useState, type FormEvent } from 'react'
import { useI18n } from '@/i18n'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Ornament } from '@/components/ui/Ornament'
import { createRegistration, RegistrationError } from '@/services/api'
import type { Registration, RegistrationRecord } from '@/data/types'

type Errors = Partial<Record<keyof Registration | 'form', string>>

const EMPTY: Registration = {
  fullName: '',
  email: '',
  mobile: '',
  organisation: '',
  designation: '',
  dietary: '',
  pdpaAccepted: false,
}

/**
 * §9 — the fields are exactly those the brief lists, and no more. The brief is
 * explicit that required information stays limited to what is genuinely needed.
 */
export function RsvpForm({
  onRegistered,
  onFull,
}: {
  onRegistered: (record: RegistrationRecord) => void
  onFull: () => void
}) {
  const { t, tList } = useI18n()
  const [values, setValues] = useState<Registration>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Registration, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  function validate(v: Registration): Errors {
    const next: Errors = {}
    if (!v.fullName.trim()) next.fullName = t('rsvp.errors.fullName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) next.email = t('rsvp.errors.email')
    // Malaysian mobiles run 9-11 digits; also accept +60 and international guests.
    if (!/^\+?[\d\s-]{8,16}$/.test(v.mobile.trim())) next.mobile = t('rsvp.errors.mobile')
    if (!v.organisation.trim()) next.organisation = t('rsvp.errors.organisation')
    if (!v.designation.trim()) next.designation = t('rsvp.errors.designation')
    if (!v.pdpaAccepted) next.pdpaAccepted = t('rsvp.errors.pdpa')
    return next
  }

  function set<K extends keyof Registration>(key: K, value: Registration[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    // Only clear errors as they are fixed; do not raise new ones mid-typing.
    if (errors[key]) setErrors((e) => ({ ...e, [key]: validate(next)[key] }))
  }

  function blur(key: keyof Registration) {
    setTouched((s) => ({ ...s, [key]: true }))
    setErrors((e) => ({ ...e, [key]: validate(values)[key] }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setTouched({
      fullName: true,
      email: true,
      mobile: true,
      organisation: true,
      designation: true,
      pdpaAccepted: true,
    })
    if (Object.values(found).some(Boolean)) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    setSubmitting(true)
    try {
      onRegistered(await createRegistration(values))
    } catch (err) {
      if (err instanceof RegistrationError && err.kind === 'full') onFull()
      else setErrors({ form: t('rsvp.errors.generic') })
    } finally {
      setSubmitting(false)
    }
  }

  const err = (k: keyof Registration) => (touched[k] ? errors[k] : undefined)

  return (
    <form onSubmit={onSubmit} noValidate>
      {errors.form && (
        <p role="alert" className="mb-6 border-l-2 border-gold-500 py-2 pl-4 text-small text-cream">
          {errors.form}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          className="sm:col-span-2"
          label={t('rsvp.fields.fullName')}
          value={values.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          onBlur={() => blur('fullName')}
          error={err('fullName')}
          autoComplete="name"
          required
        />
        <Field
          label={t('rsvp.fields.email')}
          type="email"
          inputMode="email"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => blur('email')}
          error={err('email')}
          autoComplete="email"
          required
        />
        <Field
          label={t('rsvp.fields.mobile')}
          type="tel"
          inputMode="tel"
          value={values.mobile}
          onChange={(e) => set('mobile', e.target.value)}
          onBlur={() => blur('mobile')}
          error={err('mobile')}
          autoComplete="tel"
          required
        />
        <Field
          label={t('rsvp.fields.organisation')}
          value={values.organisation}
          onChange={(e) => set('organisation', e.target.value)}
          onBlur={() => blur('organisation')}
          error={err('organisation')}
          autoComplete="organization"
          required
        />
        <Field
          label={t('rsvp.fields.designation')}
          value={values.designation}
          onChange={(e) => set('designation', e.target.value)}
          onBlur={() => blur('designation')}
          error={err('designation')}
          autoComplete="organization-title"
          required
        />
        <Field
          className="sm:col-span-2"
          label={t('rsvp.fields.dietary')}
          value={values.dietary}
          onChange={(e) => set('dietary', e.target.value)}
          hint={t('rsvp.fields.dietaryHint')}
          optionalLabel={t('rsvp.fields.optional')}
        />
      </div>

      {/* §9 and §12 — privacy/PDPA acknowledgement. */}
      <div className="mt-7">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={values.pdpaAccepted}
            onChange={(e) => set('pdpaAccepted', e.target.checked)}
            onBlur={() => blur('pdpaAccepted')}
            aria-invalid={err('pdpaAccepted') ? true : undefined}
            aria-describedby={err('pdpaAccepted') ? 'pdpa-error' : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9A227]"
          />
          <span className="text-small leading-relaxed text-cream/80">{t('rsvp.fields.pdpa')}</span>
        </label>
        {err('pdpaAccepted') && (
          <p id="pdpa-error" className="mt-2 pl-8 text-micro text-gold-300">
            {err('pdpaAccepted')}
          </p>
        )}
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className="mt-2 pl-8 text-micro text-cream/50 underline underline-offset-4 transition-colors hover:text-gold-500"
        >
          {t('rsvp.fields.pdpaLink')}
        </button>
      </div>

      <Button type="submit" disabled={submitting} withArrow className="mt-8 w-full sm:w-auto">
        {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
      </Button>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title={t('privacy.title')}>
        <h2 className="text-section font-semibold text-navy-900">{t('privacy.title')}</h2>
        <Ornament className="mt-4 !justify-start" />
        <div className="prose-measure mt-6">
          {tList('privacy.body').map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Modal>
    </form>
  )
}
