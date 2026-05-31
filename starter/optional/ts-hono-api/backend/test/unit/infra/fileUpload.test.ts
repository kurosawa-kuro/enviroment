import { describe, it, expect, vi } from 'vitest'

// Mock cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg'
      })
    }
  }
}))

import { createFileUploadService } from '../../../src/infra/services/fileUpload.js'

describe('createFileUploadService', () => {
  it('should upload valid image', async () => {
    const service = createFileUploadService({
      cloudinaryConfig: {
        cloudName: 'test',
        apiKey: 'key',
        apiSecret: 'secret'
      }
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const url = await service.saveImage(file)

    expect(url).toBe('https://cloudinary.com/test-image.jpg')
  })

  it('should reject invalid file type', async () => {
    const service = createFileUploadService({
      cloudinaryConfig: {
        cloudName: 'test',
        apiKey: 'key',
        apiSecret: 'secret'
      }
    })

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    await expect(service.saveImage(file)).rejects.toThrow('Invalid file type')
  })
})
