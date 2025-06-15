import {
    IRawDataStructureApiResponse,
    IProject,
    IProjectInfo,
    IProjectStatus,
    IRemoteDocument,
    IProjectPlacements,
    IProjectLinkedinStrcuture
} from './structures' // Assuming all interfaces are in this file

/**
 * The Project class is the main data container for the application.
 * It represents a single project, encapsulating its information, documents,
 * linked structures, and the detailed data nodes (via DataStructure).
 *
 * It is designed to be instantiated from a raw API response.
 */
export class Project implements IProject {
    uuid: string
    status: IProjectStatus
    info: IProjectInfo
    documents?: IRemoteDocument[]
    placements?: IProjectPlacements[]
    linkedStructures?: IProjectLinkedinStrcuture[]

    constructor(
        uuid: string,
        status: IProjectStatus,
        info: IProjectInfo,
        documents?: IRemoteDocument[],
        placements?: IProjectPlacements[],
        linkedStructures?: IProjectLinkedinStrcuture[]
    ) {
        this.uuid = uuid
        this.status = status
        this.info = info
        this.documents = documents
        this.placements = placements
        this.linkedStructures = linkedStructures
    }

    /**
     * Creates a fully initialized Project instance from a raw API response.
     * This factory method handles the transformation of raw data into structured objects.
     *
     * @param rawResponse The raw JSON object from the API, conforming to IRawDataStructureApiResponse.
     * @returns A new instance of the Project class.
     */
    static fromJSON(rawResponse: IRawDataStructureApiResponse): Project {
        // 1. Transform IInfo from the API into IProjectInfo for our class.
        // In this case, IProjectInfo is a superset of IInfo, so we can spread the properties.
        const projectInfo: IProjectInfo = {
            ...rawResponse.info,
            // location and other IProjectInfo-specific fields will be undefined if not in rawResponse.info
        }

        // 3. Transform ILinkedStructure[] into IProjectLinkedinStrcuture[].
        // The raw response has a simpler structure, so we map it to the more detailed project structure,
        // initializing missing fields with default empty values.
        const linkedStructures = (rawResponse.linkedStructures || []).map((link): IProjectLinkedinStrcuture => ({
            uuid: link.uuid,
            info: link.info,
            // These properties are part of IProjectLinkedinStrcuture but not ILinkedStructure,
            // so we initialize them.
            placementUuid: '', // Default to an empty string as per the interface
            documents: []      // Default to an empty array
        }))

        // 4. Instantiate the Project with all the processed data.
        // Properties not present in the raw response (like status, documents, placements)
        // are given default values.
        return new Project(
            rawResponse.uuid,
            'draft', // Default status for a newly loaded project
            projectInfo,
            [], // `documents` are not in the raw response, initialize as empty.
            [], // `placements` are not in the raw response, initialize as empty.
            linkedStructures
        )
    }
}