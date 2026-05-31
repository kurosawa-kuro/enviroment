export interface FileUploadService {
  saveImage(file: File): Promise<string>
}
