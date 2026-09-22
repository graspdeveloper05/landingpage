import { useState, type FormEvent } from 'react'
import { useI18n } from '@/i18n'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Ornament } from '@/components/ui/Ornament'
import { cn } from '@/lib/cn'
import { copyToGoogleForm } from '@/lib/googleForm'
import { useEvent } from '@/lib/useContent'
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
  cheveningScholar: '',
  cheveningCohort: '',
  cheveningUniversity: '',
  camMember: '',
  pdpaAccepted: false,
}

/**
 * §9's fields, plus the Chevening questions the organising team's Google Form
 * asks: every registration here is copied into that form, and it will not
 * take one without them. Cohort, university and CAM membership are asked only
 * of scholars, as on their form.
 */
export function RsvpForm({
  onRegistered,
  onFull,
}: {
  onRegistered: (record: RegistrationRecord) => void
  onFull: () => void
}) {
  const { t, tList } = useI18n()
  // For the Google Form the panel has set; see copyToGoogleForm.
  const event = useEvent()
  const [values, setValues] = useState<Registration>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Registration, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  // Once Submit has been pressed, empty required boxes are errors too.
  const [submitted, setSubmitted] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  function validate(v: Registration): Errors {
    const next: Errors = {}
    if (!v.fullName.trim()) next.fullName = t('rsvp.errors.fullName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) next.email = t('rsvp.errors.email')
    // Malaysian mobiles run 9-11 digits; also accept +60 and international guests.
    if (!/^\+?[\d\s-]{8,16}$/.test(v.mobile.trim())) next.mobile = t('rsvp.errors.mobile')
    if (!v.organisation.trim()) next.organisation = t('rsvp.errors.organisation')
    if (!v.designation.trim()) next.designation = t('rsvp.errors.designation')
    if (!v.cheveningScholar) next.cheveningScholar = t('rsvp.errors.choose')
    if (v.cheveningScholar === 'yes') {
      if (!v.cheveningCohort.trim()) next.cheveningCohort = t('rsvp.errors.cheveningCohort')
      if (!v.cheveningUniversity.trim()) next.cheveningUniversity = t('rsvp.errors.cheveningUniversity')
      if (!v.camMember) next.camMember = t('rsvp.errors.choose')
    }
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
    // Leaving a box empty is not a mistake yet -- people click through, or
    // the browser fills some in -- so "enter your name" waits for Submit.
    // Something typed wrong, like half an email address, is said at once.
    const value = values[key]
    const filled = typeof value === 'string' ? value.trim() !== '' : Boolean(value)
    setErrors((e) => ({ ...e, [key]: submitted || filled ? validate(values)[key] : undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const found = validate(values)
    setErrors(found)
    setTouched({
      fullName: true,
      email: true,
      mobile: true,
      organisation: true,
      designation: true,
      cheveningScholar: true,
      cheveningCohort: true,
      cheveningUniversity: true,
      camMember: true,
      pdpaAccepted: true,
    })
    if (Object.values(found).some(Boolean)) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    setSubmitting(true)
    try {
      const record = await createRegistration(values)
      // Only after the site has saved it: the site's list is the one that
      // must be complete; the Google Form's is a copy.
      copyToGoogleForm(values, event.googleForm)
      onRegistered(record)
    } catch (err) {
      if (err instanceof RegistrationError && err.kind === 'full') {
        onFull()
      } else if (err instanceof RegistrationError && err.kind === 'validation') {
        /*
         * The server rejected something the client could not have caught --
         * in practice an email already registered for this edition, since the
         * API allows one seat per address. Show it against the field it
         * belongs to rather than as a generic failure at the top of the form.
         */
        const fields = err.fields ?? {}
        const mapped = Object.entries(fields).filter(([key]) => key in EMPTY) as [
          keyof Registration,
          string,
        ][]

        if (mapped.length > 0) {
          setErrors(Object.fromEntries(mapped))
          setTouched((s) => ({ ...s, ...Object.fromEntries(mapped.map(([k]) => [k, true])) }))
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
        } else {
          setErrors({ form: t('rsvp.errors.generic') })
        }
      } else {
        setErrors({ form: t('rsvp.errors.generic') })
      }
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

        <YesNo
          className="sm:col-span-2"
          name="cheveningScholar"
          label={t('rsvp.fields.cheveningScholar')}
          value={values.cheveningScholar}
          onChange={(v) => set('cheveningScholar', v)}
          error={err('cheveningScholar')}
          yes={t('rsvp.fields.yes')}
          no={t('rsvp.fields.no')}
        />

        {values.cheveningScholar === 'yes' && (
          <>
            <Field
              label={t('rsvp.fields.cheveningCohort')}
              value={values.cheveningCohort}
              onChange={(e) => set('cheveningCohort', e.target.value)}
              onBlur={() => blur('cheveningCohort')}
              error={err('cheveningCohort')}
              hint={t('rsvp.fields.cheveningCohortHint')}
              required
            />
            <Field
              label={t('rsvp.fields.cheveningUniversity')}
              value={values.cheveningUniversity}
              onChange={(e) => set('cheveningUniversity', e.target.value)}
              onBlur={() => blur('cheveningUniversity')}
              error={err('cheveningUniversity')}
              required
            />
            <YesNo
              className="sm:col-span-2"
              name="camMember"
              label={t('rsvp.fields.camMember')}
              value={values.camMember}
              onChange={(v) => set('camMember', v)}
              error={err('camMember')}
              yes={t('rsvp.fields.yes')}
              no={t('rsvp.fields.no')}
            />
          </>
        )}
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

/** A required yes/no question, styled to sit with the text fields. */
function YesNo({
  name,
  label,
  value,
  onChange,
  error,
  yes,
  no,
  className,
}: {
  name: string
  label: string
  value: '' | 'yes' | 'no'
  onChange: (value: 'yes' | 'no') => void
  error?: string
  yes: string
  no: string
  className?: string
}) {
  const errorId = `${name}-error`

  return (
    <fieldset className={className} aria-describedby={error ? errorId : undefined}>
      <legend className="text-micro font-medium uppercase tracking-[0.08em] text-cream/70">{label}</legend>
      <div className="mt-2 flex gap-3">
        {(['yes', 'no'] as const).map((option, i) => (
          <label
            key={option}
            className={cn(
              'flex min-h-[48px] min-w-[7rem] cursor-pointer items-center gap-3 rounded-sm border px-4 text-body transition-colors',
              value === option
                ? 'border-gold-500 bg-gold-500/15 text-cream'
                : 'border-cream/25 text-cream/85 hover:border-gold-300',
              error && 'border-red-400',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              // On the first option only, so the form's jump-to-first-error
              // lands on this question once, not on each of its answers.
              aria-invalid={error && i === 0 ? true : undefined}
              className="h-4 w-4 accent-[#C9A227]"
            />
            {option === 'yes' ? yes : no}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-micro text-gold-300">
          <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-gold-400" />
          {error}
        </p>
      )}
    </fieldset>
  )
}
