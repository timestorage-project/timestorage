import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { DataNode, DataStructure } from 'src/entities/icp';
import { idlFactory } from 'src/icp-definitions';
import { TimestorageBackend } from 'src/icp-definitions/timestorage_backend.did';
import { authService, useAuthStore } from 'src/sections/auth/auth';

let agent: HttpAgent | undefined;
let timestorageActor: TimestorageBackend | undefined;
let currentIdentity: Identity | undefined;

const appCanisterId: string =
  process.env.CANISTER_ID_TIMESTORAGE_FRONTEND || 'rt5ct-7aaaa-aaaah-qp5ha-cai';
const devENV_Canister = 'bkyz2-fmaaa-aaaaa-qaaaq-cai';

const initializeAgent = async () => {
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic';
  const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app';

  try {
    // Get the current state from the auth store
    const store = useAuthStore.getState();
    const authClient = store.authClient;

    // If no auth client, initialize it
    if (!authClient) {
      await store.init();
    }

    // Get the updated auth client and check authentication
    const currentAuthClient = useAuthStore.getState().authClient;
    if (!currentAuthClient) {
      throw new Error('Auth client initialization failed');
    }

    const isAuthenticated = await currentAuthClient.isAuthenticated();

    // Get the identity
    const identity = isAuthenticated ? currentAuthClient.getIdentity() : undefined;
    const hasIdentityChanged = currentIdentity !== identity;

    if (!agent || hasIdentityChanged) {
      currentIdentity = identity;

      if (isLocalEnv) {
        agent = new HttpAgent({ host, identity });
        await agent.fetchRootKey();
      } else {
        agent = new HttpAgent({
          host,
          identity,
        });
      }

      // Reset timestorageActor when agent changes
      timestorageActor = undefined;
    }

    if (!timestorageActor) {
      timestorageActor = Actor.createActor<TimestorageBackend>(idlFactory, {
        agent,
        canisterId: (process.env.CANISTER_ID_TIMESTORAGE_BACKEND as string) || devENV_Canister,
      });

      console.log('Actor created with identity:', identity?.getPrincipal().toString());
    }

    return timestorageActor;
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw error;
  }
};

export const getFrontendCanisterId = () => appCanisterId;
export const getFrontendCanisterUrl = () =>
  process.env.DFX_NETWORK === 'ic'
    ? `https://${appCanisterId}.icp0.io`
    : `http://${appCanisterId}.localhost:4943`;

// Update the store subscription to handle auth client changes
useAuthStore.subscribe((state) => {
  if (state.authClient && state.isAuthenticated) {
    const identity = state.authClient.getIdentity();
    if (currentIdentity !== identity) {
      agent = undefined;
      timestorageActor = undefined;
      currentIdentity = identity;
    }
  } else {
    agent = undefined;
    timestorageActor = undefined;
    currentIdentity = undefined;
  }
});

const ensureAuthenticated = async () => {
  const store = useAuthStore.getState();
  if (!store.isAuthenticated) {
    throw new Error('User is not authenticated');
  }
};

export const getUUIDInfo = async (uuid: string) => {
  await ensureAuthenticated();
  const actor = await initializeAgent();
  const result = await actor.getUUIDInfo(uuid);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const updateValue = async (
  uuid: string,
  key: string,
  value: string,
  lock: boolean = false
) => {
  await ensureAuthenticated();
  const actor = await initializeAgent();
  const result = await actor.updateValue({ uuid, key, newValue: value });

  if ('err' in result) {
    throw new Error(result.err);
  }
  if (lock) {
    const lockResult = await actor.lockValue({
      uuid,
      key,
      lock: true,
    });

    if ('err' in lockResult) {
      throw new Error(lockResult.err);
    }
  }

  return result.ok;
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
  await ensureAuthenticated();
  const actor = await initializeAgent();
  const result = await actor.uploadFile(uuid, fileData, metadata);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const getFileByUUIDAndId = async (uuid: string, fileId: string) => {
  await ensureAuthenticated();
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
  await ensureAuthenticated();
  const actor = await initializeAgent();
  const result = await actor.getAllUUIDs();

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};

export const getAllUUIDsWithInfo = async (translations: { [key: string]: string } = {}) => {
  await ensureAuthenticated();
  const actor = await initializeAgent();

  const uuidsResult = await actor.getAllUUIDs();
  if ('err' in uuidsResult) {
    throw new Error(uuidsResult.err);
  }

  const uuidsWithInfo = await Promise.all(
    uuidsResult.ok.map(async (uuid) => {
      const infoResult = await actor.getUUIDInfo(uuid);
      if ('err' in infoResult) {
        console.error(`Error fetching info for UUID ${uuid}:`, infoResult.err);
        return null;
      }

      const [jsonString] = infoResult.ok;

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

  return uuidsWithInfo.filter(
    (info): info is { uuid: string; data: DataStructure } => info !== null
  );
};

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
  await ensureAuthenticated();
  const actor = await initializeAgent();
  const result = await actor.insertUUIDStructure(uuid, structure);

  if ('err' in result) {
    throw new Error(result.err);
  }

  return result.ok;
};
