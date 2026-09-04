// Column definitions and the shared filter/sort helpers for the student table.

export const COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'gradeLevel', label: 'Grade Level' },
  { key: 'enrollDate', label: 'Enroll Date' },
  { key: 'elLevel', label: 'EL Level' },
  { key: 'district', label: 'District' },
]

/** Normalize any cell value to a trimmed string. null/undefined become ''. */
export function cellText(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function isNumericText(text) {
  return text !== '' && Number.isFinite(Number(text))
}

/**
 * Case-insensitive substring match against every field of the record,
 * not just the seven displayed columns.
 */
export function matchesQuery(row, query) {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return Object.values(row ?? {}).some((value) =>
    cellText(value).toLowerCase().includes(needle),
  )
}

/**
 * Build a comparator for one column.
 *
 * Type-aware: if every non-blank value in that column parses as a number, the
 * column is compared numerically; otherwise it is compared alphabetically and
 * case-insensitively. Dates in yyyy-mm-dd fall into the alphabetical branch,
 * where plain string order is already chronological order.
 *
 * Blank values always sort to the bottom, in both directions.
 */
export function makeComparator(rows, key, direction) {
  const values = rows.map((row) => cellText(row?.[key])).filter((text) => text !== '')
  const numeric = values.length > 0 && values.every(isNumericText)
  const sign = direction === 'desc' ? -1 : 1

  return (a, b) => {
    const left = cellText(a?.[key])
    const right = cellText(b?.[key])

    // Blanks are pinned to the bottom regardless of sort direction.
    if (left === '' && right === '') return 0
    if (left === '') return 1
    if (right === '') return -1

    const result = numeric
      ? Number(left) - Number(right)
      : left.localeCompare(right, undefined, { sensitivity: 'base', numeric: false })

    return result * sign
  }
}
