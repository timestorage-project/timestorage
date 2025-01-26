import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

const II_URL = 'https://identity.ic0.app';

export class AuthService {
  
  public authClient: AuthClient | null = null;

  private identity: Principal | null = null;

  async init() {
    this.authClient = await AuthClient.create();

    // For local development, consider the user always authenticated
    if (process.env.DFX_NETWORK !== 'ic') {
      return;
    }

    // Check if there's an existing session for production
    if (await this.authClient.isAuthenticated()) {
      const identity = this.authClient.getIdentity();
      this.identity = identity.getPrincipal();
    }
  }

  async login(): Promise<Principal | null> {
    // For local development, return a mock principal
    if (process.env.DFX_NETWORK !== 'ic') {
      return Principal.anonymous();
    }

    if (!this.authClient) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.authClient?.login({
        identityProvider: II_URL,
        onSuccess: async () => {
          const identity = this.authClient?.getIdentity();
          if (identity) {
            this.identity = identity.getPrincipal();
            resolve(this.identity);
          } else {
            reject(new Error('Failed to get identity'));
          }
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  }

  async logout(): Promise<void> {
    if (process.env.DFX_NETWORK !== 'ic') {
      return;
    }

    if (this.authClient) {
      await this.authClient.logout();
      this.identity = null;
    }
  }

  async getPrincipal(): Promise<Principal | null> {
    // For local development, return anonymous principal
    if (process.env.DFX_NETWORK !== 'ic') {
      return Principal.anonymous();
    }

    if (!this.authClient) {
      await this.init();
    }

    if (!this.identity) {
      const identity = this.authClient?.getIdentity();
      this.identity = identity ? identity.getPrincipal() : null;
    }

    return this.identity;
  }

  getIdentity() {
    if (process.env.DFX_NETWORK !== 'ic') {
      return undefined; // For local development, let the agent use anonymous identity
    }
    return this.authClient?.getIdentity();
  }
}

export const authService = new AuthService();
