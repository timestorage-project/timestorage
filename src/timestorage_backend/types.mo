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

  public type SchemaLockStatus = {
    locked: Bool;
    lockedBy: ?Principal;
  };

  public type SchemaLockRequest = {
    uuid: Text;
    lock: Bool;
  };

  public type ValueUpdateRequest = {
    uuid: Text;
    key: Text;
    newValue: Text;
  };

  public type ValueLockStatus = {
    locked: Bool;
    lockedBy: ?Principal;
  };

  public type ValueLockRequest = {
    uuid: Text;
    key: Text;
    lock: Bool;
  };

  // Richiesta per ottenere lo stato di blocco di un valore
  public type ValueLockStatusRequest = {
    uuid: Text;
    key: Text;
  };

  // Richiesta per ottenere un valore
  public type ValueRequest = {
    uuid: Text;
    key: Text;
  };
  
  public type ErrorCode = {
    #InvalidUUID;
    #SchemaLocked;
    #ValueLocked;
    #KeyNotFound;
    #Unauthorized;
  };

  public type Result<T, E> = Result.Result<T, E>;
}