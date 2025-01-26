import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import { en } from '@/lang/en'
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
  productInfo: DataNode
  installationProcess: DataNode
  maintenanceLog: DataNode
  startInstallation: DataNode
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
  getWizardQuestions: () => Promise<WizardQuestion[]>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

/**
 * Helper function to retrieve value from the values object
 */
function getValueFromPath(values: Record<string, string>, path: string): string {
  // Remove the #/values/ prefix if present
  const cleanPath = path.replace('#/values/', '')

  // Try with forward slash
  if (values[cleanPath] !== undefined) {
    return values[cleanPath]
  }

  // Try with dot notation
  const dotPath = cleanPath.replace('/', '.')
  if (values[dotPath] !== undefined) {
    return values[dotPath]
  }

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
      : children.map((child: { icon: string; value: string; label: string }) => ({
          icon: child.icon,
          label: child.label,
          value: child.value.startsWith('#/values/') ? getValueFromPath(values, child.value) : child.value
        })),
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

  return {
    productInfo: mapSectionToDataNode(data.productInfo, values),
    installationProcess: mapSectionToDataNode(data.installationProcess, values),
    maintenanceLog: mapSectionToDataNode(data.maintenanceLog, values),
    startInstallation: mapSectionToDataNode(data.startInstallation, values)
  }
}

/**
 * ---------------------------------------------------------
 * 3) Fetch function that calls your canister or backend
 * ---------------------------------------------------------
 * This must return the new JSON that includes { schema, data }.
 */
async function fetchData(projectId: string, translations: { [key: string]: string }): Promise<DataStructure> {
  try {
    const [response] = await canisterService.getUUIDInfo(projectId)
    let copied = response
    for (const localeKey in translations) {
      if (translations.hasOwnProperty(localeKey)) {
        const regex = new RegExp(localeKey, 'g')
        copied = copied.replace(regex, translations[localeKey])
      }
    }
    return mapApiResponseToDataStructure(JSON.parse(copied))
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
  const [projectId, setProjectId] = useState<string>('uuid-dummy')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [locale] = useState<'en' | 'it'>('en') // Default to English

  const translations = locale === 'en' ? en : it

  useEffect(() => {
    const loadData = async () => {
      // If we already loaded data once, just update the projectId from the path:
      if (dataLoaded) {
        const pathParts = location.pathname.split('/')
        const newProjectId = pathParts[1] || ''
        setProjectId(newProjectId)
        return
      }

      try {
        setIsLoading(true)
        const pathParts = location.pathname.split('/')
        const newProjectId = pathParts[1] || ''
        if (!newProjectId) {
          setError('No project ID provided')
          return
        }
        setProjectId(newProjectId)

        const result = await fetchData(newProjectId, translations)
        setData(result)
        setDataLoaded(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [location.pathname, dataLoaded, translations])

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
  const getWizardQuestions = async (): Promise<WizardQuestion[]> => {
    // In a real scenario, you might do more logic here,
    // or even store them in the context after fetchData.
    if (!data) return []
    // For this example, we'll assume "startInstallation" is the wizard section.
    const wizardNode = data.startInstallation
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
