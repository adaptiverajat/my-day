import test from 'node:test'
import assert from 'node:assert/strict'
import { getCurrentRange, formatDateInputValue, parseDateInputValue } from './dateUtils.js'

test('getCurrentRange returns seven days centered on today', () => {
  const today = new Date('2026-08-15T12:00:00')
  const range = getCurrentRange(today)

  assert.equal(range.startDate, '2026-08-12')
  assert.equal(range.endDate, '2026-08-18')
  assert.equal(range.days.length, 7)
  assert.equal(range.days[3].toISOString().split('T')[0], '2026-08-15')
})

test('formatDateInputValue keeps the calendar date in local time', () => {
  const date = new Date('2026-08-16T00:00:00-04:00')

  assert.equal(formatDateInputValue(date), '2026-08-16')
})

test('parseDateInputValue preserves the selected calendar date', () => {
  const date = parseDateInputValue('2026-08-16')

  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 7)
  assert.equal(date.getDate(), 16)
  assert.equal(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'), '2026-08-16')
})
