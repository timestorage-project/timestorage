import { idlFactory, TimestorageBackend } from '@/timestorage_backend/timestorage_backend.did'
import { Actor, HttpAgent } from '@dfinity/agent'

let agent: HttpAgent
let timestorageActor: TimestorageBackend

const backendCanisterId = (process.env.CANISTER_ID_TIMESTORAGE_BACKEND as string) || 'r26jp-jiaaa-aaaah-qp5gq-cai'

const initializeAgent = async () => {
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic'
  const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app'
  if (!agent) {
    agent = new HttpAgent({ host })

    if (isLocalEnv) {
      await agent.fetchRootKey()
    }
  }
  console.log(backendCanisterId)

  if (!timestorageActor) {
    timestorageActor = Actor.createActor<TimestorageBackend>(idlFactory, {
      agent,
      canisterId: backendCanisterId as string
    })
  }

  return timestorageActor
}

export const getUUIDInfo = async (uuid: string) => {
  const actor = await initializeAgent()
  const result = await actor.getUUIDInfo(uuid)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return result.ok
}

export const updateValue = async (uuid: string, key: string, value: string, lock: boolean = false) => {
  const actor = await initializeAgent()
  const result = await actor.updateValue({ uuid, key, newValue: value })

  if ('err' in result) {
    throw new Error(result.err)
  }

  if (lock) {
    const lockResult = await actor.lockValue({
      uuid,
      key,
      lock: true
    })

    if ('err' in lockResult) {
      throw new Error(lockResult.err)
    }
  }

  return result.ok
}

export const getImage = async (uuid: string, imageId: string) => {
  return true
}

export const uploadFile = async (
  uuid: string,
  fileData: string,
  metadata: {
    fileName: string
    mimeType: string
    uploadTimestamp: bigint
  }
) => {
  const actor = await initializeAgent()
  const result = await actor.uploadFile(uuid, fileData, metadata)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return result.ok
}

export const getFileMetadataByUUIDAndId = async (uuid: string, fileId: string) => {
  const actor = await initializeAgent()
  const result = await actor.getFileMetadataByUUIDAndId(uuid, fileId)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return {
    fileId,
    mimeType: result.ok.metadata.mimeType,
    fileName: result.ok.metadata.fileName,
    uploadTimestamp: result.ok.metadata.uploadTimestamp,
    isImage: result.ok.metadata.mimeType.startsWith('image/')
  }
}

export const getFileMetadataByUUID = async (uuid: string) => {
  const actor = await initializeAgent()
  const result = await actor.getFileMetadataByUUID(uuid)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return result.ok.map((item, index) => ({
    fileId: `file-${index + 1}`, // Assuming IDs follow this pattern
    mimeType: item.metadata.mimeType,
    fileName: item.metadata.fileName,
    uploadTimestamp: item.metadata.uploadTimestamp,
    isImage: item.metadata.mimeType.startsWith('image/')
  }))
}

export const getFileByUUIDAndId = async (uuid: string, fileId: string) => {
  const actor = await initializeAgent()
  const result = await actor.getFileByUUIDAndId(uuid, fileId)

  if ('err' in result) {
    throw new Error(result.err)
  }

  const fileData = result.ok.metadata.fileData
  const mimeType = result.ok.metadata.mimeType
  const fileName = result.ok.metadata.fileName || 'file'
  const uploadTimestamp = result.ok.metadata.uploadTimestamp

  return {
    fileId,
    mimeType,
    fileName,
    uploadTimestamp,
    isImage: mimeType.startsWith('image/'),
    dataUrl: `data:${mimeType};base64,${fileData}`
  }
}

/**
 * Download the actual file content when requested
 */
export const downloadFileContent = async (uuid: string, fileId: string) => {
  return getFileByUUIDAndId(uuid, fileId)
}

export function isFileId(value: string): boolean {
  return typeof value === 'string' && value.startsWith('file-')
}

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('application/pdf')) return '📄'
  if (mimeType.startsWith('text/')) return '📝'
  if (mimeType.startsWith('audio/')) return '🔊'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('document') || mimeType.includes('word')) return '📃'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊'
  return '📎' // Generic file icon
}
