export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text })
  const UUID = IDL.Text
  const Response = IDL.Variant({ ok: IDL.Text, err: IDL.Text })
  const IssuerInfo = IDL.Record({
    principal: IDL.Opt(IDL.Text),
    name: IDL.Opt(IDL.Text),
    email: IDL.Opt(IDL.Text),
    website: IDL.Opt(IDL.Text),
    identification: IDL.Opt(IDL.Text),
    phone: IDL.Opt(IDL.Text)
  })
  const LocationInfo = IDL.Record({
    zip: IDL.Opt(IDL.Text),
    floor: IDL.Opt(IDL.Text),
    country: IDL.Opt(IDL.Text),
    city: IDL.Opt(IDL.Text),
    room: IDL.Opt(IDL.Text),
    unit: IDL.Opt(IDL.Text),
    state: IDL.Opt(IDL.Text),
    address: IDL.Opt(IDL.Text),
    address2: IDL.Opt(IDL.Text)
  })
  const ProjectInfo = IDL.Record({
    subIdentification: IDL.Opt(IDL.Text),
    createdAt: IDL.Opt(IDL.Text),
    version: IDL.Opt(IDL.Text),
    issuer: IDL.Opt(IssuerInfo),
    identification: IDL.Opt(IDL.Text),
    category: IDL.Opt(IDL.Text),
    typeText: IDL.Opt(IDL.Text),
    location: IDL.Opt(LocationInfo)
  })
  const Result_4 = IDL.Variant({ ok: IDL.Vec(IDL.Text), err: IDL.Text })
  const Result_3 = IDL.Variant({
    ok: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    err: IDL.Text
  })
  const FileResponseMetadata = IDL.Record({
    fileData: IDL.Text,
    mimeType: IDL.Text,
    fileName: IDL.Text,
    uploadTimestamp: IDL.Text
  })
  const FileResponse = IDL.Record({
    metadata: FileResponseMetadata,
    uuid: UUID
  })
  const Result__1_2 = IDL.Variant({ ok: FileResponse, err: IDL.Text })
  const FileMetadataOnly = IDL.Record({
    mimeType: IDL.Text,
    fileName: IDL.Text,
    uploadTimestamp: IDL.Text
  })
  const FileMetadataResponse = IDL.Record({
    metadata: FileMetadataOnly,
    uuid: UUID
  })
  const Result__1_1 = IDL.Variant({
    ok: IDL.Vec(FileMetadataResponse),
    err: IDL.Text
  })
  const Result__1 = IDL.Variant({
    ok: FileMetadataResponse,
    err: IDL.Text
  })
  const ProjectStatus = IDL.Variant({
    cancelled: IDL.Null,
    pending: IDL.Null,
    completed: IDL.Null,
    approved: IDL.Null,
    rejected: IDL.Null,
    draft: IDL.Null
  })
  const RemoteDocumentMetadata = IDL.Record({
    fileData: IDL.Text,
    mimeType: IDL.Text,
    fileName: IDL.Text,
    uploadTimestamp: IDL.Text
  })
  const FileId = IDL.Text
  const RemoteDocumentResponse = IDL.Record({
    metadata: RemoteDocumentMetadata,
    uuid: UUID,
    fileId: FileId
  })
  const LinkedStructureIdentifier = IDL.Record({
    model: IDL.Opt(IDL.Text),
    floorNumber: IDL.Opt(IDL.Text),
    subIdentification: IDL.Opt(IDL.Text),
    roomDescription: IDL.Opt(IDL.Text),
    productType: IDL.Opt(IDL.Text),
    notes: IDL.Opt(IDL.Text),
    identification: IDL.Opt(IDL.Text),
    category: IDL.Opt(IDL.Text),
    brand: IDL.Opt(IDL.Text),
    typeText: IDL.Opt(IDL.Text),
    sequenceNumber: IDL.Opt(IDL.Text),
    dimensions: IDL.Opt(IDL.Text),
    positionNumber: IDL.Opt(IDL.Text)
  })
  const ProjectPlacementResponse = IDL.Record({
    documents: IDL.Vec(RemoteDocumentResponse),
    info: IDL.Opt(LinkedStructureIdentifier),
    uuid: UUID
  })
  const ProjectLinkedStructureResponse = IDL.Record({
    info: IDL.Opt(LinkedStructureIdentifier),
    uuid: UUID
  })
  const ProjectAPIResponse = IDL.Record({
    status: ProjectStatus,
    documents: IDL.Vec(RemoteDocumentResponse),
    info: ProjectInfo,
    placements: IDL.Vec(ProjectPlacementResponse),
    linkedStructures: IDL.Vec(ProjectLinkedStructureResponse),
    uuid: UUID
  })
  const Response_1 = IDL.Variant({
    ok: ProjectAPIResponse,
    err: IDL.Text
  })
  const Result_2 = IDL.Variant({
    ok: IDL.Tuple(IDL.Text, IDL.Text, IDL.Vec(FileResponse)),
    err: IDL.Text
  })
  const ValueRequest = IDL.Record({ key: IDL.Text, uuid: IDL.Text })
  const ValueLockStatusRequest = IDL.Record({
    key: IDL.Text,
    uuid: IDL.Text
  })
  const ValueLockStatus = IDL.Record({
    locked: IDL.Bool,
    lockedBy: IDL.Opt(IDL.Principal)
  })
  const Result_1 = IDL.Variant({ ok: ValueLockStatus, err: IDL.Text })
  const ValueLockAllRequest = IDL.Record({
    lock: IDL.Bool,
    uuid: IDL.Text
  })
  const ValueLockRequest = IDL.Record({
    key: IDL.Text,
    lock: IDL.Bool,
    uuid: IDL.Text
  })
  const ValueUnlockAllRequest = IDL.Record({ uuid: IDL.Text })
  const ValueUnlockRequest = IDL.Record({
    key: IDL.Text,
    uuid: IDL.Text
  })
  const ValueUpdateRequest = IDL.Record({
    key: IDL.Text,
    uuid: IDL.Text,
    newValue: IDL.Text
  })
  const Timestamp = IDL.Int
  const FileMetadata = IDL.Record({
    mimeType: IDL.Text,
    fileName: IDL.Text,
    uploadTimestamp: Timestamp
  })
  const TimestorageBackend = IDL.Service({
    addAdmin: IDL.Func([IDL.Principal], [Result], []),
    addEditor: IDL.Func([IDL.Principal], [Result], []),
    addPlacementToProject: IDL.Func([UUID, UUID], [Response], []),
    assignUuidToProject: IDL.Func([UUID, UUID], [Response], []),
    createEmptyUUID: IDL.Func([IDL.Text], [Result], []),
    createProject: IDL.Func([UUID, ProjectInfo], [Response], []),
    deleteProject: IDL.Func([UUID], [Response], []),
    getAllUUIDs: IDL.Func([IDL.Opt(IDL.Principal)], [Result_4], ['query']),
    getAllValues: IDL.Func([IDL.Text], [Result_3], ['query']),
    getFileByUUIDAndId: IDL.Func([IDL.Text, IDL.Text], [Result__1_2], ['query']),
    getFileMetadataByUUID: IDL.Func([IDL.Text], [Result__1_1], ['query']),
    getFileMetadataByUUIDAndId: IDL.Func([IDL.Text, IDL.Text], [Result__1], ['query']),
    getProject: IDL.Func([UUID], [Response_1], ['query']),
    getProjectByUuid: IDL.Func([UUID], [Response_1], ['query']),
    getUUIDInfo: IDL.Func([IDL.Text], [Result_2], ['query']),
    getValue: IDL.Func([ValueRequest], [Result], ['query']),
    getValueLockStatus: IDL.Func([ValueLockStatusRequest], [Result_1], ['query']),
    insertUUIDStructure: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    isAdmin: IDL.Func([], [IDL.Bool], ['query']),
    isEditor: IDL.Func([], [IDL.Bool], ['query']),
    linkUuids: IDL.Func([UUID, UUID], [Response], []),
    lockAllValues: IDL.Func([ValueLockAllRequest], [Result], []),
    lockValue: IDL.Func([ValueLockRequest], [Result], []),
    removeAdmin: IDL.Func([IDL.Principal], [Result], []),
    removeEditor: IDL.Func([IDL.Principal], [Result], []),
    unassignUuidFromProject: IDL.Func([UUID, UUID], [Response], []),
    unlinkUuids: IDL.Func([UUID, UUID], [Response], []),
    unlockAllValues: IDL.Func([ValueUnlockAllRequest], [Result], []),
    unlockValue: IDL.Func([ValueUnlockRequest], [Result], []),
    updateManyValues: IDL.Func([IDL.Text, IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], [Result], []),
    updateManyValuesAndLock: IDL.Func([IDL.Text, IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], [Result], []),
    updateProjectInfo: IDL.Func([UUID, ProjectInfo], [Response], []),
    updateProjectStatus: IDL.Func([UUID, ProjectStatus], [Response], []),
    updateUUIDStructure: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    updateValue: IDL.Func([ValueUpdateRequest], [Result], []),
    updateValueAndLock: IDL.Func([ValueUpdateRequest], [Result], []),
    uploadFile: IDL.Func([IDL.Text, IDL.Text, FileMetadata], [Result], [])
  })
  return TimestorageBackend
}
export const init = ({ IDL }) => {
  return []
}
