import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface DataNode {
  id: string
  title: string
  icon: string
  description: string
  children?: {
    icon: string
    label: string
    value: string
  }[]
  showImages?: boolean
  isWizard?: boolean
}

interface DataStructure {
  productInfo: DataNode
  installationProcess: DataNode
  maintenanceLog: DataNode
  startInstallation: DataNode
}

interface DataContextType {
  data: DataStructure | null
  isLoading: boolean
  error: string | null
  projectId: string
}

export interface WizardQuestion {
  id: string
  type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto'
  question: string
  options?: string[]
}

interface DataContextType {
  data: DataStructure | null
  isLoading: boolean
  error: string | null
  projectId: string
  reloadData: () => Promise<void>
  getWizardQuestions: () => Promise<WizardQuestion[]>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const mockData: DataStructure = {
  productInfo: {
    id: 'product-info',
    title: 'Product Info',
    icon: 'info',
    description: 'Dimensions, model number, material type, glass type, energy rating',
    children: [
      { icon: '📏', label: 'Dimensions', value: '120cm x 150cm' },
      { icon: '🔢', label: 'Model Number', value: 'WX12345' },
      { icon: '🏗️', label: 'Material Type', value: 'Aluminum' },
      { icon: '🪟', label: 'Glass Type', value: 'Tempered' },
      { icon: '⚡', label: 'Energy Rating', value: 'A+' },
      { icon: '📅', label: 'Manufacturing Date', value: '2023-01-15' },
      { icon: '🔢', label: 'Serial Number', value: 'SN123456789' },
      { icon: '📋', label: 'Installation Status', value: 'Pending' }
    ],
    showImages: true
  },
  installationProcess: {
    id: 'installation-process',
    title: 'Installation Process',
    icon: 'download',
    description: 'Form for tracking installation process',
    children: [
      { icon: '📅', label: 'Scheduled Date', value: '2024-02-20' },
      { icon: '👤', label: 'Installer', value: 'John Smith' },
      { icon: '⏱️', label: 'Duration', value: '4 hours' },
      { icon: '📋', label: 'Status', value: 'Scheduled' },
      { icon: '🔧', label: 'Tools Required', value: 'Standard Kit' }
    ]
  },
  maintenanceLog: {
    id: 'maintenance-log',
    title: 'Maintenance Log',
    icon: 'build',
    description: 'Log of all maintenance activities',
    children: [
      { icon: '🔧', label: 'Last Service', value: '2023-12-15' },
      { icon: '📝', label: 'Service Type', value: 'Regular Maintenance' },
      { icon: '👤', label: 'Technician', value: 'Mike Johnson' },
      { icon: '📅', label: 'Next Service Due', value: '2024-06-15' }
    ]
  },
  startInstallation: {
    id: 'wizard',
    title: 'Start Installation',
    icon: 'build',
    description: 'Begin the installation process',
    children: [],
    isWizard: true // Add this flag to identify the wizard
  }
}

const mockWizardQuestions: WizardQuestion[] = [
  {
    id: 'installer_name',
    type: 'text',
    question: 'What is your name?'
  },
  {
    id: 'window_type',
    type: 'select',
    question: 'What type of window are you installing?',
    options: ['Single Hung', 'Double Hung', 'Casement', 'Sliding']
  },
  {
    id: 'tools_needed',
    type: 'multiselect',
    question: 'Which tools will you need? (Select all that apply)',
    options: ['Drill', 'Level', 'Tape Measure', 'Screwdriver', 'Caulk Gun']
  },
  {
    id: 'installation_notes',
    type: 'text',
    question: 'Any additional notes about the installation?'
  },
  {
    id: 'window_photo',
    type: 'photo',
    question: 'Please take a photo of the window installation area'
  },
  {
    id: 'installation_photos',
    type: 'multiphoto',
    question: 'Take photos of any potential obstacles or concerns'
  }
]

async function fetchData(projectId: string): Promise<DataStructure> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  // In a real application, you would fetch from an API here
  return mockData
}

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DataStructure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const [projectId, setProjectId] = useState<string>('dummy')
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (dataLoaded) {
        const pathParts = location.pathname.split('/')
        const newProjectId = pathParts[1] || 'dummy'
        setProjectId(newProjectId)
        return
      }
      try {
        setIsLoading(true)
        // Extract project ID from URL path
        const pathParts = location.pathname.split('/')
        const newProjectId = pathParts[1] || 'dummy'
        setProjectId(newProjectId)

        const result = await fetchData(newProjectId)
        setData(result)
        setError(null)
        setDataLoaded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [location.pathname, dataLoaded])

  const reloadData = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData(projectId)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getWizardQuestions = async (): Promise<WizardQuestion[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockWizardQuestions
  }

  return (
    <DataContext.Provider value={{ data, isLoading, error, projectId, getWizardQuestions, reloadData }}>
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
