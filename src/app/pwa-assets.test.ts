import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import path from 'node:path'
import manifest from './manifest'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

describe('PWA installability assets', () => {
  it('manifest 引用的所有图标文件必须存在于 public/ 目录', () => {
    const config = manifest()
    expect(config.icons).toBeDefined()
    for (const icon of config.icons!) {
      const filePath = path.join(PUBLIC_DIR, icon.src.replace(/^\//, ''))
      expect(existsSync(filePath), `图标文件缺失: ${icon.src}`).toBe(true)
    }
  })

  it('favicon 文件必须存在于 public/ 目录', () => {
    const files = ['favicon.svg', 'favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png']
    for (const file of files) {
      expect(existsSync(path.join(PUBLIC_DIR, file)), `图标文件缺失: ${file}`).toBe(true)
    }
  })

  it('manifest 必须同时包含 192x192 和 512x512 图标（Chrome 安装性检查要求）', () => {
    const sizes = manifest().icons!.map((i) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('service worker 文件必须存在于 public/sw.js', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'sw.js'))).toBe(true)
  })
})