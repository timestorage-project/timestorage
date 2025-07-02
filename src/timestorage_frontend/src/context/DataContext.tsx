import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import { en } from '@/lang/en'
import mockEquipmentData from '../mocks/mock-equipment.json'
import { it } from '@/lang/it'
import { FetchingStatus, IWizardQuestion } from '@/types/structures'
import { DataStructure } from '@/types/DataStructure'

// Use the transformed project type from canisterService
type TransformedProjectAPIResponse = Awaited<ReturnType<typeof canisterService.getProject>>

// Updated DataContextType to use transformed types
interface IDataContextType {
  uuid: string
  data: DataStructure | null
  project: TransformedProjectAPIResponse | null
  fetchingStatus: FetchingStatus
  isLoading: boolean
  error: string | null
  reloadData: () => Promise<void>
  getWizardQuestions: (sectionId: string) => Promise<IWizardQuestion[]>
}

const DataContext = createContext<IDataContextType | undefined>(undefined)

/**
 * ---------------------------------------------------------
 * 1) Fetch function that calls your canister or backend
 * ---------------------------------------------------------
 * This now returns a DataStructure instance directly.
 */
async function fetchData(uuid: string, translations: { [key: string]: string }): Promise<DataStructure> {
  try {
    const [schemaText, valuesAndLockJson] = await canisterService.getUUIDInfo(uuid)

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
    console.error('Error fetching data from API:', err)
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
  const [fetchingStatus, setFetchingStatus] = useState<FetchingStatus>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        setFetchingStatus('project')
        const projectResult = await canisterService.getProjectByUuid(uuid).catch(err => {
          console.error('Failed to fetch project, proceeding without it.', err)
          return null
        })
        if (projectResult) {
          setProject(projectResult)
        }

        setFetchingStatus('data')
        const dataResult = await fetchData(uuid, translations).catch(() => null)
        if (dataResult) {
          setData(dataResult)
        } else if (projectResult) {
          navigate(`/linking/${uuid}`)
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
      const result = await fetchData(uuid, translations)
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
        fetchingStatus,
        isLoading,
        error,
        uuid,
        getWizardQuestions,
        reloadData
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
