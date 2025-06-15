// DataContext.tsx

import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import * as canisterService from '../services/canisterService'
import { en } from '@/lang/en'
import mockEquipmentData from '../mocks/mock-equipment.json'
import { it } from '@/lang/it'
// Import the new classes and interfaces
import { IDataContextType, IWizardQuestion, DataStructure } from '@/types/data.types'

const DataContext = createContext<IDataContextType | undefined>(undefined)

// All mapping functions (`getValueFromPath`, `mapSectionToDataNode`, `mapApiResponseToDataStructure`)
// have been removed, as their logic is now encapsulated within the DataNode and DataStructure classes.

/**
 * ---------------------------------------------------------
 * 1) Fetch function that calls your canister or backend
 * ---------------------------------------------------------
 * This now returns a DataStructure instance directly.
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const [projectId, setProjectId] = useState<string>('')
  const [locale] = useState<'en' | 'it'>('it')

  const translations = locale === 'en' ? en : it

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const currentPath = location.pathname

      if (currentPath === '/mock-sandbox') {
        try {
          // Use the class method to directly parse the mock JSON.
          const mappedMockData = DataStructure.fromJSON(mockEquipmentData as never)
          setData(mappedMockData)
          setProjectId('mock-sandbox')
          setError(null)
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
      const newProjectIdFromPath = pathParts[1] || ''

      if (!newProjectIdFromPath) {
        setError('No project ID found in URL for data loading.')
        setData(null)
        setProjectId('')
        setIsLoading(false)
        return
      }

      setProjectId(newProjectIdFromPath)

      try {
        // fetchData now returns a DataStructure instance
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
  }, [location.pathname, translations])

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

  const getWizardQuestions = async (sectionId: string): Promise<IWizardQuestion[]> => {
    // Access the nodes dictionary within the data object
    if (!data?.nodes) return []
    const wizardNode = data.nodes[sectionId]
    if (!wizardNode?.isWizard || !wizardNode?.questions) return []
    return wizardNode.questions
  }

  return (
    <DataContext.Provider
      value={{
        // We provide `data.nodes` to the context so consumers can still do `data['someId']`
        data: data?.nodes ?? null,
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
