import type { MicropostRepository } from '../../repositories/micropost.js'
import type { FileUploadService } from '../../services/fileUpload.js'
import type { MicropostUseCases, CreateMicropostParams, UpdateMicropostParams } from './types.js'

/**
 * MicropostUseCasesの依存関係
 */
export interface MicropostUseCasesDeps {
  micropostRepo: MicropostRepository
  fileUploadService: FileUploadService
}

/**
 * MicropostUseCases Factory
 * DIコンテナから依存関係を受け取り、UseCasesオブジェクトを生成
 */
export function createMicropostUseCases(deps: MicropostUseCasesDeps): MicropostUseCases {
  const { micropostRepo, fileUploadService } = deps

  return {
    create: async ({ input, imageFile }: CreateMicropostParams) => {
      let imagePath = input.imagePath
      if (imageFile && imageFile.size > 0) {
        imagePath = await fileUploadService.saveImage(imageFile)
      }
      return micropostRepo.create({ ...input, imagePath })
    },

    get: (id: string) => micropostRepo.get(id),

    list: (filters) => micropostRepo.list(filters),

    update: async ({ id, input, imageFile }: UpdateMicropostParams) => {
      let imagePath = input.imagePath
      if (imageFile && imageFile.size > 0) {
        imagePath = await fileUploadService.saveImage(imageFile)
      }
      return micropostRepo.update(id, { ...input, ...(imagePath && { imagePath }) })
    },

    delete: (id: string) => micropostRepo.delete(id),
  }
}
