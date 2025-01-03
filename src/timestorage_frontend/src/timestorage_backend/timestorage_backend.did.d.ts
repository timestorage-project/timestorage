import type { Principal } from '@dfinity/principal'
import type { ActorMethod } from '@dfinity/agent'
import type { IDL } from '@dfinity/candid'

export interface ImageMetadata {
  fileName: string
  fileType: string
  uploadTimestamp: bigint
}
export interface ImageRecord {
  imageData: Uint8Array | number[]
  metadata: ImageMetadata
  uuid: string
}
export type Result = { ok: string } | { err: string }
export type Result_1 = { ok: [string, Array<string>] } | { err: string }
export type Result_2 = { ok: ImageRecord } | { err: string }
export type Result_3 = { ok: Array<string> } | { err: string }
export interface TimestorageBackend {
  addAdmin: ActorMethod<[Principal], Result>
  getAllUUIDs: ActorMethod<[], Result_3>
  getImage: ActorMethod<[string], Result_2>
  getUUIDInfo: ActorMethod<[string], Result_1>
  insertUUIDStructure: ActorMethod<[string, string], Result>
  isAdmin: ActorMethod<[], boolean>
  uploadImage: ActorMethod<[string, Uint8Array | number[], ImageMetadata], Result>
}
export interface _SERVICE extends TimestorageBackend {}
export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
