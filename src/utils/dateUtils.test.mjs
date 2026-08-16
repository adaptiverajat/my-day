import test from 'node:test'
import assert from 'node:assert/strict'
import { getCurrentRange } from './dateUtils.js'

test('getCurrentRange returns seven days centered on today', () => {
  const today = new Date('2026-08-15T12:00:00')
  const range = getCurrentRange(today)

  assert.equal(range.startDate, '2026-08-12')
  assert.equal(range.endDate, '2026-08-18')
  assert.equal(range.days.length, 7)
  assert.equal(range.days[3].toISOString().split('T')[0], '2026-08-15')
})
