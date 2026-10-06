/**
 * One face of a five-point smiley rating, from 1 (very poor) to 5
 * (excellent), drawn in line so it takes the colour around it. Used on the
 * attendee form and, small, in the admin's question builder.
 */
export function Smiley({ level, className }: { level: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="24" cy="24" r="20.5" className="sv-face-disc" />
      {FACES[level - 1] ?? FACES[2]}
    </svg>
  )
}

const eyes = (
  <>
    <circle cx="17.5" cy="20" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="30.5" cy="20" r="1.6" fill="currentColor" stroke="none" />
  </>
)

const FACES = [
  // 1: a deep frown under slanted brows.
  <g key={1}>
    <path d="M13.5 14.5l6 2.5M34.5 14.5l-6 2.5" />
    {eyes}
    <path d="M15.5 34.5q8.5-8 17 0" />
  </g>,
  // 2: a slight frown.
  <g key={2}>
    {eyes}
    <path d="M16.5 33q7.5-4.5 15 0" />
  </g>,
  // 3: level.
  <g key={3}>
    {eyes}
    <path d="M16.5 31h15" />
  </g>,
  // 4: a smile.
  <g key={4}>
    {eyes}
    <path d="M16 28.5q8 7 16 0" />
  </g>,
  // 5: closed happy eyes and a wide open smile.
  <g key={5}>
    <path d="M14.5 20.5q3-3.5 6 0M27.5 20.5q3-3.5 6 0" />
    <path d="M14.5 27h19q-1.5 9.5-9.5 9.5t-9.5-9.5z" fill="currentColor" fillOpacity="0.18" />
  </g>,
]
