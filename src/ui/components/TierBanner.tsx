// ui/components/TierBanner.tsx — the full-screen beat when honor enters a tier (HONOR §2): the tier word and one line; a tap, Continue or 3 s dismisses it
import { useEffect } from 'react'
import { BANNER_MS, type Banner } from '../tiers'
import { S } from '../strings'
export function TierBanner({ banner, onDismiss }: { banner: Banner; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, BANNER_MS)
    return () => clearTimeout(t)
  }, [banner, onDismiss])
  return (
    <div className={`tier-banner tier-${banner.tier}`} role="alertdialog" aria-modal="true" aria-label={S.tier[banner.tier]} onClick={onDismiss}>
      <p className="tier-name">{S.tier[banner.tier]}</p>
      <p className="tier-line">{banner.text}</p>
      <button type="button" className="btn" autoFocus onClick={onDismiss}>{S.banner.dismiss}</button>
    </div>
  )
}
