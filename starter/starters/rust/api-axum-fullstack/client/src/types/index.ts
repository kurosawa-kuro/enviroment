export interface Micropost {
  id: number
  title: string
}

export interface CreateInput {
  title: string
}

export interface ApiResponse<T> {
  status: string
  message?: string
  timestamp: string
  data?: T
  error?: string
}
