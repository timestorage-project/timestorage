import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AssetCore {
  'status': AssetStatus,
  'grants': Array<Grant>,
  'subidentifier': [] | [string],
  'identifier': [] | [string],
}
export type AssetStatus = { 'deleted': null } |
{ 'aborted': null } |
{ 'initialized': null } |
{ 'completed': null } |
{ 'empty': null } |
{ 'processing': null };
export type FileId = string;
export interface FileMetadata {
  'mimeType': string,
  'fileName': string,
  'uploadTimestamp': Timestamp,
}
export interface FileMetadataOnly {
  'mimeType': string,
  'fileName': string,
  'uploadTimestamp': string,
}
export interface FileMetadataResponse {
  'metadata': FileMetadataOnly,
  'uuid': UUID,
}
export interface FileResponse {
  'metadata': FileResponseMetadata,
  'uuid': UUID,
}
export interface FileResponseMetadata {
  'fileData': string,
  'mimeType': string,
  'fileName': string,
  'uploadTimestamp': string,
}
export interface Grant { 'principal': Principal, 'grantType': GrantType }
export type GrantType = { 'owner': null } |
{ 'edit': null } |
{ 'install': null };
export interface IssuerInfo {
  'principal': [] | [string],
  'name': [] | [string],
  'email': [] | [string],
  'website': [] | [string],
  'identification': [] | [string],
  'phone': [] | [string],
}
export interface LinkedStructureIdentifier {
  'model': [] | [string],
  'floorNumber': [] | [string],
  'subIdentification': [] | [string],
  'roomDescription': [] | [string],
  'productType': [] | [string],
  'notes': [] | [string],
  'identification': [] | [string],
  'category': [] | [string],
  'brand': [] | [string],
  'typeText': [] | [string],
  'sequenceNumber': [] | [string],
  'dimensions': [] | [string],
  'positionNumber': [] | [string],
}
export interface LocationInfo {
  'zip': [] | [string],
  'floor': [] | [string],
  'country': [] | [string],
  'city': [] | [string],
  'room': [] | [string],
  'unit': [] | [string],
  'state': [] | [string],
  'address': [] | [string],
  'address2': [] | [string],
}
export interface ProjectAPIResponse {
  'status': ProjectStatus,
  'documents': Array<RemoteDocumentResponse>,
  'info': ProjectInfo,
  'placements': Array<ProjectPlacementResponse>,
  'linkedStructures': Array<ProjectLinkedStructureResponse>,
  'uuid': UUID,
}
export interface ProjectInfo {
  'subIdentification': [] | [string],
  'createdAt': [] | [string],
  'version': [] | [string],
  'issuer': [] | [IssuerInfo],
  'identification': [] | [string],
  'category': [] | [string],
  'typeText': [] | [string],
  'location': [] | [LocationInfo],
}
export interface ProjectLinkedStructureResponse {
  'info': [] | [LinkedStructureIdentifier],
  'uuid': UUID,
}
export interface ProjectPlacementResponse {
  'documents': Array<RemoteDocumentResponse>,
  'info': [] | [LinkedStructureIdentifier],
  'uuid': UUID,
}
export type ProjectStatus = { 'cancelled': null } |
{ 'pending': null } |
{ 'completed': null } |
{ 'approved': null } |
{ 'rejected': null } |
{ 'draft': null };
export interface RemoteDocumentMetadata {
  'fileData': string,
  'mimeType': string,
  'fileName': string,
  'uploadTimestamp': string,
}
export interface RemoteDocumentResponse {
  'metadata': RemoteDocumentMetadata,
  'uuid': UUID,
  'fileId': FileId,
}
export type Response = { 'ok': string } |
{ 'err': string };
export type Response_1 = { 'ok': ProjectAPIResponse } |
{ 'err': string };
export type Result = { 'ok': string } |
{ 'err': string };
export type Result_1 = { 'ok': ValueLockStatus } |
{ 'err': string };
export type Result_2 = { 'ok': [string, string, Array<FileResponse>] } |
{ 'err': string };
export type Result_3 = { 'ok': AssetCore } |
{ 'err': string };
export type Result_4 = { 'ok': Array<[string, string]> } |
{ 'err': string };
export type Result_5 = { 'ok': Array<string> } |
{ 'err': string };
export type Result__1 = { 'ok': FileMetadataResponse } |
{ 'err': string };
export type Result__1_1 = { 'ok': Array<FileMetadataResponse> } |
{ 'err': string };
export type Result__1_2 = { 'ok': FileResponse } |
{ 'err': string };
export type Timestamp = bigint;
export interface TimestorageBackend {
  'addAdmin': ActorMethod<[Principal], Result>,
  'addEditor': ActorMethod<[Principal], Result>,
  'addGrant': ActorMethod<[UUID, Principal, GrantType], Result>,
  'addPlacementToProject': ActorMethod<[UUID, UUID], Response>,
  'assignUuidToProject': ActorMethod<[UUID, UUID], Response>,
  'createEmptyUUID': ActorMethod<[string], Result>,
  'createProject': ActorMethod<[UUID, ProjectInfo], Response>,
  'deleteProject': ActorMethod<[UUID], Response>,
  'getAllUUIDs': ActorMethod<[[] | [Principal]], Result_5>,
  'getAllValues': ActorMethod<[string], Result_4>,
  'getAssetCore': ActorMethod<[UUID], Result_3>,
  'getFileByUUIDAndId': ActorMethod<[string, string], Result__1_2>,
  'getFileMetadataByUUID': ActorMethod<[string], Result__1_1>,
  'getFileMetadataByUUIDAndId': ActorMethod<[string, string], Result__1>,
  'getProject': ActorMethod<[UUID], Response_1>,
  'getProjectByUuid': ActorMethod<[UUID], Response_1>,
  'getUUIDInfo': ActorMethod<[string], Result_2>,
  'getValue': ActorMethod<[ValueRequest], Result>,
  'getValueLockStatus': ActorMethod<[ValueLockStatusRequest], Result_1>,
  'insertUUIDStructure': ActorMethod<[string, string], Result>,
  'isAdmin': ActorMethod<[], boolean>,
  'isEditor': ActorMethod<[], boolean>,
  'linkUuids': ActorMethod<[UUID, UUID], Response>,
  'lockAllValues': ActorMethod<[ValueLockAllRequest], Result>,
  'lockValue': ActorMethod<[ValueLockRequest], Result>,
  'removeAdmin': ActorMethod<[Principal], Result>,
  'removeEditor': ActorMethod<[Principal], Result>,
  'removeGrant': ActorMethod<[UUID, Principal], Result>,
  'unassignUuidFromProject': ActorMethod<[UUID, UUID], Response>,
  'unlinkUuids': ActorMethod<[UUID, UUID], Response>,
  'unlockAllValues': ActorMethod<[ValueUnlockAllRequest], Result>,
  'unlockValue': ActorMethod<[ValueUnlockRequest], Result>,
  'updateAssetStatus': ActorMethod<[UUID, AssetStatus], Result>,
  'updateManyValues': ActorMethod<[string, Array<[string, string]>], Result>,
  'updateManyValuesAndLock': ActorMethod<
    [string, Array<[string, string]>],
    Result
  >,
  'updateProjectInfo': ActorMethod<[UUID, ProjectInfo], Response>,
  'updateProjectStatus': ActorMethod<[UUID, ProjectStatus], Response>,
  'updateUUIDStructure': ActorMethod<[string, string], Result>,
  'updateValue': ActorMethod<[ValueUpdateRequest], Result>,
  'updateValueAndLock': ActorMethod<[ValueUpdateRequest], Result>,
  'uploadFile': ActorMethod<[string, string, FileMetadata], Result>,
}
export type UUID = string;
export interface ValueLockAllRequest { 'lock': boolean, 'uuid': string }
export interface ValueLockRequest {
  'key': string,
  'lock': boolean,
  'uuid': string,
}
export interface ValueLockStatus {
  'locked': boolean,
  'lockedBy': [] | [Principal],
}
export interface ValueLockStatusRequest { 'key': string, 'uuid': string }
export interface ValueRequest { 'key': string, 'uuid': string }
export interface ValueUnlockAllRequest { 'uuid': string }
export interface ValueUnlockRequest { 'key': string, 'uuid': string }
export interface ValueUpdateRequest {
  'key': string,
  'uuid': string,
  'newValue': string,
}
export interface _SERVICE extends TimestorageBackend { }
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
