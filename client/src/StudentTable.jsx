import { useMemo, useState } from 'react'
import { COLUMNS, cellText, makeComparator } from './studentData.js'
import './StudentTable.css'

const SORT_GLYPH = { asc: '▲', desc: '▼' }

/**
 * @param {{ rows: { id: number, record: object }[], emptyMessage: string }} props
 */
function StudentTable({ rows, emptyMessage }) {
  const [sort, setSort] = useState({ key: null, direction: 'asc' })

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows
    const records = rows.map((row) => row.record)
    const compare = makeComparator(records, sort.key, sort.direction)
    // Array.prototype.sort is stable, so equal rows keep their original order.
    return [...rows].sort((a, b) => compare(a.record, b.record))
  }, [rows, sort])

  function toggleSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  return (
    <div className="table-scroll">
      <table className="student-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className={active ? 'sort-button is-active' : 'sort-button'}
                    onClick={() => toggleSort(column.key)}
                  >
                    <span>{column.label}</span>
                    <span className="sort-indicator" aria-hidden="true">
                      {active ? SORT_GLYPH[sort.direction] : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={COLUMNS.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedRows.map(({ id, record }) => (
              <tr key={id}>
                {COLUMNS.map((column) => {
                  const text = cellText(record?.[column.key])
                  return (
                    <td key={column.key} className={text === '' ? 'is-blank' : undefined}>
                      {text === '' ? '—' : text}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default StudentTable
