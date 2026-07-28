'use client'
import { useEffect } from 'react'

const FLASH_CLASS = 'btn-flash-press'
const FLASH_MS = 900

/** Site-wide "you clicked me" feedback: any button briefly lights up on press and fades back to
 *  normal on its own, instead of just sitting there looking unresponsive. One listener, mounted
 *  once in the root layout, covers every button on every page without touching each one.
 *
 *  Uses mousedown/touchstart in the CAPTURE phase, not click in the bubble phase — capture fires
 *  top-down before the event ever reaches the button, so this always runs before whatever onClick
 *  handler the button has (which may synchronously trigger a state update / re-render). Listening
 *  on click instead was racing against React's own event handling and would occasionally lose. */
export default function ButtonFlash() {
  useEffect(() => {
    function onPress(e: Event) {
      const target = (e.target as HTMLElement)?.closest('button')
      if (!target || target.disabled) return
      target.classList.remove(FLASH_CLASS)
      // Force reflow so re-adding the class restarts the animation on rapid repeat clicks.
      void target.offsetWidth
      target.classList.add(FLASH_CLASS)
      setTimeout(() => target.classList.remove(FLASH_CLASS), FLASH_MS)
    }
    document.addEventListener('mousedown', onPress, true)
    document.addEventListener('touchstart', onPress, true)
    return () => {
      document.removeEventListener('mousedown', onPress, true)
      document.removeEventListener('touchstart', onPress, true)
    }
  }, [])

  return null
}
