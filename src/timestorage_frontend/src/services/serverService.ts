import { AssetCore } from '@/types/structures'
import { publicApiClient } from './apiClient'

// Import the type from the canister service to ensure compatibility
type CanisterTransformedProjectAPIResponse = Awaited<ReturnType<typeof import('./canisterService').getProject>>

// Transform server response to match canister service transformed format
function transformServerProjectToCanisterFormat(serverData: CanisterTransformedProjectAPIResponse): CanisterTransformedProjectAPIResponse {
  // Map server status strings to the format expected by canister service
  // The canister service status is an object with the status as key and null as value


  return {
    uuid: serverData.uuid,
    status: serverData.status,
    documents: serverData.documents || [],
    info: {
      identification: serverData.info?.identification,
      subIdentification: serverData.info?.subIdentification,
      typeText: serverData.info?.typeText,
      category: serverData.info?.category,
      version: serverData.info?.version,
      createdAt: serverData.info?.createdAt,
      issuer: serverData.info?.issuer,
      location: serverData.info?.location,
    },
    placements: (serverData.placements || []).map((placement: CanisterTransformedProjectAPIResponse['placements'][number]) => ({
      uuid: placement.uuid,
      documents: placement.documents || [],
      info: placement.info,
    })),
    linkedStructures: (serverData.linkedStructures || []).map((structure: CanisterTransformedProjectAPIResponse['linkedStructures'][number]) => ({
      uuid: structure.uuid,
      info: structure.info,
    })),
  }
}

// Server service methods that mirror canisterService
export const getUUIDInfo = async (uuid: string): Promise<[string, string, unknown[]]> => {
  try {
    const response = await publicApiClient.get<{
      schema: string
      valuesAndLock: string
      files: unknown[]
    }>(`/assets/${uuid}/info`)
    const data = response.data
    return [data.schema, data.valuesAndLock, data.files]
  } catch (error) {
    console.error('Error fetching UUID info from server:', error)
    throw error
  }
}

export const getProjectByUuid = async (uuid: string): Promise<CanisterTransformedProjectAPIResponse> => {
  try {
    const response = await publicApiClient.get<CanisterTransformedProjectAPIResponse>(`/assets/projects/${uuid}`)
    // Transform the server response to match canister service format
    return transformServerProjectToCanisterFormat(response.data)
  } catch (error) {
    console.error('Error fetching project by UUID from server:', error)
    throw error
  }
}

export const getProject = async (projectUuid: string): Promise<CanisterTransformedProjectAPIResponse> => {
  try {
    const response = await publicApiClient.get<CanisterTransformedProjectAPIResponse>(`/assets/projects/${projectUuid}/details`)
    // Transform the server response to match canister service format
    return transformServerProjectToCanisterFormat(response.data)
  } catch (error) {
    console.error('Error fetching project from server:', error)
    throw error
  }
}

export const getAssetCore = async (uuid: string): Promise<AssetCore> => {
  try {
    const response = await publicApiClient.get<AssetCore>(`/assets/${uuid}/core`)
    return response.data
  } catch (error) {
    console.error('Error fetching asset core from server:', error)
    throw error
  }
}

export const updateValue = async (uuid: string, key: string, value: string, lock: boolean = false) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

export const getImage = async (uuid: string, imageId: string) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
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
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

export const getFileMetadataByUUIDAndId = async (uuid: string, fileId: string) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

export const getFileMetadataByUUID = async (uuid: string) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

export const getFileByUUIDAndId = async (uuid: string, fileId: string) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

export const downloadFileContent = async (uuid: string, fileId: string) => {
  // TODO: Implement API call
  throw new Error('Server service not implemented yet')
}

// Utility functions that match canisterService
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