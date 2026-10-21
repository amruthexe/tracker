'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Video, Calendar, Dumbbell,
  BookMarked, BarChart3, Settings, Menu, X, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/videos', label: 'Course Videos', icon: Video },
  { href: '/timetable', label: 'Daily Timetable', icon: Calendar },
  { href: '/fitness', label: 'Fitness', icon: Dumbbell },
  { href: '/journal', label: 'Daily Journal', icon: BookMarked },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]" style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E8E8E8] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E8E8]">
          <div className="w-9 h-9 rounded-xl bg-[#EB4917] flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-700 text-[#171717] leading-tight">RN Life</p>
            <p className="text-xs text-[#9CA3AF] leading-tight">Tracker</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#FFF0EB] text-[#EB4917]'
                    : 'text-[#6B7280] hover:bg-[#F7F7F7] hover:text-[#171717]'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Info */}
        <div className="px-4 py-4 border-t border-[#E8E8E8]">
          <p className="text-xs text-[#9CA3AF] text-center">30-Day RN Challenge</p>
          <p className="text-xs text-[#9CA3AF] text-center">22 Oct – 20 Nov 2026</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E8E8E8]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EB4917] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[#171717]">RN Life Tracker</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-[#F7F7F7] text-[#6B7280]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EB4917] flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold">RN Life Tracker</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-[#6B7280]">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      active
                        ? 'bg-[#FFF0EB] text-[#EB4917]'
                        : 'text-[#6B7280] hover:bg-[#F7F7F7] hover:text-[#171717]'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-[57px] lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
