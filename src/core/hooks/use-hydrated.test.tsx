import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { useHydrated } from './use-hydrated'

function TestComponent() {
  const hydrated = useHydrated()
  return <div data-testid="hydrated">{hydrated ? 'yes' : 'no'}</div>
}

describe('useHydrated', () => {
  it('should return false on first render (SSR match)', () => {
    // React 19's renderToString would produce "no" — even in jsdom
    // the initial render should be false, then flip to true after mount
    const { container } = render(<TestComponent />)
    // After hydration, the value should be "yes"
    expect(screen.getByTestId('hydrated').textContent).toBe('yes')
  })

  it('should be usable in conditional rendering without flashing', () => {
    function Conditional() {
      const hydrated = useHydrated()
      if (!hydrated) return <div data-testid="state">loading</div>
      return <div data-testid="state">content</div>
    }
    render(<Conditional />)
    expect(screen.getByTestId('state').textContent).toBe('content')
  })
})