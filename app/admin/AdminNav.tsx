'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/admin/users', label: 'Users', icon: '👥' },
    ],
  },
  {
    label: 'Captions',
    items: [
      { href: '/admin/images', label: 'Images', icon: '🖼️' },
      { href: '/admin/captions', label: 'Captions', icon: '💬' },
      { href: '/admin/caption-requests', label: 'Caption Requests', icon: '📋' },
      { href: '/admin/caption-examples', label: 'Caption Examples', icon: '✨' },
    ],
  },
  {
    label: 'Humor System',
    items: [
      { href: '/admin/humor-flavors', label: 'Humor Flavors', icon: '🎨' },
      { href: '/admin/humor-flavor-steps', label: 'Flavor Steps', icon: '🔢' },
      { href: '/admin/humor-mix', label: 'Humor Mix', icon: '🎛️' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/admin/terms', label: 'Terms', icon: '📖' },
    ],
  },
  {
    label: 'AI / LLM',
    items: [
      { href: '/admin/llm-providers', label: 'LLM Providers', icon: '🏢' },
      { href: '/admin/llm-models', label: 'LLM Models', icon: '🤖' },
      { href: '/admin/llm-prompt-chains', label: 'Prompt Chains', icon: '⛓️' },
      { href: '/admin/llm-responses', label: 'LLM Responses', icon: '💡' },
    ],
  },
  {
    label: 'Access Control',
    items: [
      { href: '/admin/allowed-domains', label: 'Allowed Domains', icon: '🌐' },
      { href: '/admin/whitelisted-emails', label: 'Whitelisted Emails', icon: '📧' },
    ],
  },
]


interface AdminNavProps {
  userEmail: string
  displayName: string
}

export default function AdminNav({ userEmail, displayName }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 shrink-0 flex flex-col border-r py-6 px-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
        >
          ⚡
        </div>
        <span className="font-bold text-white text-sm">Humor Admin</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
            {/* Group heading */}
            <div
              className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)', opacity: 0.55, letterSpacing: '0.1em' }}
            >
              {group.label}
            </div>
            {/* Divider */}
            <div
              className="mx-3 mb-2"
              style={{ height: '1px', background: 'var(--border)', opacity: 0.6 }}
            />
            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                      color: active ? '#8b5cf6' : 'var(--text-muted)',
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}