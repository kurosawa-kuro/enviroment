import { useState, useEffect, useCallback } from 'react'
import { fetchPosts, createPost } from '../api/client'
import { PostTable } from '../components/PostTable'
import { EmptyState } from '../components/EmptyState'
import type { Micropost } from '../types'

export function Microposts() {
  const [posts, setPosts] = useState<Micropost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPosts()
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    try {
      await createPost({ title: trimmed })
      setTitle('')
      setMessage('投稿しました')
      setTimeout(() => setMessage(null), 2000)
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました')
    }
  }

  if (loading) {
    return <div className="loading" aria-busy="true">Loading...</div>
  }

  return (
    <div>
      <h2>Microposts</h2>

      <div className="card">
        <form className="post-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力..."
            required
          />
          <button type="submit">投稿</button>
        </form>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      <div className="card">
        {posts.length === 0 ? <EmptyState /> : <PostTable posts={posts} />}
      </div>
    </div>
  )
}
