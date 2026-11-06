import { describe, expect, it } from 'vitest'
import type { ReportSummary } from './bugReports'
import { badgeLabel, badgedTitle, countUnread } from './unreadBadge'

const report = (id: number, adminUnread: boolean): ReportSummary => ({ id, authorId: 'a', description: '', status: 'new', createdAt: '', adminUnread })

describe('unread badge', () => {
  it('counts the reports with an unread message', () => {
    expect(countUnread([report(1, true), report(2, false), report(3, true)])).toBe(2)
  })

  it('prefixes the title only when something is unread', () => {
    expect(badgedTitle('Back office', 0)).toBe('Back office')
    expect(badgedTitle('Back office', 3)).toBe('(3) Back office')
  })

  it('caps the label', () => {
    expect(badgeLabel(7)).toBe('7')
    expect(badgeLabel(120)).toBe('99+')
  })
})
