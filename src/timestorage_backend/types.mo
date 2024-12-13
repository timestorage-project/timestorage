module Types {
  public type UUID = Text;

  public type CoreData = {
    key: Text;
    value: Text;
  };

  public type MintRequest = {
    uuids: [Text];
    structures: Text; // JSON serialized structure
  };

  public type ImageMetadata = {
    fileName: Text;
    fileType: Text;
    uploadTimestamp: Int;
  };

  public type ImageUploadRequest = {
    uuid: Text;
    imageData: Blob;
    metadata: ImageMetadata;
  };

  public type UUIDStructure = {
    uuid: UUID;
    structure: Text;
  };

  public type UUIDContainer = {
    uuid: UUID;
    data: CoreData;
  };

  public type AuthorizationRole = {
    admin: Bool;
    editor: Bool;
    reader: Bool;
  };
}
