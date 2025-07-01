

export interface IRemoteDocument {
    metadata: {
        fileData: string
        mimeType: string
        fileName: string
        uploadTimestamp: string
    }
    uuid: string
}

export interface IWizardQuestion {
    id: string
    type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto'
    question: string
    options?: string[]
    refId?: string
}

export interface IRawDataNodeChild {
    icon: string
    label: string
    value: string
    fileType?: string
}

export interface IRawDataNode {
    id: string
    title: string
    icon: string
    description: string
    type: 'data' | 'wizard'
    children?: IRawDataNodeChild[]
    questions?: IWizardQuestion[]
}

export type EVersion = {
    "0.1": '0.1',
    "1.0": '1.0'
}

export type EType = {
    "equipment": 'equipment',
}

export type ECategory = {
    "it_finestra": 'it_finestra',
    "it_portone": 'it_portone',
}

export interface IInfo {
    identification?: string
    subIdentification?: string
    type?: keyof EType
    category?: keyof ECategory

    modelUuid?: string
    modelVersion?: string

    issuer?: {
        identification?: string
        email?: string
        name?: string
        phone?: string
        website?: string
        principal?: string
    }
    version?: keyof EVersion
    createdAt?: string
}

export interface ILinkedStructureIdentifier {
    identification: string
    subIdentification?: string
    type?: keyof EType
    category?: keyof ECategory
}

export interface ILinkedStructure {
    uuid: string
    info: ILinkedStructureIdentifier
}

export interface IProjectInfo {
    identification?: string
    subIdentification?: string
    type?: keyof EType
    category?: keyof ECategory
    issuer?: {
        identification?: string
        email?: string
        name?: string
        phone?: string
        website?: string
        principal?: string
    }
    location?: {
        address?: string
        address2?: string
        unit?: string
        floor?: string
        room?: string
        city?: string
        state?: string
        zip?: string
        country?: string
    }
    version?: keyof EVersion
    createdAt?: string

}

export type IProjectStatus = "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled"


export interface IProjectLinkedinStrcuture {
    uuid: string;
    placementUuid: string;
    info: ILinkedStructureIdentifier
    documents?: IRemoteDocument[]
}

export interface IProjectPlacementDocumentToAssign {
    type: EType
    category: ECategory
    documentsToAssign?: IRemoteDocument[]
}

export interface IProjectPlacements {
    uuid: string;
    info: ILinkedStructureIdentifier
    documents?: IRemoteDocument[]
    documentsToAssign?: IProjectPlacementDocumentToAssign[]
}

export interface IProject {
    uuid: string
    status: IProjectStatus
    info: IProjectInfo
    documents?: IRemoteDocument[]
    placements?: IProjectPlacements[]
    linkedStructures?: IProjectLinkedinStrcuture[]
}

export interface IRawDataStructureApiResponse {
    uuid: string
    info: IInfo
    linkedStructures?: ILinkedStructure[]
    data: { [key: string]: IRawDataNode }
    values?: Record<string, unknown>
    projectUuid?: string
}

export type FetchingStatus = 'none' | 'project' | 'data' | 'completed'