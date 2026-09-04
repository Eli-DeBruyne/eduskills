import { useCallback, useEffect, useMemo, useState } from 'react'
import StudentTable from './StudentTable.jsx'
import { matchesQuery } from './studentData.js'

const API_URL = 'http://localhost:3001/api/students'

function App() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function loadStudents() {
      setStatus('loading')
      setErrorMessage('')
      try {
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`The server responded with ${response.status} ${response.statusText}`.trim())
        }
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Unexpected response: expected an array of student records.')
        }
        if (cancelled) return
        // Wrap each record so rows keep a stable React key while being re-sorted.
        setRows(data.map((record, index) => ({ id: index, record })))
        setStatus('ready')
      } catch (error) {
        if (cancelled || error.name === 'AbortError') return
        setRows([])
        setErrorMessage(
          error.message || 'Could not reach the student data service at localhost:3001.',
        )
        setStatus('error')
      }
    }

    loadStudents()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [reloadToken])

  const retry = useCallback(() => setReloadToken((token) => token + 1), [])

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesQuery(row.record, query)),
    [rows, query],
  )

  const total = rows.length
  const shown = filteredRows.length
  const countLabel = `${shown} of ${total} student${total === 1 ? '' : 's'}`

  const emptyMessage =
    total === 0
      ? 'No student records yet.'
      : 'No students match the current search.'

  return (
    <main className="page">
      <header className="page-header">
        <h1>EduSkills Student Data</h1>
        <p className="page-subtitle">Search, sort, and review the student roster.</p>
      </header>

      {status === 'loading' && <p className="notice">Loading students…</p>}

      {status === 'error' && (
        <div className="notice notice-error" role="alert">
          <p className="notice-title">Could not load student data.</p>
          <p className="notice-detail">{errorMessage}</p>
          <p className="notice-detail">
            Make sure the API server is running at <code>localhost:3001</code>.
          </p>
          <button type="button" className="retry-button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="toolbar">
            <label className="search-field">
              <span className="search-label">Filter students</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any field…"
                autoComplete="off"
              />
            </label>
            <p className="row-count" aria-live="polite">
              {countLabel}
            </p>
          </div>

          <StudentTable rows={filteredRows} emptyMessage={emptyMessage} />
        </>
      )}
    </main>
  )
}

export default App
