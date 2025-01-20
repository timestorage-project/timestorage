import { idlFactory, TimestorageBackend } from '@/timestorage_backend/timestorage_backend.did'
import { Actor, HttpAgent } from '@dfinity/agent'

let agent: HttpAgent
let timestorageActor: TimestorageBackend

const initializeAgent = async () => {
  if (!agent) {
    agent = new HttpAgent({
      host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943'
    })

    if (process.env.DFX_NETWORK !== 'ic') {
      await agent.fetchRootKey()
    }
  }

  if (!timestorageActor) {
    timestorageActor = Actor.createActor<TimestorageBackend>(idlFactory, {
      agent,
      canisterId: process.env.CANISTER_ID_TIMESTORAGE_BACKEND || 'bkyz2-fmaaa-aaaaa-qaaaq-cai'
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
  //   const actor = await initializeAgent()
  //   const result = await actor.getImageByUUIDAndId(uuid, imageId)
  console.log('Feature to build')

  //   if ('err' in result) {
  //     throw new Error(result.err)
  //   }

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
