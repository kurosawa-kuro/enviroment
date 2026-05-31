import type { Micropost, CreateInput, ApiResponse } from '../types'

const API_BASE = '/api/microposts'

export async function fetchPosts(): Promise<Micropost[]> {
  const res = await fetch(API_BASE)
  const data: ApiResponse<Micropost[]> = await res.json()
  if (data.status !== 'success') throw new Error(data.error || 'Failed to fetch posts')
  return data.data!
}

export async function fetchPost(id: number): Promise<Micropost> {
  const res = await fetch(`${API_BASE}/${id}`)
  const data: ApiResponse<Micropost> = await res.json()
  if (data.status !== 'success') throw new Error(data.error || 'Failed to fetch post')
  return data.data!
}

export async function createPost(input: CreateInput): Promise<Micropost> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data: ApiResponse<Micropost> = await res.json()
  if (data.status !== 'success') throw new Error(data.error || 'Failed to create post')
  return data.data!
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch('/api/health')
  const data: ApiResponse<{ status: string }> = await res.json()
  if (data.status !== 'success') throw new Error(data.error || 'Failed to fetch health')
  return data.data!
}
