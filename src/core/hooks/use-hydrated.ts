'use client'

import { useEffect, useState } from 'react'

/**
 * Returns `true` only after the component has mounted on the client.
 *
 * Jotai's `atomWithStorage` reads its value from localStorage during the
 * first client render, so during SSR/hydration the atom still holds its
 * default. Components that depend on stored atoms should gate their render
 * on this flag to avoid flashing an empty/redirect state before hydration.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}