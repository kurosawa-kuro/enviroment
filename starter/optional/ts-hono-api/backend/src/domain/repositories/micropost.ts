import type { Micropost, MicropostStatus } from '../entities/micropost.js'

export interface CreateMicropostInput {
  title: string
  body: string
  creatorId: string
  imagePath?: string
  status: MicropostStatus
}

export interface UpdateMicropostInput {
  title?: string
  body?: string
  imagePath?: string
  status?: MicropostStatus
}

export interface ListMicropostFilters {
  creatorId?: string
  status?: MicropostStatus
}

export interface MicropostRepository {
  create(data: CreateMicropostInput): Promise<Micropost>
  get(id: string): Promise<Micropost | null>
  list(filters?: ListMicropostFilters): Promise<Micropost[]>
  update(id: string, data: UpdateMicropostInput): Promise<Micropost | null>
  delete(id: string): Promise<boolean>
}
