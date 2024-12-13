import Types "./types";
import Auth "./auth";
import Principal "mo:base/Principal";
import Storage "./storage";

module {
  type MintRequest = Types.MintRequest;
  type ImageUploadRequest = Types.ImageUploadRequest;

  private var uuidCounter : Nat = 0n;
  
  private func generateUUID() : Text {
    uuidCounter += 1n;
    return "uuid-" # Nat.toText(uuidCounter)
  };

  public func getUuidIndex() : [Text] {
    Storage.getAllUUIDs()
  };

  public func getUuidStructure() : [(Text, Text)] {
    Storage.getAllUUIDStructures()
  };

  public func getUuidContainer() : [(Text, Text)] {
    Storage.getAllUUIDContainers()
  };

  public func getCoreByKey(key: Text) : ?{key: Text; value: Text} {
    Storage.getCoreData(key)
  };

  public func getDataByKey(key: Text) : ?Text {
    Storage.getDataValue(key)
  };

  public func getAllDataByKeys(keys: [Text]) : [(Text, ?Text)] {
    keys.map(func (k) { (k, Storage.getDataValue(k)) })
  };

  public func mint(req: MintRequest) : Text {
    Auth.requireEditorOrAbove(Storage.getPrincipalRole);

    let toMintUUIDs = req.uuids;
    for (u in toMintUUIDs.vals()) {
      if (Storage.uuidExists(u)) {
        return "Error: UUID " # u # " already exists."
      }
    };

    for (u in toMintUUIDs.vals()) {
      Storage.insertUUIDStructure(u, req.structures);
    };

    "Mint successful"
  };

  public func uploadUUIDImage(req: ImageUploadRequest) : Text {
    Auth.requireEditorOrAbove(Storage.getPrincipalRole);

    if (not Storage.uuidExists(req.uuid)) {
      return "Error: UUID not found"
    };

    if (Blob.size(req.imageData) > 10_000_000) {
      return "Error: Image too large"
    };

    let imageId = Storage.generateUniqueImageId();
    Storage.insertImage(imageId, req.imageData, req.metadata);
    Storage.linkImageToUUID(req.uuid, imageId);

    return "Image upload successful"
  };

  public func assignRole(p: Principal, role: {admin: Bool; editor: Bool; reader: Bool}) : Text {
    Auth.requireAdmin(Storage.getPrincipalRole);

    let newRole = {
      admin = role.admin;
      editor = role.editor;
      reader = role.reader;
    };
    Storage.setPrincipalRole(p, newRole);
    return "Role assigned successfully"
  };

  public func getRole(p: Principal) : ?{admin: Bool; editor: Bool; reader: Bool} {
    Storage.getPrincipalRole(p)
  };
}
