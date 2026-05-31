import type { MongoClient } from 'mongodb'
import type { Settings, SettingsInput } from '../../../domain/entities/settings.js'
import type { SettingsRepository } from '../../../domain/repositories/settings.js'
import { wrapDbOperation } from '../../database/errors.js'

interface SettingsRepoDeps {
  mongoClient: MongoClient
  mongoDbName: string
}

export function createSettingsMongoRepository({
  mongoClient,
  mongoDbName,
}: SettingsRepoDeps): SettingsRepository {
  const db = mongoClient.db(mongoDbName)
  const collection = db.collection('settings')
  const historyCollection = db.collection('settings_history')

  return {
    async get(): Promise<Settings | null> {
      return wrapDbOperation(async () => {
        const doc = await collection.findOne({ _id: 'current' as unknown as import('mongodb').ObjectId })
        if (!doc) return null
        // Handle both Date and string (legacy) formats
        const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt as string)
        return {
          id: doc.settingsId as string,
          isCloud: doc.isCloud as boolean,
          isStub: doc.isStub as boolean,
          aiModel: doc.aiModel as string,
          updatedAt,
        }
      }, 'settings.get')
    },

    async save(input: SettingsInput): Promise<Settings> {
      return wrapDbOperation(async () => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        const updatedAt = new Date()

        const settings: Settings = {
          id,
          isCloud: input.isCloud,
          isStub: input.isStub,
          aiModel: input.aiModel,
          updatedAt,
        }

        // 現在の設定を履歴に追加
        const current = await collection.findOne({ _id: 'current' as unknown as import('mongodb').ObjectId })
        if (current) {
          await historyCollection.insertOne({
            id: current.settingsId,
            isCloud: current.isCloud,
            isStub: current.isStub,
            aiModel: current.aiModel,
            updatedAt: current.updatedAt,
            archivedAt: updatedAt,
          })
          // 履歴は最新10件のみ保持
          const count = await historyCollection.countDocuments()
          if (count > 10) {
            const oldest = await historyCollection
              .find()
              .sort({ archivedAt: 1 })
              .limit(count - 10)
              .toArray()
            const idsToDelete = oldest.map((doc) => doc._id)
            await historyCollection.deleteMany({ _id: { $in: idsToDelete } })
          }
        }

        // 新しい設定を現在の設定として保存 (upsert)
        await collection.updateOne(
          { _id: 'current' as unknown as import('mongodb').ObjectId },
          { $set: { settingsId: id, ...input, updatedAt } },
          { upsert: true }
        )

        return settings
      }, 'settings.save')
    },

    async getHistory(): Promise<Settings[]> {
      return wrapDbOperation(async () => {
        const docs = await historyCollection
          .find()
          .sort({ archivedAt: -1 })
          .limit(10)
          .toArray()
        return docs.map((doc) => {
          // Handle both Date and string (legacy) formats
          const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt as string)
          return {
            id: doc.id as string,
            isCloud: doc.isCloud as boolean,
            isStub: doc.isStub as boolean,
            aiModel: doc.aiModel as string,
            updatedAt,
          }
        })
      }, 'settings.getHistory')
    }
  }
}
