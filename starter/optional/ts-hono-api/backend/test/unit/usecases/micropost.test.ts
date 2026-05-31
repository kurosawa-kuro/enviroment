import { describe, it, expect, vi } from 'vitest'
import { createMicropostUseCases } from '../../../src/domain/usecases/micropost/index.js'
import { createMockMicropostRepo, createMockFileUploadService } from '../../helpers/mocks.js'
import type { Micropost } from '../../../src/domain/entities/micropost.js'

describe('Micropost Use Cases', () => {
  const mockMicropost: Micropost = {
    id: '123',
    title: 'Test Title',
    body: 'Test body content',
    creatorId: 'user_123',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('createMicropostUseCases', () => {
    it('should create use cases object with all methods', () => {
      const mockRepo = createMockMicropostRepo()
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      expect(useCases.create).toBeDefined()
      expect(useCases.get).toBeDefined()
      expect(useCases.list).toBeDefined()
      expect(useCases.update).toBeDefined()
      expect(useCases.delete).toBeDefined()
    })
  })

  describe('create', () => {
    it('should create micropost with all fields', async () => {
      const mockRepo = createMockMicropostRepo({
        create: vi.fn().mockResolvedValue(mockMicropost),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.create({
        input: {
          title: 'Test Title',
          body: 'Test body content',
          creatorId: 'user_123',
          status: 'draft',
        }
      })

      expect(mockRepo.create).toHaveBeenCalled()
      expect(result).toEqual(mockMicropost)
    })

    it('should upload image when imageFile is provided', async () => {
      const mockRepo = createMockMicropostRepo({
        create: vi.fn().mockResolvedValue({ ...mockMicropost, imagePath: 'https://cdn.example.com/image.jpg' }),
      })
      const mockFileService = createMockFileUploadService({
        saveImage: vi.fn().mockResolvedValue('https://cdn.example.com/image.jpg')
      })

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await useCases.create({
        input: {
          title: 'Test Title',
          body: 'Test body content',
          creatorId: 'user_123',
          status: 'draft',
        },
        imageFile: mockFile
      })

      expect(mockFileService.saveImage).toHaveBeenCalledWith(mockFile)
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        imagePath: 'https://cdn.example.com/image.jpg'
      }))
    })
  })

  describe('get', () => {
    it('should return micropost by id', async () => {
      const mockRepo = createMockMicropostRepo({
        get: vi.fn().mockResolvedValue(mockMicropost),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.get('123')

      expect(mockRepo.get).toHaveBeenCalledWith('123')
      expect(result).toEqual(mockMicropost)
    })

    it('should return null for non-existent micropost', async () => {
      const mockRepo = createMockMicropostRepo({
        get: vi.fn().mockResolvedValue(null),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.get('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return all microposts', async () => {
      const mockRepo = createMockMicropostRepo({
        list: vi.fn().mockResolvedValue([mockMicropost]),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.list()

      expect(mockRepo.list).toHaveBeenCalledWith(undefined)
      expect(result).toEqual([mockMicropost])
    })

    it('should filter by status', async () => {
      const mockRepo = createMockMicropostRepo({
        list: vi.fn().mockResolvedValue([mockMicropost]),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      await useCases.list({ status: 'draft' })

      expect(mockRepo.list).toHaveBeenCalledWith({ status: 'draft' })
    })
  })

  describe('update', () => {
    it('should update micropost with new title', async () => {
      const updatedMicropost = { ...mockMicropost, title: 'Updated Title' }
      const mockRepo = createMockMicropostRepo({
        update: vi.fn().mockResolvedValue(updatedMicropost),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.update({
        id: '123',
        input: { title: 'Updated Title' }
      })

      expect(mockRepo.update).toHaveBeenCalled()
      expect(result).toEqual(updatedMicropost)
    })

    it('should return null for non-existent micropost', async () => {
      const mockRepo = createMockMicropostRepo({
        update: vi.fn().mockResolvedValue(null),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.update({
        id: 'non-existent',
        input: { title: 'New Title' }
      })

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete micropost and return true', async () => {
      const mockRepo = createMockMicropostRepo({
        delete: vi.fn().mockResolvedValue(true),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.delete('123')

      expect(mockRepo.delete).toHaveBeenCalledWith('123')
      expect(result).toBe(true)
    })

    it('should return false for non-existent micropost', async () => {
      const mockRepo = createMockMicropostRepo({
        delete: vi.fn().mockResolvedValue(false),
      })
      const mockFileService = createMockFileUploadService()

      const useCases = createMicropostUseCases({
        micropostRepo: mockRepo,
        fileUploadService: mockFileService
      })

      const result = await useCases.delete('non-existent')

      expect(result).toBe(false)
    })
  })
})
