import { useState, useEffect } from 'react'
import { fetchHealth } from '../api/client'

export function Health() {
  const [status, setStatus] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setStatus(data.status)
        setTimestamp(new Date().toISOString())
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch health')
      })
  }, [])

  return (
    <div>
      <h2>ヘルスチェック</h2>

      <div className="card">
        {error ? (
          <p>ステータス: <span className="status status-unhealthy">error</span></p>
        ) : status ? (
          <>
            <p>ステータス: <span className="status status-healthy">{status}</span></p>
            <p className="timestamp">タイムスタンプ: <code>{timestamp}</code></p>
          </>
        ) : (
          <p aria-busy="true">Loading...</p>
        )}
      </div>
    </div>
  )
}
