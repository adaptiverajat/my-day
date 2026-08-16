import test from 'node:test'
import assert from 'node:assert/strict'
import { getCurrentRange, formatDateInputValue, parseDateInputValue, isRecurrenceEndDateValid } from './dateUtils.js'

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

test('parseDateInputValue preserves a date-only value without drifting', () => {
  const date = parseDateInputValue('2026-08-16')

  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 7)
  assert.equal(date.getDate(), 16)
  assert.equal(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'), '2026-08-16')
})

test('parseDateInputValue preserves the local day for ISO timestamps', () => {
  const date = parseDateInputValue('2026-08-11T18:30:00.000Z')
  const expected = formatDateInputValue(new Date('2026-08-11T18:30:00.000Z'))

  assert.equal(formatDateInputValue(date), expected)
})

test('isRecurrenceEndDateValid rejects today, past dates, and dates before the task date', () => {
  const today = formatDateInputValue(new Date())
  const past = formatDateInputValue(new Date(Date.now() - 86400000))
  const future = formatDateInputValue(new Date(Date.now() + 86400000))
  const taskDate = formatDateInputValue(new Date(Date.now() + 86400000 * 2))

  assert.equal(isRecurrenceEndDateValid(today), false)
  assert.equal(isRecurrenceEndDateValid(past), false)
  assert.equal(isRecurrenceEndDateValid(future), true)
  assert.equal(isRecurrenceEndDateValid(future, taskDate), false)
  assert.equal(isRecurrenceEndDateValid(taskDate, future), true)
})
