import { describe, it, expect, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { createMicropostMongoRepository } from '../../../src/infra/repositories/micropost/mongo.js'

describe('createMicropostMongoRepository', () => {
  const createMockCollection = (overrides = {}) => ({
    findOne: vi.fn(),
    insertOne: vi.fn(),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })
    }),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
    ...overrides
  })

  const createMockClient = (collection: any) => ({
    db: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue(collection)
    })
  }) as any

  it('should create repository with all crud methods', () => {
    const mockCollection = createMockCollection()
    const mockClient = createMockClient(mockCollection)

    const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

    expect(typeof repo.create).toBe('function')
    expect(typeof repo.get).toBe('function')
    expect(typeof repo.list).toBe('function')
    expect(typeof repo.update).toBe('function')
    expect(typeof repo.delete).toBe('function')
  })

  describe('create', () => {
    it('should insert document and return micropost', async () => {
      const insertedId = new ObjectId()
      const mockCollection = createMockCollection({
        insertOne: vi.fn().mockResolvedValue({ insertedId })
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.create({
        title: 'Test Title',
        body: 'Test body',
        creatorId: 'user_123',
        status: 'draft'
      })

      expect(mockCollection.insertOne).toHaveBeenCalled()
      expect(result.id).toBe(insertedId.toString())
      expect(result.title).toBe('Test Title')
      expect(result.body).toBe('Test body')
      expect(result.creatorId).toBe('user_123')
      expect(result.status).toBe('draft')
    })

    it('should include imagePath when provided', async () => {
      const insertedId = new ObjectId()
      const mockCollection = createMockCollection({
        insertOne: vi.fn().mockResolvedValue({ insertedId })
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.create({
        title: 'Test',
        body: 'Body',
        creatorId: 'user_123',
        status: 'published',
        imagePath: '/uploads/image.jpg'
      })

      expect(result.imagePath).toBe('/uploads/image.jpg')
    })
  })

  describe('get', () => {
    it('should return micropost when found', async () => {
      const docId = new ObjectId()
      const mockDoc = {
        _id: docId,
        title: 'Found Post',
        body: 'Content',
        creatorId: 'user_123',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockCollection = createMockCollection({
        findOne: vi.fn().mockResolvedValue(mockDoc)
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.get(docId.toString())

      expect(result).not.toBeNull()
      expect(result?.id).toBe(docId.toString())
      expect(result?.title).toBe('Found Post')
    })

    it('should return null for invalid ObjectId', async () => {
      const mockCollection = createMockCollection()
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.get('invalid-id')

      expect(result).toBeNull()
      expect(mockCollection.findOne).not.toHaveBeenCalled()
    })

    it('should return null when not found', async () => {
      const mockCollection = createMockCollection({
        findOne: vi.fn().mockResolvedValue(null)
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.get(new ObjectId().toString())

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return empty array when no documents', async () => {
      const mockCollection = createMockCollection()
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.list()

      expect(result).toEqual([])
    })

    it('should apply status filter', async () => {
      const mockFind = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      })
      const mockCollection = createMockCollection({ find: mockFind })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      await repo.list({ status: 'published' })

      expect(mockFind).toHaveBeenCalledWith({ status: 'published' })
    })

    it('should apply creatorId filter', async () => {
      const mockFind = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      })
      const mockCollection = createMockCollection({ find: mockFind })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      await repo.list({ creatorId: 'user_123' })

      expect(mockFind).toHaveBeenCalledWith({ creatorId: 'user_123' })
    })
  })

  describe('update', () => {
    it('should update document and return updated micropost', async () => {
      const docId = new ObjectId()
      const updatedDoc = {
        _id: docId,
        title: 'Updated Title',
        body: 'Original Body',
        creatorId: 'user_123',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockCollection = createMockCollection({
        findOneAndUpdate: vi.fn().mockResolvedValue(updatedDoc)
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.update(docId.toString(), { title: 'Updated Title' })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled()
      expect(result).not.toBeNull()
      expect(result?.title).toBe('Updated Title')
    })

    it('should return null for invalid ObjectId', async () => {
      const mockCollection = createMockCollection()
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.update('invalid-id', { title: 'Test' })

      expect(result).toBeNull()
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should return null when document not found', async () => {
      const mockCollection = createMockCollection({
        findOneAndUpdate: vi.fn().mockResolvedValue(null)
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.update(new ObjectId().toString(), { title: 'Test' })

      expect(result).toBeNull()
    })

    it('should update multiple fields', async () => {
      const docId = new ObjectId()
      const updatedDoc = {
        _id: docId,
        title: 'New Title',
        body: 'New Body',
        creatorId: 'user_123',
        status: 'published',
        imagePath: '/new/path.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockCollection = createMockCollection({
        findOneAndUpdate: vi.fn().mockResolvedValue(updatedDoc)
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.update(docId.toString(), {
        title: 'New Title',
        body: 'New Body',
        status: 'published',
        imagePath: '/new/path.jpg'
      })

      expect(result?.title).toBe('New Title')
      expect(result?.body).toBe('New Body')
      expect(result?.status).toBe('published')
      expect(result?.imagePath).toBe('/new/path.jpg')
    })
  })

  describe('delete', () => {
    it('should delete document and return true', async () => {
      const mockCollection = createMockCollection({
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 })
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.delete(new ObjectId().toString())

      expect(result).toBe(true)
      expect(mockCollection.deleteOne).toHaveBeenCalled()
    })

    it('should return false for invalid ObjectId', async () => {
      const mockCollection = createMockCollection()
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.delete('invalid-id')

      expect(result).toBe(false)
      expect(mockCollection.deleteOne).not.toHaveBeenCalled()
    })

    it('should return false when document not found', async () => {
      const mockCollection = createMockCollection({
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 })
      })
      const mockClient = createMockClient(mockCollection)
      const repo = createMicropostMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

      const result = await repo.delete(new ObjectId().toString())

      expect(result).toBe(false)
    })
  })
})
