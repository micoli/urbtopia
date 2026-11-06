import { describe, expect, it } from 'vitest'
import { gzip, toBase64 } from '../../../../src/bugReports/cityAttachment'
import { canReply, cityEnvelopeText, filterReports, hasCity, type ReportSummary } from './bugReports'

const report = (id: number, status: ReportSummary['status']): ReportSummary => ({ id, authorId: 'u', description: `bug ${id}`, status, createdAt: '2026-11-06T10:00:00Z', adminUnread: false })
const reports = [report(1, 'new'), report(2, 'seen'), report(3, 'resolved')]

describe('filterReports', () => {
  it('keeps the unresolved ones as the default', () => {
    expect(filterReports(reports, 'open').map(item => item.id)).toEqual([1, 2])
  })

  it('filters by one status or keeps all', () => {
    expect(filterReports(reports, 'resolved').map(item => item.id)).toEqual([3])
    expect(filterReports(reports, 'all')).toHaveLength(3)
  })
})

describe('cityEnvelopeText', () => {
  it('writes an inline City back as JSON text', async () => {
    expect(await cityEnvelopeText({ screenshot: null, cityJson: { a: 1 }, cityGzip: null })).toBe('{"a":1}')
  })

  it('unzips a compressed City', async () => {
    const text = JSON.stringify({ big: 'x'.repeat(5000) })
    const cityGzip = toBase64(await gzip(new TextEncoder().encode(text)))
    expect(await cityEnvelopeText({ screenshot: null, cityJson: null, cityGzip })).toBe(text)
  })

  it('has nothing to open without a City', async () => {
    const none = { screenshot: 'data:x', cityJson: null, cityGzip: null }
    expect(hasCity(none)).toBe(false)
    expect(await cityEnvelopeText(none)).toBeNull()
  })
})

describe('canReply', () => {
  it('closes with the resolution', () => {
    expect(canReply('new')).toBe(true)
    expect(canReply('resolved')).toBe(false)
  })
})
