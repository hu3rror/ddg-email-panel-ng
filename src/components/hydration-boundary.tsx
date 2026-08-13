'use client'

import { type ReactNode } from 'react'
import { useHydrated } from '@/core/hooks/use-hydrated'

/**
 * 延迟渲染 children 直到客户端 hydration 完成。
 * hydration 完成前显示 fallback（通常是 skeleton）。
 *
 * 用法：
 * <HydrationBoundary fallback={<Skeleton />}>
 *   <RealContent />
 * </HydrationBoundary>
 */
export function HydrationBoundary({
  fallback,
  children,
}: {
  fallback: ReactNode
  children: ReactNode
}) {
  const hydrated = useHydrated()
  if (!hydrated) return fallback
  return children
}