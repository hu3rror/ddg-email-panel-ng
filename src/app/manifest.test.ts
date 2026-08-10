import { describe, it, expect } from 'vitest'
import manifest from './manifest'

describe('PWA Web Manifest', () => {
  it('应当生成符合 W3C 标准的 Web App Manifest 配置', () => {
    const config = manifest()
    expect(config.name).toBe('DDG Email Panel')
    expect(config.display).toBe('standalone')
    expect(config.start_url).toBe('/')
    expect(config.theme_color).toBe('#0284c7')
  })
})