import Result "mo:base/Result";
import Principal "mo:base/Principal";

module Types {
  // Type aliases
  public type UUID = Text;
  public type FileId = Text;
  public type Timestamp = Int;

  // Stable storage
  public type StableStorage = {
    uuidToStructure : [(Text, Text)];
    uuidKeyValue : [(Text, [(Text, Text)])];
    uuidToFiles : [(Text, FileRecord)];
    admins : [(Principal, Bool)];
    valueLocks : [(Text, ValueLockStatus)];
    fileCounter : Nat;
  };

  // Request types
  public type MintRequest = {
    uuids : [Text];
    structures : Text;
  };

  public type ValueUpdateRequest = {
    uuid : Text;
    key : Text;
    newValue : Text;
  };

  public type ValueLockRequest = {
    uuid : Text;
    key : Text;
    lock : Bool;
  };

  public type ValueLockAllRequest = {
    uuid : Text;
    lock : Bool;
  };

  public type ValueLockStatusRequest = {
    uuid : Text;
    key : Text;
  };

  public type ValueUnlockRequest = {
    uuid : Text;
    key : Text;
  };

  public type ValueUnlockAllRequest = {
    uuid : Text;
  };

  public type ValueRequest = {
    uuid : Text;
    key : Text;
  };

  // File types
  public type FileMetadata = {
    fileName : Text;
    mimeType : Text;
    uploadTimestamp : Timestamp;
  };

  public type FileRecord = {
    uuid : UUID;
    fileData : Text;
    metadata : FileMetadata;
  };

  public type FileUploadRequest = {
    uuid : UUID;
    fileData : Text;
    metadata : FileMetadata;
  };

  // Response types
  public type FileResponse = {
    uuid : UUID;
    metadata : {
      fileData : Text;
      mimeType : Text;
      fileName : Text;
      uploadTimestamp : Text;
    };
  };

  // Response types for file metadata only
  public type FileMetadataResponse = {
    uuid : UUID;
    metadata : {
      mimeType : Text;
      fileName : Text;
      uploadTimestamp : Text;
    };
  };

  public type UUIDInfoResponse = {
    schema : Text;
    values : [(Text, Text)];
    lockStatuses : [(Text, Text)];
    files : [FileResponse];
  };

  // State types
  public type ValueLockStatus = {
    locked : Bool;
    lockedBy : ?Principal;
  };

  // Result types
  public type Result<T, E> = Result.Result<T, E>;
  public type Response<T> = Result<T, Text>;
};
