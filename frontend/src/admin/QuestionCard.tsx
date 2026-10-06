import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { Smiley } from '@/components/survey/Smiley'
import type { AdminSurveyQuestion, FormType, Locale, Localized } from './client'
import {
  KINDS,
  LANGUAGES,
  LIMITS,
  choiceCount,
  hasOptionList,
  localized,
  scaleNumbers,
  withKind,
  type Draft,
  type QuestionKind,
} from './formDraft'

/**
 * One question in the form builder. Closed, it shows what attendees will
 * see; open, it is edited where it stands, as in Google Forms: the wording,
 * a type menu, the options as they will look, and a bar of switches.
 */
export function QuestionCard({
  number,
  question,
  draft,
  open,
  fresh,
  lang,
  formType,
  problems,
  grip,
  onOpen,
  onClose,
  onChange,
  onDuplicate,
  onDelete,
}: {
  number: number
  question: AdminSurveyQuestion
  draft: Draft
  open: boolean
  /** Just added: its wording is selected, ready to type over. */
  fresh: boolean
  lang: Locale
  formType: FormType
  problems: string[]
  grip: React.ReactNode
  onOpen: () => void
  onClose: () => void
  onChange: (next: Draft) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  // Once answered, old answers point at options by position: the kind and
  // the options' number and order stay; their wording can still change.
  const locked = (question.responses_count ?? 0) > 0
  const translating = lang !== 'en'
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })

  return (
    <div
      className={cn(
        'relative rounded-md border bg-white transition-shadow duration-200',
        open
          ? 'border-[#DDDCD8] shadow-[0_6px_24px_-10px_rgba(11,33,64,0.35)]'
          : 'border-[#E6E5E1] hover:border-[#CFCDC7] hover:shadow-card',
      )}
    >
      {/* A gold edge marks the question being edited, as the colour bar in Google Forms. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 z-[1] w-1 rounded-l-md transition-colors',
          open ? 'bg-gold-500' : 'bg-transparent',
        )}
      />

      {draft.section && (
        <SectionBreak
          section={draft.section}
          open={open}
          hidden={draft.status !== 'open'}
          lang={lang}
          onChange={(section) => set({ section })}
          onRemove={() => set({ section: null })}
        />
      )}

      {!open ? (
        <div className="flex items-start gap-1 px-3 py-3 sm:px-4">
          <span className="mt-1">{grip}</span>
          <div
            role="button"
            tabIndex={0}
            aria-label={`Edit question ${number}: ${draft.question.en}`}
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen()
              }
            }}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-sm px-2 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          >
            <span className="tnum mt-0.5 w-6 shrink-0 text-[0.85rem] font-semibold text-gold-700">
              {number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.92rem] font-semibold leading-snug text-navy-950">
                {pickText(draft.question, lang) || (
                  <span className="italic text-slate">No question yet</span>
                )}
                {draft.required && <span className="ml-1 text-red-600">*</span>}
              </span>
              {draft.help.en && (
                <span className="mt-0.5 block text-micro text-slate">
                  {pickText(draft.help, lang)}
                </span>
              )}
              <Preview draft={draft} lang={lang} />
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              {draft.status !== 'open' && (
                <span className="rounded-full border border-[#DDDCD8] bg-[#F1F1EF] px-2 py-0.5 text-micro font-semibold text-slate">
                  Hidden
                </span>
              )}
              {translating && missingIn(draft, lang) > 0 && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-micro font-semibold text-amber-800">
                  {missingIn(draft, lang)} to translate
                </span>
              )}
              {problems.length > 0 && (
                <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-micro font-semibold text-red-700">
                  Not saved
                </span>
              )}
              <span className="text-micro text-slate">
                {question.responses_count ?? 0}{' '}
                {question.responses_count === 1 ? 'answer' : 'answers'}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 pt-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-3">
            <span className="-ml-1 mt-1">{grip}</span>
            <div className="min-w-[14rem] flex-1">
              <TextField
                value={draft.question}
                lang={lang}
                onChange={(question) => set({ question })}
                placeholder="Question"
                big
                autoSelect={fresh}
                maxLength={LIMITS.question}
                label="Question"
              />
            </div>
            <KindMenu
              kind={draft.kind}
              disabled={locked || translating}
              onChange={(kind) => onChange(withKind(draft, kind))}
            />
          </div>

          {(draft.help.en || translating === false) && (
            <HelpField draft={draft} lang={lang} onChange={(help) => set({ help })} />
          )}

          {draft.status !== 'open' && !translating && (
            <p className="mt-3 rounded-sm bg-[#F1F1EF] px-3 py-2 text-micro text-navy-900">
              Hidden from attendees. Switch on “Shown to attendees” below when this question is
              ready.
            </p>
          )}

          {locked && !translating && (
            <p className="mt-3 rounded-sm bg-amber-50 px-3 py-2 text-micro text-amber-900">
              People have answered this question. You can reword it and translate it, but not change
              its type or add, remove or reorder options.
            </p>
          )}

          <div className="mt-4">
            <AnswerEditor draft={draft} lang={lang} locked={locked} formType={formType} set={set} />
          </div>

          {problems.length > 0 && (
            <ul role="alert" className="mt-4 space-y-1 rounded-sm bg-red-50 px-3 py-2">
              {problems.map((p) => (
                <li key={p} className="text-micro font-semibold text-red-700">
                  {p}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-x-1 gap-y-2 border-t border-[#EEEDEA] pt-3">
            <Switch
              checked={draft.status === 'open'}
              onChange={(on) => set({ status: on ? 'open' : 'closed' })}
              label="Shown to attendees"
            />
            <span aria-hidden className="mx-2 h-6 w-px bg-[#E6E5E1]" />
            <Switch
              checked={draft.required}
              onChange={(required) => set({ required })}
              label="Required"
            />
            <span aria-hidden className="mx-2 h-6 w-px bg-[#E6E5E1]" />
            <MoreMenu draft={draft} disabled={translating} onChange={onChange} />
            <IconButton label="Duplicate" onClick={onDuplicate} withText>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
                <path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
              </svg>
            </IconButton>
            <IconButton label="Delete" onClick={onDelete} danger withText>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 6h12M8 6V4.5h4V6M6 6l.7 10h6.6L14 6" strokeLinejoin="round" />
              </svg>
            </IconButton>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 min-h-[34px] rounded-sm bg-navy-900 px-4 text-[0.78rem] font-semibold text-cream hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const pickText = (v: Localized, lang: Locale) => (lang === 'en' ? v.en : v[lang] || v.en)

/** Texts with English but not yet this language, on one question. */
function missingIn(d: Draft, lang: Locale): number {
  const all: Localized[] = [d.question, d.help]
  if (d.section) all.push(d.section.title, d.section.intro)
  if (hasOptionList(d.kind)) all.push(...d.options)
  if (d.kind === 'grid') all.push(...d.statements)
  return all.filter((v) => v.en.trim() && !v[lang]?.trim()).length
}

const langLabel = (lang: Locale) => LANGUAGES.find((l) => l.code === lang)?.label ?? lang

/**
 * A text the team types. In English it is a plain box; in another language
 * the English sits above in grey and the box takes the translation.
 */
export function TextField({
  value,
  lang,
  onChange,
  placeholder,
  label,
  big,
  autoSelect,
  multiline,
  inputClassName,
  maxLength,
}: {
  value: Localized
  lang: Locale
  onChange: (next: Localized) => void
  placeholder: string
  label: string
  big?: boolean
  autoSelect?: boolean
  multiline?: boolean
  inputClassName?: string
  maxLength?: number
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  useEffect(() => {
    if (autoSelect) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [autoSelect])

  const translating = lang !== 'en'
  const Tag = multiline ? 'textarea' : 'input'

  return (
    <div className="min-w-0">
      {translating && (
        <p className={cn('text-slate', big ? 'text-[0.85rem]' : 'text-micro')}>
          {value.en || <span className="italic">No English yet</span>}
        </p>
      )}
      <Tag
        ref={ref}
        value={translating ? (value[lang] ?? '') : value.en}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        placeholder={translating ? `In ${langLabel(lang)}` : placeholder}
        aria-label={translating ? `${label} in ${langLabel(lang)}` : label}
        rows={multiline ? 2 : undefined}
        maxLength={maxLength}
        className={cn(
          'block w-full border-0 border-b bg-transparent px-1 text-navy-950 transition-colors',
          'placeholder:text-slate/60 focus:outline-none focus:ring-0',
          big
            ? 'min-h-[44px] border-[#CFCDC7] bg-[#FAFAF8] px-3 text-[1rem] font-semibold focus:border-b-2 focus:border-gold-500'
            : 'min-h-[34px] border-transparent text-[0.88rem] hover:border-[#DDDCD8] focus:border-gold-500',
          multiline && 'resize-y py-1.5',
          translating && !value[lang]?.trim() && value.en.trim() && 'bg-amber-50/60',
          inputClassName,
        )}
      />
    </div>
  )
}

function HelpField({
  draft,
  lang,
  onChange,
}: {
  draft: Draft
  lang: Locale
  onChange: (help: Localized) => void
}) {
  return (
    <div className="mt-2 pl-[1.75rem] sm:pl-[2.25rem]">
      <TextField
        value={draft.help}
        lang={lang}
        onChange={onChange}
        placeholder="Note under the question (optional)"
        maxLength={LIMITS.help}
        label="Note under the question"
      />
    </div>
  )
}

/* ------------------------------------------------------------- answer area */

function AnswerEditor({
  draft,
  lang,
  locked,
  formType,
  set,
}: {
  draft: Draft
  lang: Locale
  locked: boolean
  formType: FormType
  set: (patch: Partial<Draft>) => void
}) {
  const translating = lang !== 'en'
  const structural = locked || translating

  if (draft.kind === 'rating') {
    return (
      <RatingEditor
        smileys={draft.smileys}
        disabled={translating}
        onChange={(smileys) => set({ smileys })}
      />
    )
  }

  if (draft.kind === 'text') {
    return (
      <div className="pl-1">
        <p className="max-w-md border-b border-dashed border-[#CFCDC7] pb-2 text-[0.85rem] text-slate">
          Attendees type their answer here
          {draft.maxLength ? ` · up to ${draft.maxLength} characters` : ''}
        </p>
      </div>
    )
  }

  if (draft.kind === 'grid') {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-micro font-semibold uppercase tracking-wide text-slate">
            Statements (rows)
          </p>
          <OptionList
            items={draft.statements}
            onChange={(statements) => set({ statements })}
            lang={lang}
            locked={structural}
            marker={(i) => <span className="tnum text-micro text-slate">{i + 1}.</span>}
            addLabel="Add statement"
            newItem={(n) => localized(`Statement ${n}`)}
            min={1}
            max={LIMITS.statements}
            textLimit={LIMITS.statement}
          />
        </div>
        <div>
          <p className="mb-1 text-micro font-semibold uppercase tracking-wide text-slate">
            Answer scale (columns)
          </p>
          <OptionList
            items={draft.options}
            onChange={(options) => set({ options })}
            lang={lang}
            locked={structural}
            marker={() => <Ring />}
            addLabel="Add column"
            newItem={(n) => localized(`Column ${n}`)}
            min={2}
            max={LIMITS.options}
            textLimit={LIMITS.option}
          />
        </div>
      </div>
    )
  }

  const min = draft.kind === 'checkbox' && formType === 'feedback' ? 1 : 2
  return (
    <>
      <OptionList
        items={draft.options}
        onChange={(options) => set({ options })}
        lang={lang}
        locked={structural}
        marker={(i) =>
          draft.kind === 'scale' ? (
            <span className="tnum grid h-5 w-5 place-items-center rounded-sm border border-gold-500/50 text-micro font-semibold text-gold-700">
              {scaleNumbers(draft.options)[i] ?? '–'}
            </span>
          ) : draft.kind === 'checkbox' ? (
            <Box />
          ) : (
            <Ring />
          )
        }
        addLabel="Add option"
        newItem={(n) => localized(`Option ${n}`)}
        min={min}
        max={LIMITS.options}
        textLimit={LIMITS.option}
        extra={
          (draft.kind === 'choice' || draft.kind === 'checkbox') &&
          (draft.hasOther ? (
            <div className="flex items-center gap-3 py-1 pl-1">
              {draft.kind === 'checkbox' ? <Box /> : <Ring />}
              <span className="flex-1 border-b border-dashed border-[#DDDCD8] pb-1 text-[0.88rem] text-slate">
                Other… <span className="text-micro">(attendees type their own)</span>
              </span>
              {!structural && (
                <RemoveButton label="Remove “Other”" onClick={() => set({ hasOther: false })} />
              )}
            </div>
          ) : null)
        }
        addOther={
          (draft.kind === 'choice' || draft.kind === 'checkbox') && !draft.hasOther && !structural
            ? () => set({ hasOther: true })
            : undefined
        }
      />
      {draft.kind === 'scale' && !translating && (
        <p className="mt-2 pl-1 text-micro text-slate">
          Shown as numbered cards. An option starting “Not sure” or “N/A” is set apart, unnumbered.
        </p>
      )}
    </>
  )
}

/**
 * The options (or statements) as rows: a marker, the text, a remove button,
 * and a drag handle to reorder. New ones arrive named "Option 3", ready to
 * type over.
 */
function OptionList({
  items,
  onChange,
  lang,
  locked,
  marker,
  addLabel,
  newItem,
  min,
  max,
  textLimit,
  extra,
  addOther,
}: {
  items: Localized[]
  onChange: (next: Localized[]) => void
  lang: Locale
  locked: boolean
  marker: (i: number) => React.ReactNode
  addLabel: string
  newItem: (n: number) => Localized
  min: number
  max: number
  textLimit: number
  extra?: React.ReactNode
  addOther?: () => void
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  // The row is draggable only while its dots are held, so pressing in a text
  // box selects text rather than picking the row up.
  const [armed, setArmed] = useState<number | null>(null)
  const full = items.length >= max
  const [focusLast, setFocusLast] = useState(false)
  const lastRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (focusLast) {
      lastRef.current?.focus()
      lastRef.current?.select()
      setFocusLast(false)
    }
  }, [focusLast])

  const moveTo = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    onChange(next)
  }

  return (
    <div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={i}
            draggable={!locked && armed === i}
            onDragStart={(e) => {
              setDragFrom(i)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', String(i))
            }}
            onDragOver={(e) => {
              if (dragFrom === null) return
              e.preventDefault()
              if (dragFrom !== i) {
                moveTo(dragFrom, i)
                setDragFrom(i)
              }
            }}
            onDragEnd={() => {
              setDragFrom(null)
              setArmed(null)
            }}
            className={cn(
              'group flex items-center gap-3 rounded-sm py-0.5 pl-1 transition-colors',
              dragFrom === i && 'bg-gold-500/10',
            )}
          >
            {!locked && (
              <span
                aria-hidden
                title="Drag to reorder"
                onPointerDown={() => setArmed(i)}
                onPointerUp={() => setArmed(null)}
                className="-ml-4 cursor-grab text-[#BDBAB3] opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Dots />
              </span>
            )}
            {marker(i)}
            <div className="flex-1">
              <OptionInput
                value={item}
                lang={lang}
                inputRef={i === items.length - 1 ? lastRef : undefined}
                onChange={(v) => onChange(items.map((o, j) => (j === i ? v : o)))}
                maxLength={textLimit}
                onEnter={
                  !locked && lang === 'en' && !full
                    ? () => {
                        onChange([...items, newItem(items.length + 1)])
                        setFocusLast(true)
                      }
                    : undefined
                }
                label={`Option ${i + 1}`}
              />
            </div>
            {!locked && items.length > min && (
              <RemoveButton
                label={`Remove ${item.en || `option ${i + 1}`}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              />
            )}
          </li>
        ))}
      </ul>
      {extra}
      {!locked && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1 pl-1 text-[0.85rem]">
          <button
            type="button"
            disabled={full}
            title={full ? `Up to ${max}` : undefined}
            onClick={() => {
              onChange([...items, newItem(items.length + 1)])
              setFocusLast(true)
            }}
            className="rounded-sm px-1 py-1 font-semibold text-navy-700 hover:bg-[#F1F1EF] hover:text-navy-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + {addLabel}
          </button>
          {full && <span className="text-micro text-slate">(up to {max})</span>}
          {addOther && (
            <>
              <span className="text-slate">or</span>
              <button
                type="button"
                onClick={addOther}
                className="rounded-sm px-1 py-1 font-semibold text-navy-700 hover:bg-[#F1F1EF] hover:text-navy-950"
              >
                add “Other”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function OptionInput({
  value,
  lang,
  onChange,
  onEnter,
  inputRef,
  label,
  maxLength,
}: {
  value: Localized
  lang: Locale
  onChange: (v: Localized) => void
  onEnter?: () => void
  inputRef?: React.Ref<HTMLInputElement>
  label: string
  maxLength: number
}) {
  const translating = lang !== 'en'
  return (
    <div className={cn(translating && 'grid gap-x-3 sm:grid-cols-2 sm:items-center')}>
      {translating && <span className="text-[0.85rem] text-slate">{value.en}</span>}
      <input
        ref={inputRef}
        value={translating ? (value[lang] ?? '') : value.en}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault()
            onEnter()
          }
        }}
        maxLength={maxLength}
        placeholder={translating ? `In ${langLabel(lang)}` : 'Option'}
        aria-label={translating ? `${label} in ${langLabel(lang)}` : label}
        className={cn(
          'block min-h-[34px] w-full border-0 border-b border-transparent bg-transparent px-1 text-[0.88rem] text-navy-950',
          'transition-colors placeholder:text-slate/60 hover:border-[#DDDCD8] focus:border-gold-500 focus:outline-none focus:ring-0',
          translating && !value[lang]?.trim() && value.en.trim() && 'bg-amber-50/60',
        )}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- sections */

function SectionBreak({
  section,
  open,
  hidden,
  lang,
  onChange,
  onRemove,
}: {
  section: NonNullable<Draft['section']>
  open: boolean
  /** Its question is hidden from attendees, so this page break is too. */
  hidden: boolean
  lang: Locale
  onChange: (s: NonNullable<Draft['section']>) => void
  onRemove: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-t-md px-4 py-3 text-cream sm:px-6',
        hidden ? 'bg-navy-950/45' : 'bg-navy-950',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-micro font-semibold tracking-[0.04em] text-gold-400">
          {hidden
            ? 'Page break hidden with its question: attendees will not see this new page'
            : 'New page starts here'}
        </p>
        {open && lang === 'en' && (
          <button
            type="button"
            onClick={onRemove}
            className="text-micro font-semibold text-cream/70 hover:text-cream"
          >
            Remove page break
          </button>
        )}
      </div>
      {open ? (
        <div className="mt-1.5 space-y-1 [&_p]:text-cream/60">
          <TextField
            value={section.title}
            lang={lang}
            onChange={(title) => onChange({ ...section, title })}
            placeholder="Page heading, e.g. Shaping the conversation"
            maxLength={LIMITS.sectionTitle}
            label="Page heading"
            inputClassName="!bg-transparent font-display !text-[1.25rem] !text-cream placeholder:!text-cream/40 !border-cream/20 hover:!border-cream/40 focus:!border-gold-400"
          />
          <TextField
            value={section.intro}
            lang={lang}
            onChange={(intro) => onChange({ ...section, intro })}
            placeholder="A line under the heading (optional)"
            maxLength={LIMITS.sectionIntro}
            label="Line under the page heading"
            inputClassName="!bg-transparent !text-cream/85 placeholder:!text-cream/40 !border-cream/10 hover:!border-cream/40 focus:!border-gold-400"
          />
        </div>
      ) : (
        <p className="mt-0.5 font-display text-[1.05rem] text-cream">
          {pickText(section.title, lang)}
        </p>
      )}
    </div>
  )
}

/** What each point of a rating means, as the attendee form names the faces. */
const RATING_NAMES = ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent']

/**
 * A rating's look: stars or smileys, always 1 to 5, so answers given before
 * a switch keep their meaning. The row underneath is live: point at a face
 * or star to see what it stands for, as attendees will.
 */
function RatingEditor({
  smileys,
  disabled,
  onChange,
}: {
  smileys: boolean
  disabled: boolean
  onChange: (smileys: boolean) => void
}) {
  const [near, setNear] = useState(0)

  return (
    <div className="pl-1">
      <div
        role="radiogroup"
        aria-label="Rating style"
        className="inline-flex rounded-sm border border-[#DDDCD8] bg-[#F4F4F2] p-0.5"
      >
        {[
          { value: false, label: 'Stars', icon: <span className="text-[0.95rem]">★</span> },
          {
            value: true,
            label: 'Smileys',
            icon: <Smiley level={5} className="h-4 w-4" />,
          },
        ].map((o) => {
          const on = smileys === o.value
          return (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex min-h-[30px] items-center gap-1.5 rounded-[3px] px-3 text-[0.78rem] font-semibold transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 disabled:cursor-not-allowed disabled:opacity-50',
                on
                  ? 'bg-white text-navy-950 shadow-[0_1px_3px_rgba(10,22,40,0.15)]'
                  : 'text-slate hover:text-navy-950',
              )}
            >
              <span className={on ? 'text-gold-600' : undefined}>{o.icon}</span>
              {o.label}
            </button>
          )
        })}
      </div>

      <div
        key={String(smileys)}
        className="admin-fade mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2"
        onPointerLeave={() => setNear(0)}
      >
        {[1, 2, 3, 4, 5].map((n) =>
          smileys ? (
            <span
              key={n}
              onPointerEnter={() => setNear(n)}
              className={cn(
                'sv-face grid h-10 w-10 place-items-center transition-colors duration-200',
                near === n ? 'is-on text-navy-950' : 'text-navy-900/40',
              )}
            >
              <span className="block h-full w-full">
                <Smiley level={n} className="h-full w-full" />
              </span>
            </span>
          ) : (
            <span
              key={n}
              onPointerEnter={() => setNear(n)}
              className={cn(
                'text-[1.6rem] leading-none transition-[color,transform] duration-200',
                near >= n ? 'scale-110 text-gold-500' : 'text-gold-500/45',
              )}
            >
              ★
            </span>
          ),
        )}
        <span className="ml-2 text-micro text-slate">
          {near
            ? smileys
              ? `${near} · ${RATING_NAMES[near - 1]}`
              : `${near} of 5 stars`
            : smileys
              ? 'Attendees pick a face, from 1 Very poor to 5 Excellent'
              : 'Attendees choose 1 to 5 stars'}
        </span>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- previews */

/** The answer area as attendees will see it, in miniature. */
function Preview({ draft, lang }: { draft: Draft; lang: Locale }) {
  const shown = draft.options.slice(0, 5)
  const more = draft.options.length - shown.length
  const text = (v: Localized) => pickText(v, lang)

  if (draft.kind === 'rating') {
    return draft.smileys ? (
      <span className="mt-2 flex gap-1 text-gold-600">
        {[1, 2, 3, 4, 5].map((n) => (
          <Smiley key={n} level={n} className="h-5 w-5" />
        ))}
      </span>
    ) : (
      <span className="mt-2 block text-[1rem] tracking-[0.12em] text-gold-500">★★★★★</span>
    )
  }
  if (draft.kind === 'text') {
    return (
      <span className="mt-2 block max-w-sm border-b border-dashed border-[#DDDCD8] pb-1 text-micro text-slate">
        Written answer{draft.maxLength ? ` · up to ${draft.maxLength} characters` : ''}
      </span>
    )
  }
  if (draft.kind === 'grid') {
    return (
      <span className="mt-2 block text-micro text-slate">
        {draft.statements.length} statements · {draft.options.map(text).join(' / ')}
      </span>
    )
  }
  if (draft.kind === 'scale') {
    return (
      <span className="mt-2 flex flex-wrap gap-1.5">
        {draft.options.map((o, i) => (
          // "Not sure" stands apart, unnumbered, as on the form.

          <span
            key={i}
            className="rounded-sm border border-gold-500/40 bg-[#FBF9F3] px-2 py-0.5 text-micro text-navy-900"
          >
            {scaleNumbers(draft.options)[i] !== null && (
              <span className="tnum mr-1 font-semibold text-gold-700">
                {scaleNumbers(draft.options)[i]}
              </span>
            )}
            {text(o)}
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="mt-2 block space-y-0.5">
      {draft.kind === 'checkbox' && draft.maxChoices && (
        <span className="block text-micro font-semibold text-gold-700">
          Select up to {draft.maxChoices}
        </span>
      )}
      {shown.map((o, i) => (
        <span key={i} className="flex items-center gap-2 text-[0.82rem] text-navy-900">
          {draft.kind === 'checkbox' ? <Box small /> : <Ring small />}
          {text(o)}
        </span>
      ))}
      {more > 0 && <span className="block pl-5 text-micro text-slate">+ {more} more</span>}
      {draft.hasOther && (
        <span className="flex items-center gap-2 text-[0.82rem] text-slate">
          {draft.kind === 'checkbox' ? <Box small /> : <Ring small />}
          Other…
        </span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------- menus */

function KindIcon({ kind }: { kind: QuestionKind }) {
  const common = 'h-4 w-4 shrink-0'
  switch (kind) {
    case 'choice':
      return (
        <svg
          viewBox="0 0 16 16"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
        </svg>
      )
    case 'checkbox':
      return (
        <svg
          viewBox="0 0 16 16"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <path d="M5 8.2l2 2 4-4.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'scale':
      return (
        <svg viewBox="0 0 16 16" className={common} fill="currentColor">
          <rect x="1" y="9" width="2.5" height="5" rx="0.5" />
          <rect x="4.75" y="7" width="2.5" height="7" rx="0.5" />
          <rect x="8.5" y="5" width="2.5" height="9" rx="0.5" />
          <rect x="12.25" y="2" width="2.5" height="12" rx="0.5" />
        </svg>
      )
    case 'grid':
      return (
        <svg
          viewBox="0 0 16 16"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
          <path d="M1.5 6.5h13M1.5 10h13M6 2.5v11" />
        </svg>
      )
    case 'rating':
      return (
        <svg viewBox="0 0 16 16" className={common} fill="currentColor">
          <path d="M8 1.5l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.1l-3.9 2.2.9-4.3-3.2-3 4.3-.5z" />
        </svg>
      )
    default:
      return (
        <svg
          viewBox="0 0 16 16"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4h12M2 8h12M2 12h7" strokeLinecap="round" />
        </svg>
      )
  }
}

/** Closes a popover on a click outside it or on Escape. */
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

function KindMenu({
  kind,
  disabled,
  onChange,
}: {
  kind: QuestionKind
  disabled: boolean
  onChange: (k: QuestionKind) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const current = KINDS.find((k) => k.kind === kind)!

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-h-[44px] w-full items-center gap-2.5 rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.85rem] font-semibold text-navy-900 sm:w-[15rem]',
          'hover:border-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
          'disabled:cursor-not-allowed disabled:bg-[#F7F7F5] disabled:text-slate',
        )}
      >
        <span className="text-gold-700">
          <KindIcon kind={kind} />
        </span>
        <span className="flex-1 text-left">{current.label}</span>
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Question type"
          className="absolute right-0 z-30 mt-1 w-[18rem] overflow-hidden rounded-md border border-[#DDDCD8] bg-white py-1 shadow-[0_12px_32px_-12px_rgba(11,33,64,0.4)]"
        >
          {KINDS.map((k) => (
            <li key={k.kind}>
              <button
                type="button"
                role="option"
                aria-selected={k.kind === kind}
                onClick={() => {
                  onChange(k.kind)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-[#F7F7F5]',
                  k.kind === kind && 'bg-gold-500/10',
                )}
              >
                <span className="mt-0.5 text-gold-700">
                  <KindIcon kind={k.kind} />
                </span>
                <span>
                  <span className="block text-[0.85rem] font-semibold text-navy-950">
                    {k.label}
                  </span>
                  <span className="block text-micro text-slate">{k.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * The less common settings, as in Google Forms' ⋮ menu: each one ticked on
 * shows its field on the card, and ticked off clears it.
 */
function MoreMenu({
  draft,
  disabled,
  onChange,
}: {
  draft: Draft
  disabled: boolean
  onChange: (d: Draft) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const items: { label: string; on: boolean; toggle: () => Draft; show: boolean }[] = [
    {
      label: 'Start a new page here',
      on: !!draft.section,
      show: true,
      toggle: () => ({
        ...draft,
        section: draft.section ? null : { title: localized('New section'), intro: localized() },
      }),
    },
    {
      label: 'Limit how many can be ticked',
      on: !!draft.maxChoices,
      show: draft.kind === 'checkbox' && choiceCount(draft) > 1,
      toggle: () => ({
        ...draft,
        maxChoices: draft.maxChoices
          ? null
          : Math.min(3, choiceCount(draft) - 1, LIMITS.maxChoices),
      }),
    },
    {
      label: 'Limit the length of the answer',
      on: !!draft.maxLength,
      show: draft.kind === 'text',
      toggle: () => ({ ...draft, maxLength: draft.maxLength ? null : 300 }),
    },
  ]

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {draft.kind === 'checkbox' && draft.maxChoices && (
        <NumberChip
          label="Up to"
          value={draft.maxChoices}
          min={1}
          max={Math.max(1, Math.min(LIMITS.maxChoices, choiceCount(draft) - 1))}
          onChange={(maxChoices) => onChange({ ...draft, maxChoices })}
        />
      )}
      {draft.kind === 'text' && draft.maxLength && (
        <NumberChip
          label="Max characters"
          value={draft.maxLength}
          min={10}
          max={2000}
          step={50}
          onChange={(maxLength) => onChange({ ...draft, maxLength })}
        />
      )}
      <IconButton label="More settings" onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4.5" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="10" cy="15.5" r="1.6" />
        </svg>
      </IconButton>
      {open && (
        <ul
          role="menu"
          className="absolute bottom-full right-0 z-30 mb-1 w-[16.5rem] overflow-hidden rounded-md border border-[#DDDCD8] bg-white py-1 shadow-[0_12px_32px_-12px_rgba(11,33,64,0.4)]"
        >
          {items
            .filter((i) => i.show)
            .map((i) => (
              <li key={i.label}>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={i.on}
                  onClick={() => {
                    onChange(i.toggle())
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-[0.85rem] text-navy-950 hover:bg-[#F7F7F5]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid h-4 w-4 place-items-center rounded-sm border text-[0.7rem]',
                      i.on ? 'border-gold-600 bg-gold-500 text-white' : 'border-[#CFCDC7]',
                    )}
                  >
                    {i.on && '✓'}
                  </span>
                  {i.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

function NumberChip({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
}) {
  // What is being typed stays as typed ("5" on the way to "500"); it is
  // checked against the range when the box is left or Enter is pressed.
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const commit = () => {
    const n = Math.round(Number(text))
    const next = Number.isFinite(n) && text.trim() !== '' ? Math.min(max, Math.max(min, n)) : value
    setText(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <label className="flex items-center gap-1.5 rounded-sm border border-[#DDDCD8] bg-[#FAFAF8] px-2 py-1 text-micro font-semibold text-navy-900">
      {label}
      <input
        type="number"
        inputMode="numeric"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        className="w-16 rounded-sm border border-[#DDDCD8] bg-white px-1.5 py-0.5 text-[0.8rem] focus:border-gold-500 focus:outline-none"
      />
    </label>
  )
}

/* ------------------------------------------------------------------ pieces */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (on: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[34px] items-center gap-2 rounded-sm px-1.5 text-[0.8rem] font-semibold text-navy-900 hover:bg-[#F7F7F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
    >
      {label}
      <span
        aria-hidden
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors duration-200',
          checked ? 'bg-gold-500' : 'bg-[#CFCDC7]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

function IconButton({
  label,
  onClick,
  danger,
  disabled,
  withText,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  /** The label beside the icon (from a small screen up), not only on hover. */
  withText?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-[34px] items-center justify-center gap-1.5 rounded-sm text-slate transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0',
        withText ? 'min-w-[34px] px-2 text-[0.8rem] font-semibold' : 'w-[34px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'hover:bg-red-50 hover:text-red-700' : 'hover:bg-[#F1F1EF] hover:text-navy-950',
      )}
    >
      {children}
      {withText && (
        <span aria-hidden className="hidden sm:inline">
          {label}
        </span>
      )}
    </button>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Remove"
      className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-[1.1rem] leading-none text-slate hover:bg-red-50 hover:text-red-700"
    >
      ×
    </button>
  )
}

const Ring = ({ small }: { small?: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'inline-block shrink-0 rounded-full border-2 border-[#BDBAB3]',
      small ? 'h-3 w-3' : 'h-4 w-4',
    )}
  />
)

const Box = ({ small }: { small?: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'inline-block shrink-0 rounded-[3px] border-2 border-[#BDBAB3]',
      small ? 'h-3 w-3' : 'h-4 w-4',
    )}
  />
)

export const Dots = () => (
  <svg viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor" aria-hidden>
    {[2, 8, 14].map((y) => (
      <g key={y}>
        <circle cx="2" cy={y} r="1.5" />
        <circle cx="8" cy={y} r="1.5" />
      </g>
    ))}
  </svg>
)
