import type { Micropost } from '../../entities/micropost.js'
import type { CreateMicropostInput, UpdateMicropostInput, ListMicropostFilters } from '../../repositories/micropost.js'

/**
 * Micropost作成パラメータ
 * FileUploadServiceが内部で処理するためimageFileを含む
 */
export interface CreateMicropostParams {
  input: CreateMicropostInput
  imageFile?: File
}

/**
 * Micropost更新パラメータ
 */
export interface UpdateMicropostParams {
  id: string
  input: UpdateMicropostInput
  imageFile?: File
}

/**
 * MicropostUseCases Interface
 * DIコンテナに登録され、Controllerから使用される主要インターフェース
 */
export interface MicropostUseCases {
  create: (params: CreateMicropostParams) => Promise<Micropost>
  get: (id: string) => Promise<Micropost | null>
  list: (filters?: ListMicropostFilters) => Promise<Micropost[]>
  update: (params: UpdateMicropostParams) => Promise<Micropost | null>
  delete: (id: string) => Promise<boolean>
}
