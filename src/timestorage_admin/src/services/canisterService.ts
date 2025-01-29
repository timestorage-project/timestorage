import { Actor, HttpAgent } from '@dfinity/agent';
import { DataNode, DataStructure } from 'src/entities/icp';
import { idlFactory } from 'src/icp-definitions';
import { TimestorageBackend } from 'src/icp-definitions/timestorage_backend.did';
import { authService } from 'src/sections/auth/auth';

let agent: HttpAgent;
let timestorageActor: TimestorageBackend;

const appCanisterId: string = process.env.CANISTER_ID_TIMESTORAGE_FRONTEND || 'asd';

export const getAppFrontendCanisterId = (): string => {
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic';
  if (isLocalEnv) {
    return `http://${appCanisterId}.localhost:4943`;
  }
  return `https://${appCanisterId}.icp0.io`;
};

const initializeAgent = async () => {
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic';
  const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app';
  // Get the current identity from auth service

  if (!agent) {
    if (isLocalEnv) {
      // For local development, use a new agent without identity
      agent = new HttpAgent({ host });
      await agent.fetchRootKey(); // This is only needed for local development
    } else {
      // For production IC network, use authenticated identity
      const identity = authService.getIdentity();
      agent = new HttpAgent({
        host,
        identity: identity || undefined,
      });
    }
  }

  if (!timestorageActor) {
    timestorageActor = Actor.createActor<TimestorageBackend>(idlFactory, {
      agent,
      canisterId: process.env.CANISTER_ID_TIMESTORAGE_BACKEND || 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
    });
  }

  return timestorageActor;
};

export const getUUIDInfo = async (uuid: string) => {
  const actor = await initializeAgent();
  const result = await actor.getUUIDInfo(uuid);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const updateValue = async (uuid: string, key: string, value: string) => {
  const actor = await initializeAgent();
  const result = await actor.updateValue({ uuid, key, newValue: value });

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const getImage = async (uuid: string, imageId: string) => {
  //   const actor = await initializeAgent()
  //   const result = await actor.getImageByUUIDAndId(uuid, imageId)
  console.log('Feature to build');

  //   if ('err' in result) {
  //     throw new Error(result.err)
  //   }

  return true;
};

export const uploadFile = async (
  uuid: string,
  fileData: string,
  metadata: {
    fileName: string;
    mimeType: string;
    uploadTimestamp: bigint;
  }
) => {
  const actor = await initializeAgent();
  const result = await actor.uploadFile(uuid, fileData, metadata);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const getFileByUUIDAndId = async (uuid: string, fileId: string) => {
  const actor = await initializeAgent();
  const result = await actor.getFileByUUIDAndId(uuid, fileId);

  if ('err' in result) {
    throw new Error(result.err);
  }

  const fileData = result.ok.metadata.fileData;
  const mimeType = result.ok.metadata.mimeType;

  // Convert back to displayable format by adding data URL prefix
  return `data:${mimeType};base64,${fileData}`;
};

export const getAllUUIDs = async () => {
  const actor = await initializeAgent();
  const result = await actor.getAllUUIDs();

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const getAllUUIDsWithInfo = async (translations: { [key: string]: string } = {}) => {
  const actor = await initializeAgent();

  // First get all UUIDs
  const uuidsResult = await actor.getAllUUIDs();
  if ('err' in uuidsResult) {
    throw new Error(uuidsResult.err);
  }

  // For each UUID, get its info
  const uuidsWithInfo = await Promise.all(
    uuidsResult.ok.map(async (uuid) => {
      const infoResult = await actor.getUUIDInfo(uuid);
      if ('err' in infoResult) {
        console.error(`Error fetching info for UUID ${uuid}:`, infoResult.err);
        return null;
      }

      const [jsonString] = infoResult.ok;

      // Apply translations if provided
      let processedJson = jsonString;
      Object.entries(translations).forEach(([localeKey, translation]) => {
        const regex = new RegExp(localeKey, 'g');
        processedJson = processedJson.replace(regex, translation);
      });

      try {
        const parsedData = JSON.parse(processedJson);
        return {
          uuid,
          data: mapApiResponseToDataStructure(parsedData),
        };
      } catch (err) {
        console.error(`Error parsing JSON for UUID ${uuid}:`, err);
        return null;
      }
    })
  );

  // Filter out any failed fetches
  return uuidsWithInfo.filter(
    (info): info is { uuid: string; data: DataStructure } => info !== null
  );
};

// Helper function copied from DataContext
export function mapApiResponseToDataStructure(response: {
  data: { [key: string]: unknown };
  values?: Record<string, string>;
}) {
  const { data, values = {} } = response;

  return {
    productInfo: mapSectionToDataNode(data.productInfo, values),
    installationProcess: mapSectionToDataNode(data.installationProcess, values),
    maintenanceLog: mapSectionToDataNode(data.maintenanceLog, values),
    startInstallation: mapSectionToDataNode(data.startInstallation, values),
  };
}

// Helper function copied from DataContext
export function mapSectionToDataNode(
  section: unknown,
  values: Record<string, string> = {}
): DataNode {
  const { id, title, icon, description, type, children = [], questions = [] } = section as any;

  const isWizard = type === 'wizard';

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
          value: child.value.startsWith('#/values/')
            ? getValueFromPath(values, child.value)
            : child.value,
        })),
    questions: isWizard
      ? questions.map(
          (q: {
            id: string;
            type: string;
            question: string;
            options: string[];
            refId: string;
          }) => ({
            id: q.id,
            type: q.type as 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto',
            question: q.question,
            options: q.options || [],
            refId: q.refId,
          })
        )
      : [],
    isWizard,
  };
}

// Helper function copied from DataContext
export function getValueFromPath(values: Record<string, string>, path: string): string {
  const cleanPath = path.replace('#/values/', '');

  if (values[cleanPath] !== undefined) {
    return values[cleanPath];
  }

  const dotPath = cleanPath.replace('/', '.');
  if (values[dotPath] !== undefined) {
    return values[dotPath];
  }

  return '-';
}

export const insertUUIDStructure = async (uuid: string, structure: string) => {
  const actor = await initializeAgent();
  const result = await actor.insertUUIDStructure(uuid, structure);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};
