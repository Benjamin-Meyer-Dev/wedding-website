const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined'

const reducedQuery = canUseDOM ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
const compactTouchQuery = canUseDOM
  ? window.matchMedia('(max-width: 900px) and (pointer: coarse)')
  : null
const slowUpdateQuery = canUseDOM ? window.matchMedia('(update: slow)') : null

function hardwareNeedsHelp() {
  if (!canUseDOM) return false
  const memory = Number(navigator.deviceMemory)
  const cores = Number(navigator.hardwareConcurrency)
  return (Number.isFinite(memory) && memory <= 4)
    || (Number.isFinite(cores) && cores <= 4)
    || navigator.connection?.saveData === true
}

export function isLiteMotion() {
  if (!canUseDOM) return false
  return document.documentElement.dataset.motion === 'lite'
    || reducedQuery?.matches
    || compactTouchQuery?.matches
    || slowUpdateQuery?.matches
    || hardwareNeedsHelp()
}

// Pick the motion budget before React paints. CSS owns the visual differences;
// JavaScript reads the same flag to avoid background work and auto-rotation.
export function installMotionProfile() {
  if (!canUseDOM) return () => {}

  const update = () => {
    const lite = reducedQuery.matches
      || compactTouchQuery.matches
      || slowUpdateQuery.matches
      || hardwareNeedsHelp()
    document.documentElement.dataset.motion = lite ? 'lite' : 'full'
  }

  const queries = [reducedQuery, compactTouchQuery, slowUpdateQuery]
  update()
  for (const query of queries) query.addEventListener?.('change', update)
  navigator.connection?.addEventListener?.('change', update)

  return () => {
    for (const query of queries) query.removeEventListener?.('change', update)
    navigator.connection?.removeEventListener?.('change', update)
  }
}
