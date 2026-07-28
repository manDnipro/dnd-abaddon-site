'use client'
import { useEffect } from 'react'

const FLASH_CLASS = 'btn-flash-press'
const FLASH_MS = 900

/** Site-wide "you clicked me" feedback: any button briefly lights up on click and fades back to
 *  normal on its own, instead of just sitting there looking unresponsive. One listener, mounted
 *  once in the root layout, covers every button on every page without touching each one. */
export default function ButtonFlash() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('button')
      if (!target || target.disabled) return
      target.classList.remove(FLASH_CLASS)
      // Force reflow so re-adding the class restarts the animation on rapid repeat clicks.
      void target.offsetWidth
      target.classList.add(FLASH_CLASS)
      setTimeout(() => target.classList.remove(FLASH_CLASS), FLASH_MS)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
