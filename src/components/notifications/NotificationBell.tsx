'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, X, Check } from 'lucide-react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface NotifType {
  key: string
  label: string
  emoji: string
  desc: string
}

const NOTIF_TYPES: NotifType[] = [
  { key: 'study_off_morning', emoji: '📹', label: 'Day Off 9:30 AM',  desc: '9:30 AM study session reminder for Day Off' },
  { key: 'study_morning',  emoji: '📚', label: 'Morning Study',    desc: 'Remind me to study in the morning'   },
  { key: 'study_reminder', emoji: '⏰', label: 'Study Check-in',   desc: 'Mid-day reminder to watch the video'  },
  { key: 'gym_reminder',   emoji: '🏋️', label: 'Gym Time',         desc: 'Remind me to hit the gym'             },
  { key: 'journal_reminder',emoji: '📓', label: 'Daily Journal',    desc: 'Evening reminder to write journal'    },
  { key: 'streak_cheer',   emoji: '🔥', label: 'Streak Reminder',  desc: 'Keep your streak alive!'              },
]

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function NotificationBell() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [open, setOpen]             = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [sending, setSending]       = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // Check current permission on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscription(sub)
    }).catch(() => {})
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const requestAndSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Push notifications not supported in this browser')
      return
    }

    setSubscribing(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)

      if (perm !== 'granted') {
        showToast('Permission denied. Enable notifications in browser settings.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      setSubscription(sub)

      // Save subscription to DB
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
          },
        }),
      })

      showToast('✅ Notifications enabled! You\'ll receive daily study reminders.')
    } catch (err) {
      console.error('Subscribe error:', err)
      showToast('Failed to enable notifications. Try again.')
    } finally {
      setSubscribing(false)
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return
    try {
      await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, { method: 'DELETE' })
      await subscription.unsubscribe()
      setSubscription(null)
      setPermission('default')
      showToast('Notifications disabled.')
    } catch (err) {
      console.error('Unsubscribe error:', err)
    }
  }

  const sendTestNotif = async (type: string) => {
    setSending(type)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.sent > 0) showToast(`✅ Notification sent!`)
      else showToast('No subscribers yet — enable notifications first.')
    } catch {
      showToast('Failed to send notification')
    } finally {
      setSending(null)
    }
  }

  const bellIcon = () => {
    if (permission === 'unsupported') return <BellOff size={18} className="text-[#9CA3AF]" />
    if (permission === 'granted' && subscription) return <BellRing size={18} className="text-[#EB4917]" />
    return <Bell size={18} className="text-[#6B7280]" />
  }

  return (
    <>
      {/* Bell button */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E8E8E8] hover:bg-[#F7F7F7] active:scale-95 transition-all relative"
          aria-label="Notifications"
        >
          {bellIcon()}
          {permission === 'granted' && subscription && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EB4917] rounded-full" />
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[90vw] bg-white rounded-2xl border border-[#E8E8E8] shadow-xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F7F7F7]">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[#EB4917]" />
                  <span className="text-sm font-semibold text-[#171717]">Study Reminders</span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-[#F7F7F7] rounded-lg">
                  <X size={14} className="text-[#9CA3AF]" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Permission status */}
                {permission === 'unsupported' && (
                  <div className="p-3 bg-[#F7F7F7] rounded-xl text-xs text-[#6B7280]">
                    Push notifications not supported in this browser.
                  </div>
                )}

                {permission !== 'granted' && permission !== 'unsupported' && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6B7280]">
                      Enable push notifications to get daily study reminders — even when the app is closed.
                    </p>
                    <button
                      onClick={requestAndSubscribe}
                      disabled={subscribing}
                      className="w-full bg-[#EB4917] text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[.98] disabled:opacity-60"
                    >
                      {subscribing ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Enabling…
                        </span>
                      ) : (
                        <>🔔 Enable Notifications</>
                      )}
                    </button>
                    {permission === 'denied' && (
                      <p className="text-xs text-red-500 text-center">
                        Blocked. Go to browser settings → Site Settings → Allow notifications.
                      </p>
                    )}
                  </div>
                )}

                {permission === 'granted' && subscription && (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                      <Check size={14} className="text-green-600 shrink-0" />
                      <p className="text-xs text-green-700 font-medium">Notifications enabled on this device</p>
                    </div>

                    {/* Send test notifications */}
                    <div>
                      <p className="text-xs font-semibold text-[#171717] mb-2">Send a reminder now:</p>
                      <div className="space-y-1.5">
                        {NOTIF_TYPES.map(n => (
                          <button
                            key={n.key}
                            onClick={() => sendTestNotif(n.key)}
                            disabled={!!sending}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F7F7F7] active:bg-[#F7F7F7] disabled:opacity-50 text-left transition-colors"
                          >
                            <span className="text-base w-6 text-center shrink-0">{n.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#171717] truncate">{n.label}</p>
                              <p className="text-[11px] text-[#9CA3AF] truncate">{n.desc}</p>
                            </div>
                            {sending === n.key && (
                              <span className="w-3.5 h-3.5 border-2 border-[#EB4917]/30 border-t-[#EB4917] rounded-full animate-spin shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Unsubscribe */}
                    <button
                      onClick={unsubscribe}
                      className="w-full text-xs text-[#9CA3AF] hover:text-red-500 py-1.5 transition-colors"
                    >
                      Disable notifications on this device
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-[#171717] text-white text-sm rounded-full shadow-lg whitespace-nowrap max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </>
  )
}
