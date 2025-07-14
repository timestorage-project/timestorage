// History Service for managing browser storage of visited projects and UUIDs

const HISTORY_KEY = 'timestorage_history'
const MAX_PROJECTS = 10
const MAX_UUIDS = 30

export interface HistoryItem {
  uuid: string
  timestamp: number
  type: 'project' | 'uuid'
  identification?: string
  subIdentification?: string
}

export interface HistoryData {
  projects: HistoryItem[]
  uuids: HistoryItem[]
}

class HistoryService {
  private getHistory(): HistoryData {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading history from localStorage:', error)
    }
    return { projects: [], uuids: [] }
  }

  private saveHistory(data: HistoryData): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving history to localStorage:', error)
    }
  }

  addProject(uuid: string, identification?: string, subIdentification?: string): void {
    const history = this.getHistory()
    
    // Remove existing entry if present
    history.projects = history.projects.filter(item => item.uuid !== uuid)
    
    // Add new entry at the beginning
    history.projects.unshift({
      uuid,
      timestamp: Date.now(),
      type: 'project',
      identification,
      subIdentification
    })
    
    // Keep only the most recent MAX_PROJECTS
    history.projects = history.projects.slice(0, MAX_PROJECTS)
    
    this.saveHistory(history)
  }

  addUUID(uuid: string, identification?: string, subIdentification?: string): void {
    const history = this.getHistory()
    
    // Remove existing entry if present
    history.uuids = history.uuids.filter(item => item.uuid !== uuid)
    
    // Add new entry at the beginning
    history.uuids.unshift({
      uuid,
      timestamp: Date.now(),
      type: 'uuid',
      identification,
      subIdentification
    })
    
    // Keep only the most recent MAX_UUIDS
    history.uuids = history.uuids.slice(0, MAX_UUIDS)
    
    this.saveHistory(history)
  }

  getProjects(): HistoryItem[] {
    const history = this.getHistory()
    return history.projects
  }

  getUUIDs(): HistoryItem[] {
    const history = this.getHistory()
    return history.uuids
  }

  clearHistory(): void {
    this.saveHistory({ projects: [], uuids: [] })
  }
}

export const historyService = new HistoryService()