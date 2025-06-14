import type { Principal } from '@dfinity/principal'
import type { ActorMethod } from '@dfinity/agent'
import type { IDL } from '@dfinity/candid'

export interface FileMetadata {
  mimeType: string
  fileName: string
  uploadTimestamp: Timestamp
}
export interface FileMetadataResponse {
  metadata: {
    mimeType: string
    fileName: string
    uploadTimestamp: string
  }
  uuid: UUID
}
export interface FileResponse {
  metadata: {
    fileData: string
    mimeType: string
    fileName: string
    uploadTimestamp: string
  }
  uuid: UUID
}
export type Result = { ok: string } |
{ err: string }
export type Result_1 = { ok: ValueLockStatus } |
{ err: string }
export type Result_2 = { ok: [string, string, Array<FileResponse>] } |
{ err: string }
export type Result_3 = { ok: Array<[string, string]> } |
{ err: string }
export type Result_4 = { ok: Array<string> } |
{ err: string }
export type Result__1 = { ok: FileMetadataResponse } |
{ err: string }
export type Result__1_1 = { ok: Array<FileMetadataResponse> } |
{ err: string }
export type Result__1_2 = { ok: FileResponse } |
{ err: string }
export type Timestamp = bigint
export interface TimestorageBackend {
  addAdmin: ActorMethod<[Principal], Result>,
  addEditor: ActorMethod<[Principal], Result>,
  createEmptyUUID: ActorMethod<[string], Result>,
  getAllUUIDs: ActorMethod<[[] | [Principal]], Result_4>,
  getAllValues: ActorMethod<[string], Result_3>,
  getFileByUUIDAndId: ActorMethod<[string, string], Result__1_2>,
  getFileMetadataByUUID: ActorMethod<[string], Result__1_1>,
  getFileMetadataByUUIDAndId: ActorMethod<[string, string], Result__1>,
  getUUIDInfo: ActorMethod<[string], Result_2>,
  getValue: ActorMethod<[ValueRequest], Result>,
  getValueLockStatus: ActorMethod<[ValueLockStatusRequest], Result_1>,
  insertUUIDStructure: ActorMethod<[string, string], Result>,
  isAdmin: ActorMethod<[], boolean>,
  isEditor: ActorMethod<[], boolean>,
  lockAllValues: ActorMethod<[ValueLockAllRequest], Result>,
  lockValue: ActorMethod<[ValueLockRequest], Result>,
  removeAdmin: ActorMethod<[Principal], Result>,
  removeEditor: ActorMethod<[Principal], Result>,
  unlockAllValues: ActorMethod<[ValueUnlockAllRequest], Result>,
  unlockValue: ActorMethod<[ValueUnlockRequest], Result>,
  updateManyValues: ActorMethod<[string, Array<[string, string]>], Result>,
  updateManyValuesAndLock: ActorMethod<
    [string, Array<[string, string]>],
    Result
  >
  updateUUIDStructure: ActorMethod<[string, string], Result>
  updateValue: ActorMethod<[ValueUpdateRequest], Result>
  updateValueAndLock: ActorMethod<[ValueUpdateRequest], Result>
  uploadFile: ActorMethod<[string, string, FileMetadata], Result>
}
export type UUID = string;
export interface ValueLockAllRequest { lock: boolean, uuid: string }
export interface ValueLockRequest {
  key: string
  lock: boolean
  uuid: string
}
export interface ValueLockStatus {
  locked: boolean
  lockedBy: [] | [Principal]
}
export interface ValueLockStatusRequest { key: string, uuid: string }
export interface ValueRequest { key: string, uuid: string }
export interface ValueUnlockAllRequest { uuid: string }
export interface ValueUnlockRequest { key: string, uuid: string }
export interface ValueUpdateRequest {
  key: string
  uuid: string
  newValue: string
}
export interface _SERVICE extends TimestorageBackend {}
export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
