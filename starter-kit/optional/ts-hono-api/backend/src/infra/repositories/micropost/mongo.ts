import { ObjectId, type MongoClient, type Filter, type Document } from 'mongodb'
import type { Micropost, MicropostStatus } from '../../../domain/entities/micropost.js'
import type {
  MicropostRepository,
  CreateMicropostInput,
  UpdateMicropostInput,
  ListMicropostFilters,
} from '../../../domain/repositories/micropost.js'
import { wrapDbOperation } from '../../database/errors.js'

interface MicropostDocument {
  _id: ObjectId
  title: string
  body: string
  creatorId: string
  imagePath?: string
  status: MicropostStatus
  createdAt: Date
  updatedAt: Date
}

function toMicropost(doc: MicropostDocument): Micropost {
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    creatorId: doc.creatorId,
    imagePath: doc.imagePath,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

interface MicropostRepoDeps {
  mongoClient: MongoClient
  mongoDbName: string
}

export function createMicropostMongoRepository({
  mongoClient,
  mongoDbName,
}: MicropostRepoDeps): MicropostRepository {
  const db = mongoClient.db(mongoDbName)
  const collection = db.collection<MicropostDocument>('microposts')

  return {
    async create(data: CreateMicropostInput): Promise<Micropost> {
      return wrapDbOperation(async () => {
        const now = new Date()
        const doc: Omit<MicropostDocument, '_id'> = {
          title: data.title,
          body: data.body,
          creatorId: data.creatorId,
          status: data.status,
          createdAt: now,
          updatedAt: now,
        }

        if (data.imagePath) {
          doc.imagePath = data.imagePath
        }

        const result = await collection.insertOne(doc as MicropostDocument)

        return {
          id: result.insertedId.toString(),
          title: data.title,
          body: data.body,
          creatorId: data.creatorId,
          imagePath: data.imagePath,
          status: data.status,
          createdAt: now,
          updatedAt: now,
        }
      }, 'micropost.create')
    },

    async get(id: string): Promise<Micropost | null> {
      if (!ObjectId.isValid(id)) {
        return null
      }

      return wrapDbOperation(async () => {
        const doc = await collection.findOne({ _id: new ObjectId(id) })
        if (!doc) {
          return null
        }

        return toMicropost(doc)
      }, 'micropost.get')
    },

    async list(filters?: ListMicropostFilters): Promise<Micropost[]> {
      return wrapDbOperation(async () => {
        const query: Filter<Document> = {}

        if (filters?.creatorId) {
          query.creatorId = filters.creatorId
        }

        if (filters?.status) {
          query.status = filters.status
        }

        const docs = await collection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray()

        return docs.map(toMicropost)
      }, 'micropost.list')
    },

    async update(id: string, data: UpdateMicropostInput): Promise<Micropost | null> {
      if (!ObjectId.isValid(id)) {
        return null
      }

      return wrapDbOperation(async () => {
        const updateFields: Record<string, unknown> = {
          updatedAt: new Date(),
        }

        if (data.title !== undefined) updateFields.title = data.title
        if (data.body !== undefined) updateFields.body = data.body
        if (data.status !== undefined) updateFields.status = data.status
        if (data.imagePath !== undefined) updateFields.imagePath = data.imagePath

        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateFields },
          { returnDocument: 'after' }
        )

        if (!result) {
          return null
        }

        return toMicropost(result)
      }, 'micropost.update')
    },

    async delete(id: string): Promise<boolean> {
      if (!ObjectId.isValid(id)) {
        return false
      }

      return wrapDbOperation(async () => {
        const result = await collection.deleteOne({ _id: new ObjectId(id) })
        return result.deletedCount > 0
      }, 'micropost.delete')
    },
  }
}
