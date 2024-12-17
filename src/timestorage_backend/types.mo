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
      imageData: Blob;
      metadata: ImageMetadata;
    };
    public type Result<T, E> = Result.Result<T, E>;
}

