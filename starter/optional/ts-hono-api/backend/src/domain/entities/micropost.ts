export type MicropostStatus = 'draft' | 'published'

export interface Micropost {
  id: string
  title: string
  body: string
  creatorId: string
  imagePath?: string
  status: MicropostStatus
  createdAt: Date
  updatedAt: Date
}
