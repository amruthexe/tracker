import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { connectDB } from '@/lib/mongodb'
import { PushSubscriptionModel } from '@/models/PushSubscription'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@rntracker.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string; url: string }> = {
  study_morning: {
    title: '📚 Time to Study!',
    body: "Good morning! Your React Native video is waiting. Let's hit that 4-hour goal today! 🚀",
    url: '/videos',
  },
  study_off_morning: {
    title: '📹 Study Session 1 (9:00 – 11:30 AM)',
    body: "Day Off Study Reminder: Time to watch today's React Native video or revise concepts! 🚀",
    url: '/videos',
  },
  study_reminder: {
    title: '⏰ Study Check-in',
    body: "Have you watched today's video? Don't break your streak! 🔥",
    url: '/study-plan',
  },
  gym_reminder: {
    title: '🏋️ Gym Time!',
    body: 'Your 90-minute gym session is scheduled. Stay consistent! 💪',
    url: '/fitness',
  },
  journal_reminder: {
    title: '📓 Daily Journal',
    body: "Don't forget to write your daily feedback before bed! Reflect on what you learned today.",
    url: '/journal',
  },
  streak_cheer: {
    title: '🔥 Keep Your Streak!',
    body: "You're on a roll! Complete today's tasks to maintain your streak. You got this! ⚡",
    url: '/dashboard',
  },
  shift_prep: {
    title: '🎒 Shift Starting Soon',
    body: "Your work shift starts in 30 minutes. Wrap up study and get ready! 🏢",
    url: '/timetable',
  },
}

// Send a push notification to all subscribed devices
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { type = 'study_morning', title, message, url } = body

    const template = NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.study_morning
    const payload = JSON.stringify({
      title: title || template.title,
      body: message || template.body,
      icon: '/icons/icon-192.svg',
      url: url || template.url,
    })

    const subscriptions = await PushSubscriptionModel.find({})

    if (subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscribers found' })
    }

    let sent = 0
    let failed = 0
    const expiredEndpoints: string[] = []

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          )
          sent++
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'statusCode' in err) {
            const statusCode = (err as { statusCode: number }).statusCode
            if (statusCode === 410 || statusCode === 404) {
              // Subscription expired — clean up
              expiredEndpoints.push(sub.endpoint)
            }
          }
          failed++
        }
      })
    )

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await PushSubscriptionModel.deleteMany({ endpoint: { $in: expiredEndpoints } })
    }

    return NextResponse.json({ sent, failed, expired: expiredEndpoints.length })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}

// Get all available notification types
export async function GET() {
  return NextResponse.json({ types: Object.keys(NOTIFICATION_TEMPLATES), templates: NOTIFICATION_TEMPLATES })
}
