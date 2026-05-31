import { v2 as cloudinary } from 'cloudinary'
import type { FileUploadService } from '../../domain/services/fileUpload.js'
import { Errors } from '../../shared/errors.js'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

interface FileUploadDeps {
  cloudinaryConfig: CloudinaryConfig
}

export function createFileUploadService({ cloudinaryConfig }: FileUploadDeps): FileUploadService {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
  })

  return {
    async saveImage(file: File): Promise<string> {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw Errors.badRequest(`Invalid file type: ${file.type}. Allowed: jpg, png, gif, webp`)
      }

      // Convert File to base64 data URL for Cloudinary upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUri = `data:${file.type};base64,${base64}`

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'microposts',
          resource_type: 'image',
        })

        return result.secure_url
      } catch (err) {
        throw Errors.serviceUnavailable('cloudinary', err)
      }
    }
  }
}
