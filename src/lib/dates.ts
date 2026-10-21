import { format, parseISO, differenceInDays, addDays, isAfter, isBefore, isEqual } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export const TIMEZONE = 'Asia/Kolkata'
export const START_DATE = '2026-10-22'
export const END_DATE = '2026-11-20'
export const TOTAL_DAYS = 30
export const TOTAL_VIDEOS = 22

/** Get current date in IST as ISO date string (YYYY-MM-DD) */
export function getTodayIST(): string {
  const now = new Date()
  const ist = toZonedTime(now, TIMEZONE)
  return format(ist, 'yyyy-MM-dd')
}

/** Format a date for display */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, d MMMM yyyy')
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM')
}

export function formatDateDisplay(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

/** Get all 30 days as ISO strings */
export function getTrackingDays(): string[] {
  const days: string[] = []
  const start = parseISO(START_DATE)
  for (let i = 0; i < TOTAL_DAYS; i++) {
    days.push(format(addDays(start, i), 'yyyy-MM-dd'))
  }
  return days
}

/** Get day number (1–30) for a given date */
export function getDayNumber(dateStr: string): number {
  const start = parseISO(START_DATE)
  const date = parseISO(dateStr)
  return differenceInDays(date, start) + 1
}

/** Check if date is today */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayIST()
}

/** Check if date is in the past */
export function isPast(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), parseISO(getTodayIST()))
}

/** Check if date is in the future */
export function isFuture(dateStr: string): boolean {
  return isAfter(parseISO(dateStr), parseISO(getTodayIST()))
}

/** Get shift for a given date from the initial rotation */
export function getDefaultShift(dateStr: string): 'S1' | 'S2' | 'S3' | 'OFF' {
  const date = parseISO(dateStr)
  const dateNum = parseInt(format(date, 'yyyyMMdd'))

  // S2: 24–28 Oct
  if (dateNum >= 20261024 && dateNum <= 20261028) return 'S2'
  // OFF: 29–30 Oct
  if (dateNum >= 20261029 && dateNum <= 20261030) return 'OFF'
  // S1: 31 Oct–4 Nov
  if (dateNum >= 20261031 && dateNum <= 20261104) return 'S1'
  // OFF: 5–6 Nov
  if (dateNum >= 20261105 && dateNum <= 20261106) return 'OFF'
  // S3: 7–11 Nov
  if (dateNum >= 20261107 && dateNum <= 20261111) return 'S3'
  // OFF: 12–13 Nov
  if (dateNum >= 20261112 && dateNum <= 20261113) return 'OFF'
  // S2: 14–18 Nov
  if (dateNum >= 20261114 && dateNum <= 20261118) return 'S2'
  // OFF: 19–20 Nov
  if (dateNum >= 20261119 && dateNum <= 20261120) return 'OFF'

  // Oct 22–23 are video days (before S2 starts at office)
  return 'S2'
}

export function getShiftColor(shift: string): string {
  switch (shift) {
    case 'S1': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'S2': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'S3': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'OFF': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function getShiftLabel(shift: string): string {
  switch (shift) {
    case 'S1': return 'Morning (6AM–2PM)'
    case 'S2': return 'Afternoon (2PM–10:30PM)'
    case 'S3': return 'Night (10PM–6:30AM)'
    case 'OFF': return 'Day Off'
    default: return shift
  }
}

/** Minutes to "Xh Ym" display */
export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Calculate study/gym streaks from sorted date arrays */
export function calculateStreaks(completedDates: string[]): { current: number; longest: number } {
  if (completedDates.length === 0) return { current: 0, longest: 0 }

  const sorted = [...completedDates].sort()
  const today = getTodayIST()
  let current = 0
  let longest = 0
  let streak = 1

  // Calculate longest streak
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1])
    const curr = parseISO(sorted[i])
    const diff = differenceInDays(curr, prev)
    if (diff === 1) {
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 1
    }
  }
  longest = Math.max(longest, streak)

  // Calculate current streak (backwards from today)
  const lastDate = sorted[sorted.length - 1]
  if (lastDate === today || differenceInDays(parseISO(today), parseISO(lastDate)) === 1) {
    current = 1
    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = parseISO(sorted[i + 1])
      const prev = parseISO(sorted[i])
      if (differenceInDays(curr, prev) === 1) {
        current++
      } else {
        break
      }
    }
  }

  return { current, longest }
}

/** Get video number for a date (1–22 for video days, null for project/off days) */
export function getVideoForDate(dateStr: string): number | null {
  const videoSchedule: Record<string, number> = {
    '2026-10-22': 1, '2026-10-23': 2, '2026-10-24': 3, '2026-10-25': 4,
    '2026-10-26': 5, '2026-10-27': 6, '2026-10-28': 7, '2026-10-29': 8,
    '2026-10-30': 9, '2026-10-31': 10, '2026-11-01': 11, '2026-11-02': 12,
    '2026-11-03': 13, '2026-11-04': 14, '2026-11-05': 15, '2026-11-06': 16,
    '2026-11-07': 17, '2026-11-08': 18, '2026-11-09': 19, '2026-11-10': 20,
    '2026-11-11': 21, '2026-11-12': 22,
  }
  return videoSchedule[dateStr] ?? null
}

export function getDayType(dateStr: string): 'video' | 'project' | 'off' {
  const videoNum = getVideoForDate(dateStr)
  if (videoNum !== null) return 'video'
  const d = parseISO(dateStr)
  const dateNum = parseInt(format(d, 'yyyyMMdd'))
  if (dateNum >= 20261113 && dateNum <= 20261120) return 'project'
  return 'off'
}
