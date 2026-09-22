type P = { className?: string }
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const CalendarIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)
export const ClockIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
  </svg>
)
export const PinIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
  </svg>
)
export const HistoryIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <path d="M4 20V9l8-5 8 5v11z" /><path d="M9 20v-6h6v6M4 20h16" />
  </svg>
)
export const PeopleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.6A3.2 3.2 0 0 1 16 14M17 19c0-2.2-.8-3.9-2-5" />
  </svg>
)
export const FutureIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <path d="M12 3l2.4 5.4 5.6.5-4.3 3.9 1.3 5.7L12 15.6 6.9 18.5l1.3-5.7L4 8.9l5.6-.5z" />
  </svg>
)
/*
 * The three conversations, drawn after the client's design: a junk under sail
 * for the histories that arrived by sea, a domed civic building for the
 * nation as it stands, and a sun rising over worked fields for what comes
 * next. Drawn on a 64 grid, finer than the 24-grid UI icons, because these
 * are illustrations shown at 44px inside a medallion rather than glyphs.
 */
const F = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const ShipIcon = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden {...F}>
    {/* masts and pennant */}
    <path d="M27 9v34M41 16v27M27 9l5 2-5 2" />
    {/* battened junk sails */}
    <path d="M27 11c-6 5-10 14-11 30h11" />
    <path d="M20 19h7M18 25h9M17 31h10M16.4 37h10.6" />
    <path d="M41 17c5 4 8 12 9 24H41" />
    <path d="M41 23h5M41 29h7.4M41 35h8.6" />
    {/* hull, raised stern */}
    <path d="M9 43h45l-3 7c-.5 1.2-1.6 2-2.9 2H17c-1.6 0-3-.9-3.6-2.3z" />
    <path d="M9 43l-2-4M54 43l3-6" />
    {/* water */}
    <path d="M6 57c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0 6-2 9 0 6 2 9 0" />
  </svg>
)

export const CapitolIcon = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden {...F}>
    {/* finial and lantern */}
    <path d="M32 5v4M29.5 9h5v4h-5z" />
    {/* dome with ribs */}
    <path d="M19 25a13 13 0 0 1 26 0" />
    <path d="M32 13v12M25.5 15.5c-2 3-2.8 6-2.8 9.5M38.5 15.5c2 3 2.8 6 2.8 9.5" />
    {/* drum */}
    <path d="M17 25h30M18 25v4h28v-4" />
    <path d="M22 26.5v1.5M27 26.5v1.5M32 26.5v1.5M37 26.5v1.5M42 26.5v1.5" />
    {/* entablature */}
    <path d="M13 29h38M14 32h36" />
    {/* colonnade */}
    <path d="M18 32v14M23.5 32v14M29 32v14M35 32v14M40.5 32v14M46 32v14" />
    {/* stylobate and steps */}
    <path d="M12 46h40M10 50h44M8 54h48" />
  </svg>
)

export const SunriseIcon = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden {...F}>
    {/* sun on the horizon */}
    <path d="M21 33a11 11 0 0 1 22 0" />
    {/* rays */}
    <path d="M32 9v7M20 14l3.5 5.5M44 14l-3.5 5.5M11.5 22.5l6 3.5M52.5 22.5l-6 3.5M8 33h6M50 33h6" />
    <path d="M6 33h52" />
    {/* worked fields running to the horizon */}
    <path d="M6 39c9-4 20-5 28-3s16 2 24-1" />
    <path d="M6 46c10-5 22-6 30-3s15 2 22-1" />
    <path d="M6 54c11-6 24-7 32-3s14 2 20-1" />
    <path d="M24 37c-3 5-5 11-6 19M40 37c2 6 4 12 5 18M32 36v20" />
  </svg>
)

export const ShareIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" />
    <path d="M8.4 10.8l7.2-4.2M8.4 13.2l7.2 4.2" />
  </svg>
)
export const MobileIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.6h2" />
  </svg>
)
export const FormIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" />
  </svg>
)
export const GlobeIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9S14.6 18.3 12 21c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" />
  </svg>
)
export const GrowthIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <path d="M4 19h16M7 19v-6M12 19V7M17 19v-9" />
  </svg>
)
export const ChevronDown = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const ExternalIcon = ({ className }: P) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="none">
    <path d="M1.5 10.5L10.5 1.5M10.5 1.5H4.8M10.5 1.5v5.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)
export const QuoteMark = ({ className }: P) => (
  <svg viewBox="0 0 40 30" className={className} aria-hidden fill="currentColor">
    <path d="M0 30V16C0 7.2 5.6 1.4 15 0l1.6 4.6C11 6 8.2 9 8.2 13H16v17zm24 0V16C24 7.2 29.6 1.4 39 0l1.6 4.6C35 6 32.2 9 32.2 13H40v17z" />
  </svg>
)

/* -- Social networks. Solid marks, so they read at 16px. ------------------- */
export const LinkedInIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.24 8.25h4.5V24H.24zM8.34 8.25h4.31v2.15h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V24h-4.5v-7.15c0-1.7-.03-3.9-2.38-3.9-2.38 0-2.74 1.86-2.74 3.78V24h-4.5z" />
  </svg>
)
export const FacebookIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
)
export const YouTubeIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12z" />
  </svg>
)
export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.89 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
  </svg>
)
