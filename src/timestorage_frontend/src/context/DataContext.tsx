import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import * as serverService from '../services/serverService'
import { en } from '@/lang/en'
import mockEquipmentData from '../mocks/mock-equipment.json'
import { it } from '@/lang/it'
import { AssetCore, FetchingStatus, IWizardQuestion } from '@/types/structures'
import { DataStructure } from '@/types/DataStructure'
import { historyService } from '../services/historyService'

type TransformedProjectAPIResponse = Awaited<ReturnType<typeof canisterService.getProject>>

interface IDataContextType {
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

const DataContext = createContext<IDataContextType | undefined>(undefined)

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
      // Try to fetch from server to see if it exists there
      await serverService.getAssetCore(uuid)
      return 'server'
    } catch (serverError) {
      console.log('Asset not found in server either:', serverError)
      // If not found in either, default to canister for backwards compatibility
      throw new Error('Asset does not exists')
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
 * 2) DataProvider & useData Hook
 * ---------------------------------------------------------
 */
interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  // The state now holds our new DataStructure class instance.
  const [data, setData] = useState<DataStructure | null>(null)
  const [project, setProject] = useState<TransformedProjectAPIResponse | null>(null)
  const [assetCore, setAssetCore] = useState<AssetCore | null>(null)
  const [fetchingStatus, setFetchingStatus] = useState<FetchingStatus>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<'canister' | 'server'>('canister')
  const location = useLocation()
  const navigate = useNavigate()
  const [uuid, setUuid] = useState<string>('')
  const [locale] = useState<'en' | 'it'>('it')

  const translations = locale === 'en' ? en : it

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      const currentPath = location.pathname

      if (currentPath === '/mock-sandbox') {
        try {
          // Use the class method to directly parse the mock JSON.
          const mappedMockData = DataStructure.fromJSON(mockEquipmentData as never)
          setData(mappedMockData)
          setUuid('mock-sandbox')
        } catch (err) {
          console.error('Error loading or processing mock data:', err)
          setError(err instanceof Error ? err.message : 'Failed to load mock data')
          setData(null)
        } finally {
          setIsLoading(false)
        }
        return
      }

      const pathParts = currentPath.split('/')
      const uuid = pathParts[2] || ''

      if (!uuid) {
        setError('No project ID found in URL for data loading.')
        setData(null)
        setUuid('')
        setIsLoading(false)
        return
      }

      setUuid(uuid)

      try {
        // Determine which provider to use based on asset availability and status
        const determinedProvider = await determineProvider(uuid).catch(() => 'canister' as const)
        setProvider(determinedProvider)
        console.log(`Using ${determinedProvider} service for UUID: ${uuid}`)

        // Use the appropriate service based on provider
        const service = determinedProvider === 'canister' ? canisterService : serverService

        setFetchingStatus('project')
        const projectResult = await service.getProjectByUuid(uuid).catch(err => {
          console.error('Failed to fetch project, proceeding without it.', err)
          return null
        })
        if (projectResult) {
          setProject(projectResult)
          // Add project to history
          historyService.addProject(uuid, projectResult.info.identification, projectResult.info.subIdentification)
        }

        setFetchingStatus('data')
        const dataResult = await fetchData(uuid, translations, determinedProvider).catch(() => null)
        if (dataResult) {
          setData(dataResult)
          // Add UUID to history
          historyService.addUUID(uuid, dataResult.info?.identification, dataResult.info?.subIdentification)
        } else if (projectResult) {
          navigate(`/linking/${uuid}`)
        }

        const assetCoreResult = await service.getAssetCore(uuid).catch(() => null)
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
        setData(null) // Ensure data is null on error
      } finally {
        setIsLoading(false)
        setFetchingStatus('completed')
      }
    }

    loadData()
  }, [location.pathname, translations, navigate])

  const reloadData = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData(uuid, translations, provider)
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

  return (
    <DataContext.Provider
      value={{
        data: data ?? null,
        project,
        assetCore,
        fetchingStatus,
        isLoading,
        error,
        uuid,
        getWizardQuestions,
        reloadData,
        provider
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
