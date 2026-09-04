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
 * Decide, for every column, whether it sorts numerically or alphabetically:
 * a column is numeric only when every non-blank value in it parses as a number.
 *
 * Always derive this from the FULL dataset, never from a filtered view -- a
 * type read off the visible rows would let the filter box silently change a
 * column's ordering.
 *
 * @returns {Record<string, 'numeric' | 'alpha'>}
 */
export function deriveSortTypes(records) {
  const types = {}
  for (const column of COLUMNS) {
    const values = records
      .map((record) => cellText(record?.[column.key]))
      .filter((text) => text !== '')
    types[column.key] = values.length > 0 && values.every(isNumericText) ? 'numeric' : 'alpha'
  }
  return types
}

/**
 * Build a comparator for one column.
 *
 * The numeric-vs-alphabetic decision comes from `sortTypes` (see
 * deriveSortTypes) rather than from the rows being sorted, so sorting a
 * filtered subset orders it exactly as the full table would.
 *
 * Alphabetic comparison is case-insensitive and uses numeric collation, so
 * digit runs inside an otherwise non-numeric column sort naturally
 * (Grade Level: 2, 3, ... 12, K -- not 10, 11, 12, 2, 3). Dates in yyyy-mm-dd
 * still fall into the alphabetical branch, where string order is already
 * chronological order.
 *
 * Blank values always sort to the bottom, in both directions.
 */
export function makeComparator(sortTypes, key, direction) {
  const numeric = sortTypes?.[key] === 'numeric'
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
      : left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true })

    return result * sign
  }
}
