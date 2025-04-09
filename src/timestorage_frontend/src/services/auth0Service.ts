import { Auth0Client } from '@auth0/auth0-spa-js'
import { authService } from '@/store/auth.store'
import {} from '@dfinity/identity'
import { SignIdentity } from '@dfinity/agent'

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'your-auth0-domain.auth0.com'
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'your-auth0-client-id'
const AUTH0_REDIRECT_URI = window.location.origin

// Initialize Auth0 client
let auth0Client: Auth0Client | null = null

// Initialize Auth0 client
const initAuth0Client = async (): Promise<Auth0Client> => {
  if (!auth0Client) {
    auth0Client = new Auth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: AUTH0_REDIRECT_URI
      }
    })
  }
  return auth0Client
}

// Handle Auth0 login
export const loginWithAuth0 = async (): Promise<void> => {
  try {
    // Initialize auth store if not already initialized
    await authService.init()

    // Get the session identity
    const identity = authService.getIdentity()
    if (!identity) {
      throw new Error('Session identity initialization failed')
    }

    const signIdentity = identity as SignIdentity
    const publicKeyDer = signIdentity.getPublicKey().toDer()

    // Get public key as DER and convert to hex for nonce
    const nonce = Array.from(new Uint8Array(publicKeyDer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Initialize Auth0 client
    const client = await initAuth0Client()

    // Login with Auth0 and use nonce for state binding
    await client.loginWithRedirect({
      authorizationParams: {
        nonce,
        redirect_uri: AUTH0_REDIRECT_URI
      }
    })
  } catch (error) {
    console.error('Auth0 login error:', error)
    throw error
  }
}

// Handle Auth0 logout
export const logoutWithAuth0 = async (): Promise<void> => {
  try {
    const client = await initAuth0Client()

    // Logout from Auth0
    await client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })

    // Logout from our app
    await authService.logout()
  } catch (error) {
    console.error('Auth0 logout error:', error)
    throw error
  }
}

// Handle Auth0 callback after redirect
export const handleAuth0Callback = async (): Promise<void> => {
  try {
    const client = await initAuth0Client()

    // Handle the redirect callback
    const result = await client.handleRedirectCallback()

    // Get ID token
    const idToken = await client.getIdTokenClaims()
    if (!idToken) {
      throw new Error('No ID token available')
    }

    // Use the ID token to authenticate with the canister
    await authService.login(idToken.__raw)

    // Redirect to the intended page or home
    const targetUrl = result?.appState?.returnTo || '/'
    window.history.replaceState({}, document.title, targetUrl)
  } catch (error) {
    console.error('Error handling Auth0 callback:', error)
    throw error
  }
}

// Check if we're in the Auth0 callback flow
export const isInAuthCallback = (): boolean => {
  return window.location.search.includes('code=') && window.location.search.includes('state=')
}

// Check if user is authenticated with Auth0
export const isAuthenticatedWithAuth0 = async (): Promise<boolean> => {
  try {
    const client = await initAuth0Client()
    return await client.isAuthenticated()
  } catch (error) {
    console.error('Error checking Auth0 authentication:', error)
    return false
  }
}
