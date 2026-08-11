'use client'

import { createStore, Provider } from 'jotai'
import { useRef } from 'react'

/**
 * 创建一个共享的 Jotai store 实例，用于 Provider 包裹。
 * 保证所有 useAtom 操作使用同一个 store，避免 Next.js App Router 中
 * layout 和 page 跨 chunk 加载多个 Jotai 实例触发 "Detected multiple Jotai instances" 警告。
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createStore()
  }
  return <Provider store={storeRef.current}>{children}</Provider>
}