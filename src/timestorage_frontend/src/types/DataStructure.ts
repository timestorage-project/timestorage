import { DataNode } from "./DataNode"
import { IInfo, ILinkedStructure } from "./structures"
import { IRawDataStructureApiResponse } from "./structures"

/**
 * A container for the entire data structure, holding all DataNode instances.
 * This class is the main entry point for parsing the complete API response.
 */
export class DataStructure {
    uuid: string
    projectUuid: string | undefined
    info: IInfo
    linkedStructures?: ILinkedStructure[]
    nodes: { [key: string]: DataNode }

    constructor(uuid: string, nodes: { [key: string]: DataNode }, info: IInfo, linkedStructures?: ILinkedStructure[], projectUuid?: string) {
        this.uuid = uuid
        this.info = info
        this.linkedStructures = linkedStructures
        this.nodes = nodes
        this.projectUuid = projectUuid
    }


    getIdentifier(): string {
        return this.info.identification || this.uuid
    }

    getIssuer(): string | undefined {
        return this.info.issuer?.name
    }

    getIssuerEmail(): string | undefined {
        return this.info.issuer?.email
    }

    getIssuerPhone(): string | undefined {
        return this.info.issuer?.phone
    }

    getIssuerWebsite(): string | undefined {
        return this.info.issuer?.website
    }

    getIssuerPrincipal(): string | undefined {
        return this.info.issuer?.principal
    }

    getCreatedAt(): string | undefined {
        return this.info.createdAt
    }



    /**
     * Creates a DataStructure instance from a raw API response object.
     * @param apiResponse The complete raw JSON object from the API, containing `data` and `values`.
     * @returns A new instance of DataStructure containing populated DataNodes.
     */
    static fromJSON(apiResponse: IRawDataStructureApiResponse): DataStructure {

        const defaultInfo: IInfo = {
            version: "0.1",
            createdAt: "" + new Date().getTime()
        }

        const nodes: { [key: string]: DataNode } = {}
        const { data = {}, values = {} } = apiResponse

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                nodes[key] = DataNode.fromJSON(data[key], values)
            }
        }

        return new DataStructure(apiResponse.uuid, nodes, apiResponse.info || defaultInfo, apiResponse.linkedStructures, apiResponse.projectUuid)
    }
}
