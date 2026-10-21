// =====================================================
// RN Life Tracker — Service Worker
// Handles: push notifications, offline caching
// =====================================================

const CACHE_NAME = 'rn-tracker-v1'
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// ── Install ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch (network-first, fallback cache) ────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return // never cache API

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// ── Push Notification Received ────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'RN Life Tracker', body: 'Time to study! 📚', icon: '/icons/icon-192.png', url: '/dashboard' }

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' },
      actions: [
        { action: 'open', title: '📚 Open App' },
        { action: 'dismiss', title: 'Later' },
      ],
      requireInteraction: false,
      tag: 'rn-tracker-reminder',
    })
  )
})

// ── Notification Click ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  if (event.action === 'dismiss') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
