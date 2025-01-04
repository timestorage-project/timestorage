import Result "mo:base/Result";

module Types {
  public type UUID = Text;

  public type CoreData = {
    key: Text;
    value: Text;
  };

  public type MintRequest = {
    uuids: [Text];
    structures: Text;
  };

  public type ImageMetadata = {
    fileName: Text;
    fileType: Text;
    uploadTimestamp: Int;
  };

  public type ImageUploadRequest = {
    uuid: Text;
    imageData: Text; // Base64 
    metadata: ImageMetadata;
  };

  public type ImageRecord = {
    uuid: Text;
    imageData: Text; // Base64
    metadata: ImageMetadata;
  };

  public type ParamLockStatus = {
    locked: Bool;
    lockedBy: ?Principal;
  };

  public type ParamUpdateRequest = {
    uuid: Text;
    key: Text;
    newValue: Text;
  };

  public type ParamLockRequest = {
    uuid: Text;
    key: Text;
    lock: Bool;
  };

  public type SchemaLockStatus = {
    locked: Bool;
    lockedBy: ?Principal;
  };

  public type SchemaLockRequest = {
    uuid: Text;
    lock: Bool;
  };

  public type Result<T, E> = Result.Result<T, E>;
}

