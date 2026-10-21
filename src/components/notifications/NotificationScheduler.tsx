'use client'

import { useEffect, useRef } from 'react'
import { getTodayIST, getDefaultShift } from '@/lib/dates'

interface TimetableAlert {
  timeStr: string // "HH:MM" 24h format
  title: string
  body: string
  url: string
}

// Timetable notifications per shift code
const SHIFT_NOTIFICATIONS: Record<string, TimetableAlert[]> = {
  OFF: [
    {
      timeStr: '09:30',
      title: '📹 Study Session 1 (9:00 – 11:30 AM)',
      body: "Day Off Study Reminder: Time to watch today's React Native video and take notes! 🚀",
      url: '/videos',
    },
    {
      timeStr: '12:00',
      title: '💻 Coding Practice (12:00 – 1:30 PM)',
      body: 'Hands-on coding time: implement the concepts learned from the video! 💻',
      url: '/study-plan',
    },
    {
      timeStr: '14:30',
      title: '🏋️ Gym Session (2:30 – 4:00 PM)',
      body: 'Time for your 90-minute gym workout. Stay consistent! 💪',
      url: '/fitness',
    },
    {
      timeStr: '16:00',
      title: '📝 Notes & Revision (4:00 – 5:00 PM)',
      body: 'Review your notes, debug any issues, and reinforce learnings.',
      url: '/study-plan',
    },
    {
      timeStr: '21:00',
      title: '📓 Daily Journal & Review',
      body: 'Submit your daily reflection and log what you accomplished today.',
      url: '/journal',
    },
  ],
  S2: [
    {
      timeStr: '08:30',
      title: '📹 Watch Course Video (8:00 – 10:30 AM)',
      body: 'Morning study session before office! Watch today\'s video. 🚀',
      url: '/videos',
    },
    {
      timeStr: '10:45',
      title: '💻 Code Along & Revise (10:45 AM – 12:15 PM)',
      body: 'Time to practice coding and reinforce today\'s concepts.',
      url: '/study-plan',
    },
    {
      timeStr: '12:15',
      title: '🏋️ Gym Session (12:15 – 1:45 PM)',
      body: 'Hit the gym for your 90-minute workout before getting ready for office! 💪',
      url: '/fitness',
    },
    {
      timeStr: '13:30',
      title: '🎒 Shift Starting Soon (S2: 2:00 PM)',
      body: 'Wrap up and get ready for your office shift! 🏢',
      url: '/timetable',
    },
    {
      timeStr: '22:45',
      title: '📓 Daily Journal',
      body: 'Shift completed! Log your daily feedback before sleeping.',
      url: '/journal',
    },
  ],
  S1: [
    {
      timeStr: '15:30',
      title: '📹 Watch Course Video (3:30 – 6:00 PM)',
      body: 'Afternoon study session: Watch today\'s React Native masterclass video! 🚀',
      url: '/videos',
    },
    {
      timeStr: '18:15',
      title: '💻 Coding Practice (6:15 – 7:45 PM)',
      body: 'Implement today\'s code and build out the features.',
      url: '/study-plan',
    },
    {
      timeStr: '19:45',
      title: '🏋️ Gym Session (7:45 – 9:15 PM)',
      body: 'Time to workout! 90-minute session to stay disciplined. 💪',
      url: '/fitness',
    },
    {
      timeStr: '21:30',
      title: '📓 Daily Journal',
      body: 'Write your daily reflection and get early sleep for morning shift tomorrow.',
      url: '/journal',
    },
  ],
  S3: [
    {
      timeStr: '15:00',
      title: '📹 Watch Course Video (3:00 – 5:30 PM)',
      body: 'Wake up & study: Watch today\'s React Native masterclass video! 🚀',
      url: '/videos',
    },
    {
      timeStr: '17:45',
      title: '💻 Coding Practice (5:45 – 7:15 PM)',
      body: 'Time to code and test your mobile application implementations.',
      url: '/study-plan',
    },
    {
      timeStr: '19:15',
      title: '🏋️ Gym Session (7:15 – 8:45 PM)',
      body: 'Gym workout before your night shift! Stay energized. 💪',
      url: '/fitness',
    },
    {
      timeStr: '21:30',
      title: '🎒 Shift Starting Soon (S3: 10:00 PM)',
      body: 'Dinner & commute preparation for night shift. 🏢',
      url: '/timetable',
    },
  ],
}

export default function NotificationScheduler() {
  const lastCheckedMinute = useRef<string>('')

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    const checkAndDispatch = async () => {
      try {
        const today = getTodayIST()

        // Get current IST time (hours and minutes)
        const now = new Date()
        // Format to IST string HH:mm
        const istTimeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now)

        if (istTimeStr === lastCheckedMinute.current) return
        lastCheckedMinute.current = istTimeStr

        // Get today's shift (check localStorage cache or fetch)
        let currentShift = localStorage.getItem(`shift_${today}`)
        if (!currentShift) {
          try {
            const res = await fetch('/api/shifts')
            const shifts = await res.json()
            const match = shifts.find((s: { scheduleDate: string }) => s.scheduleDate === today)
            currentShift = match?.shiftCode ?? getDefaultShift(today)
            if (currentShift) localStorage.setItem(`shift_${today}`, currentShift)
          } catch {
            currentShift = getDefaultShift(today)
          }
        }

        const alerts = SHIFT_NOTIFICATIONS[currentShift || 'OFF'] ?? SHIFT_NOTIFICATIONS.OFF
        const matchingAlert = alerts.find(a => a.timeStr === istTimeStr)

        if (!matchingAlert) return

        // Prevent duplicate trigger for today + time slot
        const storageKey = `rn_notif_fired_${today}_${matchingAlert.timeStr}`
        if (localStorage.getItem(storageKey)) return
        localStorage.setItem(storageKey, 'true')

        // 1. Trigger Service Worker Notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready
            reg.showNotification(matchingAlert.title, {
              body: matchingAlert.body,
              icon: '/icons/icon-192.svg',
              badge: '/icons/icon-192.svg',
              tag: `timetable-${matchingAlert.timeStr}`,
              data: { url: matchingAlert.url },
            })
          } else {
            new Notification(matchingAlert.title, {
              body: matchingAlert.body,
              icon: '/icons/icon-192.svg',
            })
          }
        }

        // 2. Also trigger Push Notification to all devices via API
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: matchingAlert.title,
            message: matchingAlert.body,
            url: matchingAlert.url,
          }),
        }).catch(() => {})
      } catch (err) {
        console.error('NotificationScheduler check error:', err)
      }
    }

    // Run check immediately
    checkAndDispatch()

    // Interval every 20 seconds to catch exact minute
    const interval = setInterval(checkAndDispatch, 20000)
    return () => clearInterval(interval)
  }, [])

  return null
}
