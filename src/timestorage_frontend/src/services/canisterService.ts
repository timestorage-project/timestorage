import { FileResponse, idlFactory, TimestorageBackend, LinkedStructureIdentifier, ProjectInfo, ProjectAPIResponse, ProjectLinkedStructureResponse, ProjectPlacementResponse, ProjectStatus, RemoteDocumentResponse } from '@/timestorage_backend/timestorage_backend.did'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as sessionManagerIdlFactory } from '@/timestorage_session_manager/timestorage_session_manager.did'
import { _SERVICE as SessionManagerService } from '@/timestorage_session_manager/timestorage_session_manager.did'
import { authService } from '@/store/auth.store'

// Backend canister ID from environment variables
const backendCanisterId = (process.env.CANISTER_ID_TIMESTORAGE_BACKEND as string) || 'u6s2n-gx777-77774-qaaba-cai'

// Session manager canister ID from environment variables
const sessionManagerCanisterId =
  (process.env.CANISTER_ID_TIMESTORAGE_SESSION_MANAGER as string) || 'umunu-kh777-77774-qaaca-cai'

let backendActor: TimestorageBackend | null = null
let sessionManagerActor: SessionManagerService | null = null

// Initialize agent and actors
const initializeAgents = async () => {
  if (backendActor && sessionManagerActor) {
    return { backendActor, sessionManagerActor }
  }
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic'
  const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app'

  // Get the identity from auth store
  const identity = authService.getIdentity()

  // Create HTTP agent with the identity
  const agent = new HttpAgent({
    host,
    identity
  })

  if (isLocalEnv) {
    await agent.fetchRootKey().catch(err => {
      console.error('Failed to fetch root key:', err)
    })
  }

  // Create backend actor
  backendActor = Actor.createActor<TimestorageBackend>(idlFactory, {
    agent,
    canisterId: backendCanisterId
  })

  // Create session manager actor
  sessionManagerActor = Actor.createActor<SessionManagerService>(sessionManagerIdlFactory, {
    agent,
    canisterId: sessionManagerCanisterId
  })

  return { backendActor, sessionManagerActor }
}

// Ensure the user is authenticated before making canister calls
const ensureAuthenticated = () => {
  if (!authService.isAuthenticated()) {
    throw new Error('User is not authenticated')
  }
}

// Initialize actors and get the backend actor
export const getBackendActor = async (): Promise<TimestorageBackend> => {
  if (!backendActor) {
    await initializeAgents()
  }
  return backendActor as TimestorageBackend
}

// Initialize actors and get the session manager actor
export const getSessionManagerActor = async (): Promise<SessionManagerService> => {
  if (!sessionManagerActor) {
    await initializeAgents()
  }
  return sessionManagerActor as SessionManagerService
}

// Type transformers to convert optional arrays to cleaner types
type TransformedLinkedStructureIdentifier = {
  model?: string
  floorNumber?: string
  subIdentification?: string
  roomDescription?: string
  productType?: string
  notes?: string
  identification?: string
  category?: string
  brand?: string
  typeText?: string
  sequenceNumber?: string
  dimensions?: string
  positionNumber?: string
}

type TransformedProjectInfo = {
  identification?: string
  subIdentification?: string
  typeText?: string
  category?: string
  version?: string
  createdAt?: string
  issuer?: {
    identification?: string
    email?: string
    name?: string
    phone?: string
    website?: string
    principal?: string
  }
  location?: {
    zip?: string
    floor?: string
    country?: string
    city?: string
    room?: string
    unit?: string
    state?: string
    address?: string
    address2?: string
  }
}

type TransformedProjectAPIResponse = {
  uuid: string
  status: ProjectStatus
  documents: RemoteDocumentResponse[]
  info: TransformedProjectInfo
  placements: Array<{
    uuid: string
    documents: RemoteDocumentResponse[]
    info?: TransformedLinkedStructureIdentifier
  }>
  linkedStructures: Array<{
    uuid: string
    info?: TransformedLinkedStructureIdentifier
  }>
}

// Utility function to extract optional values
const extractOptional = <T>(opt: [] | [T]): T | undefined => 
  opt.length > 0 ? opt[0] : undefined

// Transform LinkedStructureIdentifier from optional arrays to optional values
const transformLinkedStructureIdentifier = (raw: LinkedStructureIdentifier): TransformedLinkedStructureIdentifier => ({
  model: extractOptional(raw.model),
  floorNumber: extractOptional(raw.floorNumber),
  subIdentification: extractOptional(raw.subIdentification),
  roomDescription: extractOptional(raw.roomDescription),
  productType: extractOptional(raw.productType),
  notes: extractOptional(raw.notes),
  identification: extractOptional(raw.identification),
  category: extractOptional(raw.category),
  brand: extractOptional(raw.brand),
  typeText: extractOptional(raw.typeText),
  sequenceNumber: extractOptional(raw.sequenceNumber),
  dimensions: extractOptional(raw.dimensions),
  positionNumber: extractOptional(raw.positionNumber),
})

// Transform ProjectInfo from optional arrays to optional values
const transformProjectInfo = (raw: ProjectInfo): TransformedProjectInfo => ({
  identification: extractOptional(raw.identification),
  subIdentification: extractOptional(raw.subIdentification),
  typeText: extractOptional(raw.typeText),
  category: extractOptional(raw.category),
  version: extractOptional(raw.version),
  createdAt: extractOptional(raw.createdAt),
  issuer: raw.issuer.length > 0 ? {
    identification: extractOptional(raw.issuer[0]!.identification),
    email: extractOptional(raw.issuer[0]!.email),
    name: extractOptional(raw.issuer[0]!.name),
    phone: extractOptional(raw.issuer[0]!.phone),
    website: extractOptional(raw.issuer[0]!.website),
    principal: extractOptional(raw.issuer[0]!.principal),
  } : undefined,
  location: raw.location.length > 0 ? {
    zip: extractOptional(raw.location[0]!.zip),
    floor: extractOptional(raw.location[0]!.floor),
    country: extractOptional(raw.location[0]!.country),
    city: extractOptional(raw.location[0]!.city),
    room: extractOptional(raw.location[0]!.room),
    unit: extractOptional(raw.location[0]!.unit),
    state: extractOptional(raw.location[0]!.state),
    address: extractOptional(raw.location[0]!.address),
    address2: extractOptional(raw.location[0]!.address2),
  } : undefined,
})

// Transform full project response
const transformProjectAPIResponse = (raw: ProjectAPIResponse): TransformedProjectAPIResponse => ({
  uuid: raw.uuid,
  status: raw.status,
  documents: raw.documents,
  info: transformProjectInfo(raw.info),
  placements: raw.placements.map((placement: ProjectPlacementResponse) => ({
    uuid: placement.uuid,
    documents: placement.documents,
    info: placement.info.length > 0 ? transformLinkedStructureIdentifier(placement.info[0]!) : undefined
  })),
  linkedStructures: raw.linkedStructures.map((structure: ProjectLinkedStructureResponse) => ({
    uuid: structure.uuid,
    info: structure.info.length > 0 ? transformLinkedStructureIdentifier(structure.info[0]!) : undefined
  }))
})

// Backend canister methods

export const getUUIDInfo = async (uuid: string): Promise<[string, string, FileResponse[]]> => {
  // ensureAuthenticated()
  const actor = await getBackendActor()
  const result = await actor.getUUIDInfo(uuid)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return result.ok
}

export const getProjectByUuid = async (uuid: string): Promise<TransformedProjectAPIResponse> => {
  const actor = await getBackendActor()
  const result = await actor.getProjectByUuid(uuid)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return transformProjectAPIResponse(result.ok)
}

export const getProject = async (projectUuid: string): Promise<TransformedProjectAPIResponse> => {
  const actor = await getBackendActor()
  const result = await actor.getProject(projectUuid)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return transformProjectAPIResponse(result.ok)
}

export const updateValue = async (uuid: string, key: string, value: string, lock: boolean = false) => {
  ensureAuthenticated()
  const actor = await getBackendActor()
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
  ensureAuthenticated()
  const actor = await getBackendActor()
  const result = await actor.uploadFile(uuid, fileData, metadata)

  if ('err' in result) {
    throw new Error(result.err)
  }

  return result.ok
}

export const getFileMetadataByUUIDAndId = async (uuid: string, fileId: string) => {
  // ensureAuthenticated()
  const actor = await getBackendActor()
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
  // ensureAuthenticated()
  const actor = await getBackendActor()
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
  // ensureAuthenticated()
  const actor = await getBackendActor()
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
