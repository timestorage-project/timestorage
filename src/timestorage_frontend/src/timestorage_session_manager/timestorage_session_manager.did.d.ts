import type { Principal } from '@dfinity/principal'
import type { ActorMethod } from '@dfinity/agent'
import type { IDL } from '@dfinity/candid'

export interface Auth0JWK {
  e: string
  n: string
  alg: string
  kid: string
  kty: string
  use: string
  x5c: Array<string>
  x5t: string
}
export interface Auth0JWKS {
  keys: Array<Auth0JWK>
}
export interface AuthenticatedResponse {
  user_principal: Principal
  user_sub: UserSub
}
export interface Delegation {
  pubkey: PublicKey
  targets: [] | [Array<Principal>]
  expiration: Timestamp
}
export type GetDelegationResponse = { no_such_delegation: null } | { signed_delegation: SignedDelegation }
export interface PrepareDelegationResponse {
  user_key: UserKey
  expiration: Timestamp
}
export type PublicKey = Uint8Array | number[]
export type Signature = Uint8Array | number[]
export interface SignedDelegation {
  signature: Signature
  delegation: Delegation
}
export type Timestamp = bigint
export type UserKey = PublicKey
export type UserSub = string
export interface _SERVICE {
  authenticated: ActorMethod<[], AuthenticatedResponse>
  get_delegation: ActorMethod<[string, Timestamp], GetDelegationResponse>
  get_jwks: ActorMethod<[], [] | [Auth0JWKS]>
  prepare_delegation: ActorMethod<[string], PrepareDelegationResponse>
  set_jwks: ActorMethod<[Auth0JWKS], undefined>
  sync_jwks: ActorMethod<[], undefined>
}
export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
