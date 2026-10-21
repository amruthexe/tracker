'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Video, Calendar, Dumbbell,
  BookMarked, BarChart3, Settings, Menu, X, Zap, ChevronRight
} from 'lucide-react'

import NotificationScheduler from '@/components/notifications/NotificationScheduler'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/study-plan',  label: 'Study',        icon: BookOpen },
  { href: '/videos',      label: 'Videos',       icon: Video },
  { href: '/timetable',   label: 'Timetable',    icon: Calendar },
  { href: '/fitness',     label: 'Fitness',      icon: Dumbbell },
  { href: '/journal',     label: 'Journal',      icon: BookMarked },
  { href: '/analytics',   label: 'Analytics',    icon: BarChart3 },
  { href: '/settings',    label: 'Settings',     icon: Settings },
]

// Bottom tabs: show 5 most important on mobile
const BOTTOM_TABS = [
  { href: '/dashboard',  label: 'Home',    icon: LayoutDashboard },
  { href: '/videos',     label: 'Videos',  icon: Video },
  { href: '/study-plan', label: 'Study',   icon: BookOpen },
  { href: '/fitness',    label: 'Gym',     icon: Dumbbell },
  { href: '/journal',    label: 'Journal', icon: BookMarked },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]" style={{ fontFamily: 'var(--font-poppins)' }}>
      <NotificationScheduler />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E8E8E8] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E8E8E8]">
          <div className="w-9 h-9 rounded-xl bg-[#EB4917] flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#171717] leading-tight">RN Life Tracker</p>
            <p className="text-xs text-[#9CA3AF] leading-tight">30-Day Challenge</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-[#FFF0EB] text-[#EB4917]'
                    : 'text-[#6B7280] hover:bg-[#F7F7F7] hover:text-[#171717]'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[#E8E8E8]">
          <p className="text-xs text-[#9CA3AF] text-center font-medium">22 Oct – 20 Nov 2026</p>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ───────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E8E8E8] safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EB4917] flex items-center justify-center shrink-0">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#171717] tracking-tight">RN Life Tracker</span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F7F7F7] text-[#6B7280] active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ── MOBILE FULL-SCREEN DRAWER ───────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-white shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EB4917] flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#171717]">RN Life Tracker</p>
                  <p className="text-xs text-[#9CA3AF]">30-Day Challenge</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F7F7] text-[#6B7280]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Nav */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#FFF0EB] text-[#EB4917]'
                        : 'text-[#6B7280] active:bg-[#F7F7F7]'
                    }`}
                  >
                    <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="flex-1">{label}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-[#EB4917]" />}
                  </Link>
                )
              })}
            </nav>

            <div className="px-5 py-4 border-t border-[#E8E8E8]">
              <p className="text-xs text-[#9CA3AF]">22 Oct – 20 Nov 2026</p>
            </div>
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top padding for mobile header */}
        <div className="pt-[53px] lg:pt-0 flex-1">
          <div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
            {children}
          </div>
        </div>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E8E8] safe-bottom">
        <div className="flex items-stretch h-16">
          {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                  active ? 'text-[#EB4917]' : 'text-[#9CA3AF]'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-[#FFF0EB]' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
