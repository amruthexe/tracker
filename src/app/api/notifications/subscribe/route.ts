import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { PushSubscriptionModel } from '@/models/PushSubscription'

// Save a push subscription (called when user grants permission)
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { endpoint, keys, userAgent } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, userAgent: userAgent || req.headers.get('user-agent') || '' },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}

// Remove a push subscription (called when user revokes permission)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint')
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    await PushSubscriptionModel.deleteOne({ endpoint })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }
}
