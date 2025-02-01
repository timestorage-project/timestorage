import { create } from 'zustand';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

interface AuthState {
  authClient: AuthClient | null;
  identity: Principal | null;
  isAuthenticated: boolean;
  currentPrincipalId: string;
  init: () => Promise<void>;
  login: () => Promise<Principal | null>;
  logout: () => Promise<void>;
  getPrincipal: () => Promise<Principal | null>;
  getIdentity: () => any;
}

const II_URL = 'https://identity.ic0.app';
const days = BigInt(1);
const hours = BigInt(24);
const nanoseconds = BigInt(3600000000000);

const defaultOptions = {
  createOptions: {
    idleOptions: {
      disableIdle: true,
    },
  },
  loginOptions: {
    identityProvider:
      process.env.DFX_NETWORK === 'ic'
        ? 'https://identity.ic0.app/#authorize'
        : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943#authorize`,
    maxTimeToLive: days * hours * nanoseconds,
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  authClient: null,
  identity: null,
  isAuthenticated: false,
  currentPrincipalId: '-',

  init: async () => {
    const authClient = await AuthClient.create(defaultOptions.createOptions);
    set({ authClient });

    if (await authClient.isAuthenticated()) {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      set({
        identity: principal,
        isAuthenticated: true,
        currentPrincipalId: principal.toText(),
      });
    }
  },

  login: async () => {
    const { authClient } = get();
    if (!authClient) {
      await get().init();
    }

    return new Promise((resolve, reject) => {
      get().authClient?.login({
        identityProvider: defaultOptions.loginOptions.identityProvider,
        maxTimeToLive: defaultOptions.loginOptions.maxTimeToLive,
        onSuccess: async () => {
          const identity = get().authClient?.getIdentity();
          if (identity) {
            const principal = identity.getPrincipal();
            set({
              identity: principal,
              isAuthenticated: true,
              currentPrincipalId: principal.toText(),
            });
            resolve(principal);
          } else {
            reject(new Error('Failed to get identity'));
          }
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  },

  logout: async () => {
    const { authClient } = get();
    if (authClient) {
      await authClient.logout();
      set({
        identity: null,
        isAuthenticated: false,
        currentPrincipalId: '-',
      });
    }
  },

  getPrincipal: async () => {
    if (process.env.DFX_NETWORK !== 'ic') {
      return Principal.anonymous();
    }

    const { authClient, identity } = get();
    if (!authClient) {
      await get().init();
    }

    if (!identity) {
      const currentIdentity = get().authClient?.getIdentity();
      if (currentIdentity) {
        const principal = currentIdentity.getPrincipal();
        set({
          identity: principal,
          currentPrincipalId: principal.toText(),
        });
        return principal;
      }
      return null;
    }

    return identity;
  },

  getIdentity: () => {
    if (process.env.DFX_NETWORK !== 'ic') {
      return undefined;
    }
    return get().authClient?.getIdentity();
  },
}));
