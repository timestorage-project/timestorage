export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const Result_5 = IDL.Variant({ ok: IDL.Vec(IDL.Text), err: IDL.Text });
  const Result_4 = IDL.Variant({
    ok: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    err: IDL.Text,
  });
  const UUID = IDL.Text;
  const FileResponse = IDL.Record({
    metadata: IDL.Record({
      fileData: IDL.Text,
      mimeType: IDL.Text,
      fileName: IDL.Text,
      uploadTimestamp: IDL.Text,
    }),
    uuid: UUID,
  });
  const Result__1 = IDL.Variant({ ok: FileResponse, err: IDL.Text });
  const Result_3 = IDL.Variant({
    ok: IDL.Tuple(IDL.Text, IDL.Vec(FileResponse)),
    err: IDL.Text,
  });
  const ValueRequest = IDL.Record({ key: IDL.Text, uuid: IDL.Text });
  const ValueLockStatusRequest = IDL.Record({
    key: IDL.Text,
    uuid: IDL.Text,
  });
  const ValueLockStatus = IDL.Record({
    locked: IDL.Bool,
    lockedBy: IDL.Opt(IDL.Principal),
  });
  const Result_2 = IDL.Variant({ ok: ValueLockStatus, err: IDL.Text });
  const ValueLockAllRequest = IDL.Record({
    lock: IDL.Bool,
    uuid: IDL.Text,
  });
  const ValueLockRequest = IDL.Record({
    key: IDL.Text,
    lock: IDL.Bool,
    uuid: IDL.Text,
  });
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Vec(IDL.Text) });
  const ValueUpdateRequest = IDL.Record({
    key: IDL.Text,
    uuid: IDL.Text,
    newValue: IDL.Text,
  });
  const Timestamp = IDL.Int;
  const FileMetadata = IDL.Record({
    mimeType: IDL.Text,
    fileName: IDL.Text,
    uploadTimestamp: Timestamp,
  });
  const TimestorageBackend = IDL.Service({
    addAdmin: IDL.Func([IDL.Principal], [Result], []),
    getAllUUIDs: IDL.Func([], [Result_5], ['query']),
    getAllValues: IDL.Func([IDL.Text], [Result_4], ['query']),
    getFileByUUIDAndId: IDL.Func([IDL.Text, IDL.Text], [Result__1], ['query']),
    getUUIDInfo: IDL.Func([IDL.Text], [Result_3], ['query']),
    getValue: IDL.Func([ValueRequest], [Result], ['query']),
    getValueLockStatus: IDL.Func([ValueLockStatusRequest], [Result_2], ['query']),
    insertUUIDStructure: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    isAdmin: IDL.Func([], [IDL.Bool], ['query']),
    lockAllValues: IDL.Func([ValueLockAllRequest], [Result], []),
    lockValue: IDL.Func([ValueLockRequest], [Result], []),
    removeAdmin: IDL.Func([IDL.Principal], [Result], []),
    updateManyValues: IDL.Func([IDL.Text, IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], [Result_1], []),
    updateValue: IDL.Func([ValueUpdateRequest], [Result], []),
    uploadFile: IDL.Func([IDL.Text, IDL.Text, FileMetadata], [Result], []),
  });
  return TimestorageBackend;
};
export const init = ({ IDL }) => [];
