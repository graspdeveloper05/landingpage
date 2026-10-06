/**
 * What fills the page either side of the form: the eight-point star lattice
 * of Muzium Negara's carved screens (the same line-work that frames the
 * home page's Pillars band), in faint gold, with a soft warm light on each
 * side. A mask clears the middle, so it frames the form's column and never
 * sits behind a line anybody has to read. Hidden on a phone, where the
 * column is the whole width.
 */
export function FormBackdrop() {
  const edges =
    'linear-gradient(to right, #000 0%, #000 12%, transparent 30%, transparent 70%, #000 88%, #000 100%)'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
      {/* Warm light, low on the left and high on the right. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(40rem 32rem at 0% 70%, rgba(201,162,39,0.10), transparent 70%), radial-gradient(36rem 28rem at 100% 25%, rgba(201,162,39,0.09), transparent 70%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full text-gold-600"
        style={{ maskImage: edges, WebkitMaskImage: edges }}
      >
        <defs>
          <pattern id="form-lattice" width="84" height="84" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.22">
              {/* an eight-point star: two squares, one turned 45 degrees */}
              <rect x="24" y="24" width="36" height="36" />
              <rect x="24" y="24" width="36" height="36" transform="rotate(45 42 42)" />
              <circle cx="42" cy="42" r="7" />
              {/* the lattice joining one star to the next */}
              <path d="M0 42h16.5M67.5 42H84M42 0v16.5M42 67.5V84" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#form-lattice)" />
      </svg>
    </div>
  )
}
