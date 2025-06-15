export interface IWizardQuestion {
    id: string
    type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto'
    question: string
    options?: string[]
    refId?: string
}

interface IRawDataNodeChild {
    icon: string
    label: string
    value: string
    fileType?: string
}

interface IRawDataNode {
    id: string
    title: string
    icon: string
    description: string
    type: 'data' | 'wizard'
    children?: IRawDataNodeChild[]
    questions?: IWizardQuestion[]
}

interface IRawApiResponse {
    data: { [key: string]: IRawDataNode }
    values?: Record<string, unknown>
}


/**
 * Represents a "data" or "wizard" section with its own properties and children.
 * It encapsulates the logic for populating its values from a raw data source.
 */
export class DataNode {
    id: string
    title: string
    icon: string
    description: string
    isWizard: boolean

    children?: {
        icon: string;
        label: string;
        value: string; // This will hold the resolved value
        fileType?: string;
        path?: string; // We still store the original path for reference
    }[]

    questions?: IWizardQuestion[]

    constructor(
        id: string,
        title: string,
        icon: string,
        description: string,
        isWizard: boolean
    ) {
        this.id = id
        this.title = title
        this.icon = icon
        this.description = description
        this.isWizard = isWizard
    }

    get showImages(): boolean {
        return this.children?.some(child => child.fileType === 'image') || false
    }

    /**
     * A private helper to resolve a value path from the `values` object.
     * This logic was moved from the DataContext's `getValueFromPath` function.
     */
    private static _resolveValueFromPath(values: Record<string, unknown>, path: string): string {
        if (!path.startsWith('#/values/')) {
            return path // Not a path, return as is
        }

        const cleanPath = path.replace('#/values/', '')

        const potentialKeys = [
            cleanPath,
            cleanPath.replace(/\//g, '.'),
        ]

        for (const key of potentialKeys) {
            if (values[key] !== undefined && values[key] !== null) {
                return String(values[key])
            }
            const lowerKey = key.toLowerCase()
            if (values[lowerKey] !== undefined && values[lowerKey] !== null) {
                return String(values[lowerKey])
            }
        }

        return '-'
    }

    /**
     * Creates a fully initialized DataNode instance from raw JSON data.
     * @param nodeJson The raw JSON object for a single section (e.g., productInfo).
     * @param allValues The complete 'values' object from the API response.
     * @returns A new instance of DataNode.
     */
    static fromJSON(nodeJson: IRawDataNode, allValues: Record<string, unknown> = {}): DataNode {
        const isWizard = nodeJson.type === 'wizard'
        const instance = new DataNode(
            nodeJson.id,
            nodeJson.title,
            nodeJson.icon,
            nodeJson.description,
            isWizard
        )

        if (isWizard) {
            instance.questions = nodeJson.questions || []
        } else {
            instance.children = (nodeJson.children || []).map(child => {
                const isValuePath = child.value.startsWith('#/values/')
                return {
                    icon: child.icon,
                    label: child.label,
                    value: DataNode._resolveValueFromPath(allValues, child.value),
                    fileType: child.fileType,
                    path: isValuePath ? child.value : undefined,
                }
            })
        }

        return instance
    }
}


/**
 * A container for the entire data structure, holding all DataNode instances.
 * This class is the main entry point for parsing the complete API response.
 */
export class DataStructure {
    nodes: { [key: string]: DataNode }

    constructor(nodes: { [key: string]: DataNode }) {
        this.nodes = nodes
    }

    /**
     * Creates a DataStructure instance from a raw API response object.
     * @param apiResponse The complete raw JSON object from the API, containing `data` and `values`.
     * @returns A new instance of DataStructure containing populated DataNodes.
     */
    static fromJSON(apiResponse: IRawApiResponse): DataStructure {
        const nodes: { [key: string]: DataNode } = {}
        const { data = {}, values = {} } = apiResponse

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                nodes[key] = DataNode.fromJSON(data[key], values)
            }
        }

        return new DataStructure(nodes)
    }
}


/**
 * Our DataContextType holds the data structure, loading/error states,
 * plus helper methods. Note that `data` is now `DataStructure | null`.
 */
export interface IDataContextType {
    // The data property now holds the dictionary of DataNode objects
    data: { [key: string]: DataNode } | null
    isLoading: boolean
    error: string | null
    projectId: string
    reloadData: () => Promise<void>
    getWizardQuestions: (sectionId: string) => Promise<IWizardQuestion[]>
}