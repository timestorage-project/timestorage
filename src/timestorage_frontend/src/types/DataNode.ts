import { IRawDataNode, IWizardQuestion } from "./structures"

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