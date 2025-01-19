export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text })
  const Result_3 = IDL.Variant({ ok: IDL.Vec(IDL.Text), err: IDL.Text })
  const ImageMetadata = IDL.Record({
    fileName: IDL.Text,
    fileType: IDL.Text,
    uploadTimestamp: IDL.Int
  })
  const ImageRecord = IDL.Record({
    imageData: IDL.Vec(IDL.Nat8),
    metadata: ImageMetadata,
    uuid: IDL.Text
  })
  const Result_2 = IDL.Variant({ ok: ImageRecord, err: IDL.Text })
  const Result_1 = IDL.Variant({
    ok: IDL.Tuple(IDL.Text, IDL.Vec(IDL.Text)),
    err: IDL.Text
  })
  const TimestorageBackend = IDL.Service({
    addAdmin: IDL.Func([IDL.Principal], [Result], []),
    getAllUUIDs: IDL.Func([], [Result_3], ['query']),
    getImage: IDL.Func([IDL.Text], [Result_2], ['query']),
    getUUIDInfo: IDL.Func([IDL.Text], [Result_1], ['query']),
    insertUUIDStructure: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    isAdmin: IDL.Func([], [IDL.Bool], ['query']),
    uploadImage: IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8), ImageMetadata], [Result], [])
  })
  return TimestorageBackend
}
export const init = ({ IDL }) => {
  return []
}
