export const idlFactory = ({ IDL }) => {
  const UserSub = IDL.Text
  const AuthenticatedResponse = IDL.Record({
    user_principal: IDL.Principal,
    user_sub: UserSub
  })
  const Timestamp = IDL.Nat64
  const Signature = IDL.Vec(IDL.Nat8)
  const PublicKey = IDL.Vec(IDL.Nat8)
  const Delegation = IDL.Record({
    pubkey: PublicKey,
    targets: IDL.Opt(IDL.Vec(IDL.Principal)),
    expiration: Timestamp
  })
  const SignedDelegation = IDL.Record({
    signature: Signature,
    delegation: Delegation
  })
  const GetDelegationResponse = IDL.Variant({
    no_such_delegation: IDL.Null,
    signed_delegation: SignedDelegation
  })
  const Auth0JWK = IDL.Record({
    e: IDL.Text,
    n: IDL.Text,
    alg: IDL.Text,
    kid: IDL.Text,
    kty: IDL.Text,
    use: IDL.Text,
    x5c: IDL.Vec(IDL.Text),
    x5t: IDL.Text
  })
  const Auth0JWKS = IDL.Record({ keys: IDL.Vec(Auth0JWK) })
  const UserKey = PublicKey
  const PrepareDelegationResponse = IDL.Record({
    user_key: UserKey,
    expiration: Timestamp
  })
  return IDL.Service({
    authenticated: IDL.Func([], [AuthenticatedResponse], ['query']),
    get_delegation: IDL.Func([IDL.Text, Timestamp], [GetDelegationResponse], ['query']),
    get_jwks: IDL.Func([], [IDL.Opt(Auth0JWKS)], ['query']),
    prepare_delegation: IDL.Func([IDL.Text], [PrepareDelegationResponse], []),
    set_jwks: IDL.Func([Auth0JWKS], [], []),
    sync_jwks: IDL.Func([], [], [])
  })
}
export const init = ({ IDL }) => {
  return []
}
