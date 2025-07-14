import { create } from 'zustand'
import { Actor, HttpAgent, Identity, Signature } from '@dfinity/agent'
import { DelegationIdentity, DelegationChain, Ed25519KeyIdentity, Delegation, isDelegationValid } from '@dfinity/identity'
import { idlFactory as sessionManagerIdlFactory } from '@/timestorage_session_manager/timestorage_session_manager.did'
import { _SERVICE as SessionManagerService } from '@/timestorage_session_manager/timestorage_session_manager.did'
import { internalApiClient, publicApiClient } from '@/services/apiClient'

export interface User {
  id?: string
  sub: string
  email: string
  firstName: string
  lastName: string
  profilePictureUrl?: string
  principalId?: string // ICP Principal ID
  createdAt?: string | Date
  updatedAt?: string | Date
  auth0Id?: string
  roleId?: string
  tenantId?: string
  isInstaller?: boolean
}
interface AuthState {
  accessToken: string | null
  idToken: string | null
  user: User | null
  hasRole: boolean
  roleCode: string | null
  isInstaller: boolean
  installerId: string | null


  sessionIdentity: Ed25519KeyIdentity | null
  delegationIdentity: DelegationIdentity | null
  isAuthenticated: boolean
  currentPrincipalId: string
  userSub: string | null
  initialized: boolean
  init: () => Promise<void>
  login: (data: { accessToken: string; idToken: string; user: User }) => Promise<void>
  logout: () => Promise<void>
  getIdentity: () => Identity | undefined
  setTokens: (accessToken: string, idToken: string) => void
  getAccessToken: () => string | null
  getIdToken: () => string | null,
  checkAuthStatus: () => Promise<void>
}

// Session manager canister ID from environment variables
const sessionManagerCanisterId =
  (process.env.CANISTER_ID_TIMESTORAGE_SESSION_MANAGER as string) || 'umunu-kh777-77774-qaaca-cai'

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
// Local storage key for persisting session identity
const SESSION_IDENTITY_STORAGE_KEY = 'timestorage-session-identity'
// Local storage keys for persisting auth tokens and user data
const ACCESS_TOKEN_STORAGE_KEY = 'timestorage-access-token'
const ID_TOKEN_STORAGE_KEY = 'timestorage-id-token'
const USER_DATA_STORAGE_KEY = 'timestorage-user-data'

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionIdentity: null,
  delegationIdentity: null,
  isAuthenticated: false,
  currentPrincipalId: '',
  userSub: null,
  initialized: false,
  hasRole: false,
  roleCode: null,
  isInstaller: false,
  installerId: null,

  accessToken: null,
  idToken: null,
  user: null,

  init: async () => {
    const { initialized } = get()
    if (initialized) {
      console.warn('Auth store already initialized')
      return
    }
    try {
      // Restore or generate session identity
      let sessionIdentity: Ed25519KeyIdentity | undefined
      const storedSessionIdentity = localStorage.getItem(SESSION_IDENTITY_STORAGE_KEY)
      if (storedSessionIdentity) {
        try {
          sessionIdentity = Ed25519KeyIdentity.fromJSON(storedSessionIdentity)
        } catch (e) {
          console.error('Failed to restore session identity:', e)
          localStorage.removeItem(SESSION_IDENTITY_STORAGE_KEY)
        }
      }

      if (!sessionIdentity) {
        sessionIdentity = Ed25519KeyIdentity.generate()
        try {
          localStorage.setItem(SESSION_IDENTITY_STORAGE_KEY, JSON.stringify(sessionIdentity.toJSON()))
        } catch (e) {
          console.error('Failed to persist session identity:', e)
        }
      }

      set({ sessionIdentity, initialized: true })

      // Try to restore tokens and user data from localStorage
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
      const storedIdToken = localStorage.getItem(ID_TOKEN_STORAGE_KEY)
      const storedUserData = localStorage.getItem(USER_DATA_STORAGE_KEY)
      
      let restoredUser: User | null = null
      if (storedUserData) {
        try {
          restoredUser = JSON.parse(storedUserData)
        } catch (e) {
          console.error('Failed to parse stored user data:', e)
          localStorage.removeItem(USER_DATA_STORAGE_KEY)
        }
      }

      // Try to load existing delegation from localStorage
      const storedDelegation = localStorage.getItem(DELEGATION_STORAGE_KEY)
      if (storedDelegation) {
        try {
          const chain = DelegationChain.fromJSON(JSON.parse(storedDelegation))
          // Check if the delegation is still valid

          if (isDelegationValid(chain)) {
            const delegationIdentity = DelegationIdentity.fromDelegation(sessionIdentity, chain)

            // Verify the identity by making a canister call
            const actor = createSessionManagerActor(delegationIdentity)
            const authResponse = await actor.authenticated()

            set({
              delegationIdentity,
              isAuthenticated: true,
              currentPrincipalId: delegationIdentity.getPrincipal().toText(),
              userSub: authResponse.user_sub,
              accessToken: storedAccessToken,
              idToken: storedIdToken,
              user: restoredUser
            })

            console.log('Restored authenticated session with principal:', delegationIdentity.getPrincipal().toText())
            return
          } else {
            localStorage.removeItem(DELEGATION_STORAGE_KEY)
            localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
            localStorage.removeItem(ID_TOKEN_STORAGE_KEY)
            localStorage.removeItem(USER_DATA_STORAGE_KEY)
          }
        } catch (error) {
          console.error('Error restoring delegation:', error)
          localStorage.removeItem(DELEGATION_STORAGE_KEY)
          localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
          localStorage.removeItem(ID_TOKEN_STORAGE_KEY)
          localStorage.removeItem(USER_DATA_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error initializing auth store:', error)
    }
  },
  checkAuthStatus: async () => {

    try {

      const response = await publicApiClient.get<{
        hasRole: boolean
        roleCode: string | null
        isInstaller: boolean
        installerId: string | null
        redirectUrl: string
      }>('/auth-status')

      set({
        hasRole: response.data.hasRole,
        roleCode: response.data.roleCode,
        isInstaller: response.data.isInstaller,
        installerId: response.data.installerId,
      })


    } catch (error) {
      console.error('Auth status check failed:', error)
      // Don't redirect on error, let the user continue
    }
  },
  login: async (data) => {
    const { accessToken, idToken, user } = data

    set({
      accessToken,
      idToken,
      user,
      isAuthenticated: true
    })

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
      
      // Store tokens and user data in localStorage for persistence
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
      localStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken)
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(user))

      // Get the authenticated user information
      const actor = createSessionManagerActor(delegationIdentity)
      const authResponse = await actor.authenticated()

      set({
        delegationIdentity,
        isAuthenticated: true,
        currentPrincipalId: delegationIdentity.getPrincipal().toText(),
        userSub: authResponse.user_sub,
        accessToken: accessToken,
        idToken: idToken,
        user: user
      })

      console.log('Successfully logged in with principal:', delegationIdentity.getPrincipal().toText())

      // Call /me API to get updated user information
      try {
        await authStore.getState().checkAuthStatus()

        const meResponse = await internalApiClient.get<User>('/users/me')
        set({ user: meResponse.data })
        console.log('Successfully fetched user profile from /me API')
      } catch (apiError) {
        console.warn('Failed to fetch user profile from /me API:', apiError)
        // Don't throw here as login was successful, just log the warning
      }

    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  logout: async () => {
    localStorage.removeItem(DELEGATION_STORAGE_KEY)
    localStorage.removeItem(SESSION_IDENTITY_STORAGE_KEY)
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_DATA_STORAGE_KEY)

    set({
      accessToken: null,
      idToken: null,
      user: null,
      isAuthenticated: false,
      sessionIdentity: null,
      delegationIdentity: null,
      currentPrincipalId: '',
      userSub: null,
      hasRole: false,
      roleCode: null,
      isInstaller: false,
      installerId: null
    })
  },

  getIdentity: () => {
    const { delegationIdentity, sessionIdentity, isAuthenticated } = get()
    if (isAuthenticated && delegationIdentity) {
      return delegationIdentity
    }
    return sessionIdentity || undefined
  },
  setTokens: (accessToken, idToken) => {
    set({ accessToken, idToken })
  },
  getAccessToken: () => get().accessToken,
  getIdToken: () => get().idToken,
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

  async login(data: { accessToken: string; idToken: string; user: User }): Promise<void> {
    return this.store.login(data)
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
export const authStore = useAuthStore