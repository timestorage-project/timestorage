import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import { en } from '@/lang/en'
import mockEquipmentData from '../mocks/mock-equipment.json'
import { it } from '@/lang/it'

/**
 * DataNode represents either a "data" section or a "wizard" section,
 * with children for data, or questions for a wizard.
 */
interface DataNode {
  id: string
  title: string
  icon: string
  description: string
  /** Only used if this is a "data" section: */
  children?: {
    icon: string
    label: string
    value: string
    fileType?: string
    path?: string
  }[]
  /** Used if this is a "wizard" section: */
  questions?: WizardQuestion[]
  showImages?: boolean
  isWizard?: boolean
}

/**
 * You mentioned your UI uses these four sections, so we'll keep them.
 * Each key corresponds to a section in your data.
 */
interface DataStructure {
  [key: string]: DataNode
}

/** WizardQuestion is used only in wizard sections */
export interface WizardQuestion {
  id: string
  type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto'
  question: string
  options?: string[]
  // You can include refId or other fields from your schema if you need them:
  refId?: string
}

/**
 * Our DataContextType holds the data structure, loading/error states,
 * plus helper methods to reload data or get wizard questions.
 */
interface DataContextType {
  data: DataStructure | null
  isLoading: boolean
  error: string | null
  projectId: string
  reloadData: () => Promise<void>
  getWizardQuestions: (sectionId: string) => Promise<WizardQuestion[]>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

/**
 * Helper function to retrieve value from the values object
 */
function getValueFromPath(values: Record<string, string>, path: string): string {
  console.log('Looking up path:', path, 'in values:', values)

  // Remove the #/values/ prefix if present
  const cleanPath = path.replace('#/values/', '')

  // Try with forward slash converted to dot notation
  const dotPath = cleanPath.replace(/\//g, '.')

  // Try with camelCase converted to snake_case
  const snakePath = dotPath.replace(/([A-Z])/g, '_$1').toLowerCase()

  console.log('Cleaned paths to try:', { dotPath, snakePath })

  // Try all possible formats
  if (values[cleanPath] !== undefined) {
    console.log('Found with cleanPath:', cleanPath)
    return values[cleanPath]
  }

  if (values[dotPath] !== undefined) {
    console.log('Found with dotPath:', dotPath)
    return values[dotPath]
  }

  if (values[snakePath] !== undefined) {
    console.log('Found with snakePath:', snakePath)
    return values[snakePath]
  }

  // One more attempt - try lowercase version
  const lowerDotPath = dotPath.toLowerCase()
  if (values[lowerDotPath] !== undefined) {
    console.log('Found with lowerDotPath:', lowerDotPath)
    return values[lowerDotPath]
  }

  console.log('Value not found for path:', path)
  // Return default value if not found
  return '-'
}

/**
 * Utility to convert a "section" from the API into DataNode
 */
function mapSectionToDataNode(section: unknown, values: Record<string, string> = {}): DataNode {
  const { id, title, icon, description, type, children = [], questions = [] } = section as never

  const isWizard = type === 'wizard'

  return {
    id,
    title,
    icon,
    description,
    children: isWizard
      ? []
      : children.map((child: { icon: string; value: string; label: string; fileType?: string }) => {
          const originalPath = child.value.startsWith('#/values/') ? child.value : undefined

          return {
            icon: child.icon,
            label: child.label,
            value: originalPath ? getValueFromPath(values, originalPath) : child.value,
            fileType: child.fileType,
            path: originalPath // Store the original path
          }
        }),
    questions: isWizard
      ? questions.map((q: { id: string; type: string; question: string; options: string[]; refId: string }) => ({
          id: q.id,
          type: q.type as never,
          question: q.question,
          options: q.options || [],
          refId: q.refId
        }))
      : [],
    isWizard
  }
}

/**
 * ---------------------------------------------------------
 * 2) Convert the combined API response into DataStructure
 * ---------------------------------------------------------
 * The API response is assumed to be an object like:
 * {
 *   schema: { ... },
 *   data: {
 *     productInfo: { id, title, type, icon, children: [...], etc },
 *     installationProcess: { ... },
 *     maintenanceLog: { ... },
 *     startInstallation: { ... }
 *   }
 * }
 */
function mapApiResponseToDataStructure(response: {
  data: { [key: string]: unknown }
  values?: Record<string, string>
}): DataStructure {
  const { data, values = {} } = response
  console.log('Data received', response)

  const result: DataStructure = {}

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = mapSectionToDataNode(data[key], values)
    }
  }

  return result
}

/**
 * ---------------------------------------------------------
 * 3) Fetch function that calls your canister or backend
 * ---------------------------------------------------------
 * This must return the new JSON that includes { schema, data }.
 */
async function fetchData(projectId: string, translations: { [key: string]: string }): Promise<DataStructure> {
  try {
    const [schemaText, valuesAndLockJson] = await canisterService.getUUIDInfo(projectId)

    // Parse the JSON strings first
    const schemaData = JSON.parse(schemaText)
    const valuesAndLock = JSON.parse(valuesAndLockJson)

    // Combine the data
    const combinedData = {
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

    return mapApiResponseToDataStructure(translatedData)
  } catch (err) {
    console.error('Error fetching data from API:', err)
    throw err
  }
}

/**
 * ---------------------------------------------------------
 * 4) DataProvider & useData Hook
 * ---------------------------------------------------------
 */
interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DataStructure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const [projectId, setProjectId] = useState<string>('')
  const [locale] = useState<'en' | 'it'>('it') // Default to Italian

  const translations = locale === 'en' ? en : it

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const currentPath = location.pathname

      if (currentPath === '/mock-sandbox') {
        try {
          // Assuming mockEquipmentData has { data: ..., values: ... } structure
          // The mapApiResponseToDataStructure expects an object with 'data' and optionally 'values' keys.
          const mappedMockData = mapApiResponseToDataStructure({
            data: mockEquipmentData.data as { [key: string]: unknown }, // Cast to satisfy mapApiResponseToDataStructure
            values: mockEquipmentData.values as Record<string, string> // Cast to satisfy mapApiResponseToDataStructure
          })
          setData(mappedMockData)
          setProjectId('mock-sandbox') // Set a specific ID for the mock dashboard
          setError(null)
        } catch (err) {
          console.error('Error loading or processing mock data:', err)
          setError(err instanceof Error ? err.message : 'Failed to load mock data')
          setData(null)
        } finally {
          setIsLoading(false)
        }
        return // Exit early after handling mock data
      }

      // Handle non-mock routes
      const pathParts = currentPath.split('/')
      const newProjectIdFromPath = pathParts[1] || '' // projectId is typically the first part after '/'

      if (!newProjectIdFromPath) {
        // This handles cases where projectId might be missing for routes that expect one.
        // Based on App.tsx, Dashboard component should always get a projectId or be on /mock-sandbox.
        setError('No project ID found in URL for data loading.')
        setData(null)
        setProjectId('') // Clear current projectId
        setIsLoading(false)
        return
      }

      // If we are here, it's a non-mock route with a newProjectIdFromPath.
      // Update projectId state. This is important for the context value.
      setProjectId(newProjectIdFromPath)

      try {
        const result = await fetchData(newProjectIdFromPath, translations)
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [location.pathname, translations]) // Dependencies: re-run if path or translations change

  /**
   * Allows us to refetch data on demand (e.g., after a form submission).
   */
  const reloadData = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData(projectId, translations)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Dynamically returns wizard questions from the "startInstallation" node
   * (or any node that might be a wizard, if you prefer to generalize).
   */
  const getWizardQuestions = async (sectionId: string): Promise<WizardQuestion[]> => {
    if (!data) return []
    const wizardNode = data[sectionId]
    if (!wizardNode?.isWizard || !wizardNode?.questions) return []
    return wizardNode.questions
  }

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        error,
        projectId,
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
