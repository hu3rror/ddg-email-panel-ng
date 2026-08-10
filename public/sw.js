// DDG Email Panel — Service Worker
//
// 设计原则：只拦截顶层导航请求（用户点击链接/刷新页面时的 HTML 文档请求），
// 其余所有请求（API 调用、静态资源 JS/CSS/图片）直接放行，完全不经过 SW。
// 这样 SW 对非 PWA 功能的影响面最小：即使 SW 出错，也不会拖垮 API 和资源加载。

const CACHE_NAME = 'ddg-email-panel-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // 只处理导航请求（HTML 文档），其余请求直接放行，不进入 SW
  if (event.request.mode !== 'navigate') {
    return
  }

  // 网络优先：先尝试网络，成功则更新缓存；离线时回退到缓存
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const networkResponse = await fetch(event.request)
        // 只缓存成功响应，避免把 404/错误页缓存下来
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone())
        }
        return networkResponse
      } catch (err) {
        const cachedResponse = await cache.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        throw err
      }
    })(),
  )
})