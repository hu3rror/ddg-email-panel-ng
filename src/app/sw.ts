/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // 基础 PWA Service Worker 离线网络处理
})

export {}