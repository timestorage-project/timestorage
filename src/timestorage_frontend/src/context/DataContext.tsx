import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import * as serverService from '../services/serverService'
import { en } from '@/lang/en'
import { it } from '@/lang/it'
import { AssetCore, FetchingStatus, IWizardQuestion } from '@/types/structures'
import { DataStructure } from '@/types/DataStructure'
import { historyService } from '../services/historyService'

type TransformedProjectAPIResponse = Awaited<ReturnType<typeof canisterService.getProject>>

interface IDataHookReturn {
  provider: 'canister' | 'server'
  uuid: string
  data: DataStructure | null
  project: TransformedProjectAPIResponse | null
  assetCore: AssetCore | null
  fetchingStatus: FetchingStatus
  isLoading: boolean
  error: string | null
  reloadData: () => Promise<void>
  getWizardQuestions: (sectionId: string) => Promise<IWizardQuestion[]>
}

/**
 * ---------------------------------------------------------
 * 1) Determine which service to use based on asset availability and status
 * ---------------------------------------------------------
 */
async function determineProvider(uuid: string): Promise<'canister' | 'server'> {
  try {
    // First try to get asset from canister
    const assetCore = await canisterService.getAssetCore(uuid)
    
    // If asset exists and status is completed, use canister
    if (assetCore && assetCore.status === 'completed') {
      return 'canister'
    }
    
    // If asset doesn't exist or status is not completed, try server
    return 'server'
  } catch (canisterError) {
    console.log('Asset not found in canister, trying server:', canisterError)
    
    try {
      // Try to fetch QR tag from server to see if it exists there
      await serverService.getAssetCore(uuid)
      return 'server'
    } catch (serverAssetError) {
      console.log('Asset not found in server either, checking for project:', serverAssetError)
      
      try {
        // UUID might be a project UUID instead of QR tag, try to fetch project
        await serverService.getProjectByUuid(uuid)
        console.log('Found project with UUID in server, using server provider')
        return 'server'
      } catch (serverProjectError) {
        console.log('Project not found in server either:', serverProjectError)
        
        try {
          // Last attempt: try to fetch project from canister
          await canisterService.getProjectByUuid(uuid)
          console.log('Found project with UUID in canister, using canister provider')
          return 'canister'
        } catch (canisterProjectError) {
          console.log('Project not found in canister either:', canisterProjectError)
          // If not found anywhere, throw error
          throw new Error('UUID not found as either asset or project in any service')
        }
      }
    }
  }
}

/**
 * ---------------------------------------------------------
 * 2) Fetch function that calls either canister or server service
 * ---------------------------------------------------------
 * This now returns a DataStructure instance directly.
 */
async function fetchData(uuid: string, translations: { [key: string]: string }, provider: 'canister' | 'server'): Promise<DataStructure> {
  try {
    const service = provider === 'canister' ? canisterService : serverService
    const [schemaText, valuesAndLockJson] = await service.getUUIDInfo(uuid)

    // Parse the JSON strings first
    const schemaData = JSON.parse(schemaText)
    const valuesAndLock = JSON.parse(valuesAndLockJson)

    // Combine the data
    const combinedData = {
      uuid,
      ...schemaData,
      values: valuesAndLock.values,
      lockStatus: valuesAndLock.lockStatus
    }

    // Convert back to string for translation
    let combinedJsonString = JSON.stringify(combinedData)

    // Apply translations to the entire combined JSON string
    for (const localeKey in translations) {
      if (translations.hasOwnProperty(localeKey)) {
        const regex = new RegExp(localeKey, 'g')
        combinedJsonString = combinedJsonString.replace(regex, translations[localeKey])
      }
    }

    console.debug('Combined and translated JSON:', combinedJsonString)

    // Parse the translated JSON string back to an object
    const translatedData = JSON.parse(combinedJsonString)

    // Use the new class-based method to parse the entire structure
    return DataStructure.fromJSON(translatedData)
  } catch (err) {
    console.error(`Error fetching data from ${provider}:`, err)
    throw err
  }
}

/**
 * ---------------------------------------------------------
 * Main data fetching hook - accepts UUID/projectId parameters
 * ---------------------------------------------------------
 */
export const useData = (uuid?: string, projectId?: string): IDataHookReturn => {
  const [data, setData] = useState<DataStructure | null>(null)
  const [project, setProject] = useState<TransformedProjectAPIResponse | null>(null)
  const [assetCore, setAssetCore] = useState<AssetCore | null>(null)
  const [fetchingStatus, setFetchingStatus] = useState<FetchingStatus>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<'canister' | 'server'>('canister')
  const navigate = useNavigate()
  const [resolvedUuid, setResolvedUuid] = useState<string>('')
  const [locale] = useState<'en' | 'it'>('it')

  const translations = locale === 'en' ? en : it

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      const currentUuid = uuid || projectId || ''

      if (!currentUuid) {
        setError('No UUID provided for data loading.')
        setData(null)
        setResolvedUuid('')
        setIsLoading(false)
        return
      }

      setResolvedUuid(currentUuid)

      try {
        const determinedProvider = await determineProvider(currentUuid).catch(() => 'canister' as const)
        setProvider(determinedProvider)
        console.log(`Using ${determinedProvider} service for UUID: ${currentUuid}`)

        const service = determinedProvider === 'canister' ? canisterService : serverService

        setFetchingStatus('project')
        const projectResult = await service.getProjectByUuid(currentUuid).catch(err => {
          console.error('Failed to fetch project, proceeding without it.', err)
          return null
        })
        if (projectResult) {
          setProject(projectResult)
          historyService.addProject(currentUuid, projectResult.info.identification, projectResult.info.subIdentification)
        }

        setFetchingStatus('data')
        const dataResult = await fetchData(currentUuid, translations, determinedProvider).catch(() => null)
        if (dataResult) {
          setData(dataResult)
          historyService.addUUID(currentUuid, dataResult.info?.identification, dataResult.info?.subIdentification)
        } else if (projectResult) {
          navigate(`/linking/${currentUuid}`)
        }

        const assetCoreResult = await service.getAssetCore(currentUuid).catch(() => null)
        if (assetCoreResult) {
          setAssetCore(assetCoreResult)
        } else {
          setAssetCore({
            status: 'initialized',
            grants: [],
            identifier: undefined,
            subidentifier: undefined
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
        setData(null)
      } finally {
        setIsLoading(false)
        setFetchingStatus('completed')
      }
    }

    loadData()
  }, [uuid, projectId, translations, navigate])

  const reloadData = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData(resolvedUuid, translations, provider)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getWizardQuestions = async (sectionId: string): Promise<IWizardQuestion[]> => {
    if (!data?.nodes) return []
    const wizardNode = data.nodes[sectionId]
    if (!wizardNode?.isWizard || !wizardNode?.questions) return []
    return wizardNode.questions
  }

  return {
    data: data ?? null,
    project,
    assetCore,
    fetchingStatus,
    isLoading,
    error,
    uuid: resolvedUuid,
    getWizardQuestions,
    reloadData,
    provider
  }
}