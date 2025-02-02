import { useAuthStore } from 'src/store/auth.store';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

export class AuthService {
  private store = useAuthStore.getState();

  constructor() {
    // Initialize store reference
    this.store = useAuthStore.getState();
  }

  async init() {
    return this.store.init();
  }

  async login(): Promise<Principal | null> {
    return this.store.login();
  }

  async logout(): Promise<void> {
    return this.store.logout();
  }

  async getPrincipal(): Promise<Principal | null> {
    return this.store.getPrincipal();
  }

  getIdentity() {
    return this.store.getIdentity();
  }

  getCurrentPrincipalId(): string {
    return this.store.currentPrincipalId;
  }
}

export const authService = new AuthService();

// Re-export the store for direct usage
export { useAuthStore };
