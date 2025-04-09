import { create } from 'zustand'
import { Principal } from '@dfinity/principal'
import { Actor, HttpAgent, Identity, Signature } from '@dfinity/agent'
import { DelegationIdentity, DelegationChain, Ed25519KeyIdentity, Delegation } from '@dfinity/identity'
import { idlFactory as sessionManagerIdlFactory } from '@/timestorage_session_manager/timestorage_session_manager.did'
import { _SERVICE as SessionManagerService } from '@/timestorage_session_manager/timestorage_session_manager.did'

interface AuthState {
  sessionIdentity: Ed25519KeyIdentity | null
  delegationIdentity: DelegationIdentity | null
  isAuthenticated: boolean
  currentPrincipalId: string
  userSub: string | null
  init: () => Promise<void>
  login: (idToken: string) => Promise<Principal | null>
  logout: () => Promise<void>
  getIdentity: () => Identity | undefined
}

// Session manager canister ID from environment variables
const sessionManagerCanisterId =
  (process.env.CANISTER_ID_TIMESTORAGE_SESSION_MANAGER as string) || 'rrkah-fqaaa-aaaaa-aaaaq-cai'

// Create session manager actor
const createSessionManagerActor = (identity: Identity): SessionManagerService => {
  const isLocalEnv = process.env.DFX_NETWORK !== 'ic'
  const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app'

  const agent = new HttpAgent({
    host,
    identity
  })

  if (isLocalEnv) {
    agent.fetchRootKey().catch(err => {
      console.error('Failed to fetch root key:', err)
    })
  }

  return Actor.createActor<SessionManagerService>(sessionManagerIdlFactory, {
    agent,
    canisterId: sessionManagerCanisterId
  })
}

// Local storage key for persisting delegations
const DELEGATION_STORAGE_KEY = 'timestorage-delegation'

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionIdentity: null,
  delegationIdentity: null,
  isAuthenticated: false,
  currentPrincipalId: '',
  userSub: null,

  init: async () => {
    try {
      // Generate a new session identity if one doesn't exist
      const sessionIdentity = Ed25519KeyIdentity.generate()
      set({ sessionIdentity })

      // Try to load existing delegation from localStorage
      const storedDelegation = localStorage.getItem(DELEGATION_STORAGE_KEY)
      if (storedDelegation) {
        try {
          const chain = DelegationChain.fromJSON(JSON.parse(storedDelegation))
          // Check if the delegation is still valid
          if (
            chain.delegations.length > 0 &&
            chain.delegations[0].delegation.expiration > BigInt(Date.now()) * BigInt(1000000)
          ) {
            const delegationIdentity = DelegationIdentity.fromDelegation(sessionIdentity, chain)

            // Verify the identity by making a canister call
            const actor = createSessionManagerActor(delegationIdentity)
            const authResponse = await actor.authenticated()

            set({
              delegationIdentity,
              isAuthenticated: true,
              currentPrincipalId: delegationIdentity.getPrincipal().toText(),
              userSub: authResponse.user_sub
            })

            console.log('Restored authenticated session with principal:', delegationIdentity.getPrincipal().toText())
            return
          } else {
            // Clear invalid delegation
            localStorage.removeItem(DELEGATION_STORAGE_KEY)
          }
        } catch (error) {
          console.error('Error restoring delegation:', error)
          localStorage.removeItem(DELEGATION_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error initializing auth store:', error)
    }
  },

  login: async (idToken: string) => {
    try {
      const { sessionIdentity } = get()
      if (!sessionIdentity) {
        throw new Error('Session identity not initialized')
      }

      // Use the session identity to interact with the session manager canister
      const sessionActor = createSessionManagerActor(sessionIdentity)

      // Prepare delegation using the session manager canister
      const { user_key, expiration } = await sessionActor.prepare_delegation(idToken)

      // Get the delegation for the user's JWT
      const delegationResponse = await sessionActor.get_delegation(idToken, expiration)

      if ('no_such_delegation' in delegationResponse) {
        throw new Error('No delegation returned from canister')
      }

      const signedDelegation = delegationResponse.signed_delegation

      function toArrayBuffer(input: number[] | Uint8Array): ArrayBuffer {
        if (input instanceof Uint8Array) {
          return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer
        } else {
          // Convert number[] to Uint8Array first
          return new Uint8Array(input).buffer as ArrayBuffer
        }
      }

      // Create a delegation chain and delegation identity
      const delegationChain = DelegationChain.fromDelegations(
        [
          {
            delegation: new Delegation(
              toArrayBuffer(signedDelegation.delegation.pubkey),
              signedDelegation.delegation.expiration,
              signedDelegation.delegation.targets[0] || undefined
            ),
            signature: signedDelegation.signature as unknown as Signature
          }
        ],
        toArrayBuffer(user_key)
      )

      const delegationIdentity = DelegationIdentity.fromDelegation(sessionIdentity, delegationChain)

      // Store the delegation in localStorage for persistence
      localStorage.setItem(DELEGATION_STORAGE_KEY, JSON.stringify(delegationChain.toJSON()))

      // Get the authenticated user information
      const actor = createSessionManagerActor(delegationIdentity)
      const authResponse = await actor.authenticated()

      set({
        delegationIdentity,
        isAuthenticated: true,
        currentPrincipalId: delegationIdentity.getPrincipal().toText(),
        userSub: authResponse.user_sub
      })

      console.log('Successfully logged in with principal:', delegationIdentity.getPrincipal().toText())

      return delegationIdentity.getPrincipal()
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  logout: async () => {
    localStorage.removeItem(DELEGATION_STORAGE_KEY)
    set({
      delegationIdentity: null,
      isAuthenticated: false,
      currentPrincipalId: '',
      userSub: null
    })
  },

  getIdentity: () => {
    const { delegationIdentity, sessionIdentity, isAuthenticated } = get()
    if (isAuthenticated && delegationIdentity) {
      return delegationIdentity
    }
    return sessionIdentity || undefined
  }
}))

// Auth service class for easier import and usage in components
export class AuthService {
  private store = useAuthStore.getState()

  constructor() {
    this.store = useAuthStore.getState()
  }

  async init(): Promise<void> {
    return this.store.init()
  }

  async login(idToken: string): Promise<Principal | null> {
    return this.store.login(idToken)
  }

  async logout(): Promise<void> {
    return this.store.logout()
  }

  getIdentity(): Identity | undefined {
    return this.store.getIdentity()
  }

  isAuthenticated(): boolean {
    return this.store.isAuthenticated
  }

  getCurrentPrincipalId(): string {
    return this.store.currentPrincipalId
  }

  getUserSub(): string | null {
    return this.store.userSub
  }
}

export const authService = new AuthService()
