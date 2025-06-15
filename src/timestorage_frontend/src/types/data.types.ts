/**
 * DataNode represents either a "data" section or a "wizard" section,
 * with children for data, or questions for a wizard.
 */
export interface IDataNode {
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
    questions?: IWizardQuestion[]
    showImages?: boolean
    isWizard?: boolean
}


/** WizardQuestion is used only in wizard sections */
export interface IWizardQuestion {
    id: string
    type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto'
    question: string
    options?: string[]
    // You can include refId or other fields from your schema if you need them:
    refId?: string
}

export interface IDataStructure {
    [key: string]: IDataNode
}

/**
 * Our DataContextType holds the data structure, loading/error states,
 * plus helper methods to reload data or get wizard questions.
 */
export interface IDataContextType {
    data: IDataStructure | null
    isLoading: boolean
    error: string | null
    projectId: string
    reloadData: () => Promise<void>
    getWizardQuestions: (sectionId: string) => Promise<IWizardQuestion[]>
}



export class DataNode implements IDataNode {
    id: string
    title: string
    icon: string
    description: string
    children?: {
        icon: string
        label: string
        value: string
        fileType?: string
        path?: string
    }[]
    questions?: IWizardQuestion[]

    constructor(id: string, title: string, icon: string, description: string, children?: {
        icon: string
        label: string
        value: string
        fileType?: string
        path?: string
    }[], questions?: IWizardQuestion[]) {
        this.id = id
        this.title = title
        this.icon = icon
        this.description = description
        this.children = children
        this.questions = questions
    }

    get showImages(): boolean {
        return this.showImages
    }

    get isWizard(): boolean {
        return this.isWizard
    }

    static fromJSON(json: unknown): DataNode {
        return new DataNode((json as { id: string }).id, (json as { title: string }).title, (json as { icon: string }).icon, (json as { description: string }).description, (json as { children: { icon: string; label: string; value: string; fileType?: string; path?: string }[] }).children, (json as { questions: IWizardQuestion[] }).questions)
    }

    applyValues(values: Record<string, string>) {
        if (this.children) {
            this.children.forEach(child => {
                if (child.path) {
                    child.value = values[child.path]
                }
            })
        }
    }

}

export class DataNodes {
    [key: string]: DataNode

    constructor(data: { [key: string]: DataNode }) {
        Object.assign(this, data)
    }

    static fromJSON(json: unknown): DataNodes {
        return new DataNodes((json as { data: { [key: string]: DataNode } }).data)
    }
}

export class DataStructure {
    data: DataNodes
    values?: Record<string, string>

    constructor(data: DataNodes, values?: Record<string, string>) {
        this.data = data
        this.values = values
    }

    static fromJSON(json: unknown): DataStructure {
        return new DataStructure((json as { data: DataNodes }).data, (json as { values: Record<string, string> }).values)
    }



}
