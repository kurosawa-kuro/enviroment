export interface Settings {
  id: string
  isCloud: boolean
  isStub: boolean
  aiModel: string
  updatedAt: Date
}

export interface SettingsInput {
  isCloud: boolean
  isStub: boolean
  aiModel: string
}
