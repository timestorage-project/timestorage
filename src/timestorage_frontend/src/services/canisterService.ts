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

export const updateValue = async (uuid: string, key: string, value: string) => {
  const actor = await initializeAgent()
  const result = await actor.updateValue({ uuid, key, newValue: value })

  if ('err' in result) {
    throw new Error(result.err)
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

export const getFileByUUIDAndId = async (uuid: string, fileId: string) => {
  const actor = await initializeAgent()
  const result = await actor.getFileByUUIDAndId(uuid, fileId)

  if ('err' in result) {
    throw new Error(result.err)
  }

  const fileData = result.ok.metadata.fileData
  const mimeType = result.ok.metadata.mimeType

  // Convert back to displayable format by adding data URL prefix
  return `data:${mimeType};base64,${fileData}`
}
