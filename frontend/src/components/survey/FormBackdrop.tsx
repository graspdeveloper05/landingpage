import { Picture } from '@/components/ui/Picture'

/**
 * What fills the page behind the form: the banner's colonnade again, blurred
 * soft and washed in cream, so the banner and the page read as one scene and
 * the white cards float on it (the frosted look of Microsoft Forms' photo
 * themes). It stays put while the form scrolls: fixed to the window, inside
 * a layer the size of the form's section whose clip-path keeps it there.
 * (A clip on the section itself would also cut off the first card where it
 * rises over the banner.)
 */
export function FormBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [clip-path:inset(0)]">
      <div className="fixed inset-0">
        <Picture
          base="/scenes/colonnade"
          alt=""
          width={768}
          height={469}
          className="absolute inset-0 block"
          imgClassName="h-full w-full scale-110 object-cover blur-2xl saturate-[0.85]"
        />
        {/* Cream over the photograph: enough to keep the page light and the
          cards clear, little enough that the columns and the warm light
          still come through. */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream/70 via-cream/60 to-cream/80" />
      </div>
    </div>
  )
}
