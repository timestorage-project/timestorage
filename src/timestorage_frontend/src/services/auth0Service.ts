import { Auth0Client } from '@auth0/auth0-spa-js'
import { authService } from '@/store/auth.store'
import { } from '@dfinity/identity'
import { SignIdentity, toHex } from '@dfinity/agent'
// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'cardinalsolar.eu.auth0.com'
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || '7say7cimou4IGL10QSAFj3BL1XC59ERz'
const AUTH0_REDIRECT_URI = process.env.AUTH0_REDIRECT_URI || 'http://localhost:3000/auth/auth0/callback'

// Initialize Auth0 client
let auth0Client: Auth0Client | null = null
// Prevent running callback logic multiple times on same page load
let auth0CallbackHandled = false

// Initialize Auth0 client
const initAuth0Client = async (): Promise<Auth0Client> => {
  if (!auth0Client) {
    auth0Client = new Auth0Client({
      auth0Client: {
        name: 'timestorage',
        version: '1.0.0',
      },
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      useRefreshTokens: true,
      authorizationParams: {
        redirect_uri: AUTH0_REDIRECT_URI,
        scope: 'openid profile email'
      },
      // Use localstorage so the Auth0 transaction survives the full-page redirect
      cacheLocation: 'localstorage'
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
    // const nonce = Array.from(new Uint8Array(publicKeyDer))
    //   .map(b => b.toString(16).padStart(2, '0'))
    //   .join('')

    const hex = toHex(publicKeyDer)
    // Initialize Auth0 client
    const client = await initAuth0Client()


    // Login with Auth0 and use nonce for state binding
    await client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: AUTH0_REDIRECT_URI,
        publicKeyDer: hex
      },

    })
  } catch (error) {
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
        returnTo: 'http://localhost:3000/login'
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
  if (auth0CallbackHandled) {
    return
  }
  auth0CallbackHandled = true
  try {
    const client = await initAuth0Client()

    if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
      console.log('Auth0 callback received')
    }
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
    // Mark as handled so subsequent calls are ignored
  } catch (error) {
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
