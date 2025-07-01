import Result "mo:base/Result";
import Principal "mo:base/Principal";

module Types {
  // =================================================================
  // BASE & EXISTING TYPES
  // =================================================================
  public type UUID = Text;
  public type FileId = Text;
  public type Timestamp = Int;

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

  public type ValueLockStatus = {
    locked : Bool;
    lockedBy : ?Principal;
  };

  // =================================================================
  // PROJECT & LINKEDIN STRUCTURE TYPES
  // =================================================================

  public type ProjectStatus = {
    #draft;
    #pending;
    #approved;
    #rejected;
    #completed;
    #cancelled;
  };

  public type IssuerInfo = {
    identification : ?Text;
    email : ?Text;
    name : ?Text;
    phone : ?Text;
    website : ?Text;
    principal : ?Text;
  };

  public type LocationInfo = {
    address : ?Text;
    address2 : ?Text;
    unit : ?Text;
    floor : ?Text;
    room : ?Text;
    city : ?Text;
    state : ?Text;
    zip : ?Text;
    country : ?Text;
  };

  public type ProjectInfo = {
    identification : ?Text;
    subIdentification : ?Text;
    typeText : ?Text;
    category : ?Text;
    issuer : ?IssuerInfo;
    location : ?LocationInfo;
    version : ?Text;
    createdAt : ?Text;
  };

  public type ProjectCore = {
    owner : Principal;
    status : ProjectStatus;
    info : ProjectInfo;
  };

  // =================================================================
  // API REQUEST & RESPONSE TYPES
  // =================================================================

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

  public type ValueUnlockAllRequest = {
    uuid : Text;
  };

  public type ValueUnlockRequest = {
    uuid : Text;
    key : Text;
  };

  public type ValueRequest = {
    uuid : Text;
    key : Text;
  };

  public type ValueLockStatusRequest = {
    uuid : Text;
    key : Text;
  };

  // *** START OF FIXES FOR THIS ERROR ***

  // 1. Extracted metadata for the original FileResponse type
  public type FileResponseMetadata = {
    fileData : Text;
    mimeType : Text;
    fileName : Text;
    uploadTimestamp : Text;
  };

  // 2. Extracted metadata for the original FileMetadataResponse type
  public type FileMetadataOnly = {
    mimeType : Text;
    fileName : Text;
    uploadTimestamp : Text;
  };

  // 3. Updated the original types to use the new named types
  public type FileResponse = {
    uuid : UUID;
    metadata : FileResponseMetadata; // Correct
  };

  public type FileMetadataResponse = {
    uuid : UUID;
    metadata : FileMetadataOnly; // Correct
  };

  // *** END OF FIXES FOR THIS ERROR ***

  // (This part was fixed previously and remains correct)
  public type RemoteDocumentMetadata = {
    fileData : Text;
    mimeType : Text;
    fileName : Text;
    uploadTimestamp : Text;
  };

  public type RemoteDocumentResponse = {
    fileId : FileId;
    uuid : UUID;
    metadata : RemoteDocumentMetadata;
  };

  public type LinkedStructureIdentifier = {
    identification : ?Text;
    subIdentification : ?Text;
    typeText : ?Text;
    category : ?Text;
    positionNumber : ?Text;
    sequenceNumber : ?Text;
    floorNumber : ?Text;
    roomDescription : ?Text;
    productType : ?Text;
    brand : ?Text;
    model : ?Text;
    dimensions : ?Text;
    notes : ?Text;
  };

  public type ProjectPlacementResponse = {
    uuid : UUID;
    info : ?LinkedStructureIdentifier;
    documents : [RemoteDocumentResponse];
  };

  public type ProjectLinkedStructureResponse = {
    uuid : UUID;
    info : ?LinkedStructureIdentifier;
  };

  public type ProjectAPIResponse = {
    uuid : UUID;
    status : ProjectStatus;
    info : ProjectInfo;
    documents : [RemoteDocumentResponse];
    placements : [ProjectPlacementResponse];
    linkedStructures : [ProjectLinkedStructureResponse];
  };

  public type Result<T, E> = Result.Result<T, E>;
  public type Response<T> = Result<T, Text>;
};
