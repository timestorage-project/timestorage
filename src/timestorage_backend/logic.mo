import Types "./types";
import Auth "./auth";
import Principal "mo:base/Principal";

module {
  // Funzione per il mint di nuovi UUID
  public func mint(req: Types.MintRequest, caller: Principal, admins: [Principal], insertUUID: (Text, Text) -> (), uuidExists: (Text) -> Bool) : Text {
    Auth.requireAdmin(caller, admins); // Controllo admin

    for (u in req.uuids.vals()) {
      if (uuidExists(u)) {
        return "Error: UUID " # u # " already exists.";
      };
    };

    for (u in req.uuids.vals()) {
      insertUUID(u, req.structures);
    };

    return "Mint successful";
  };

  // Funzione per caricare immagini associate a un UUID
  public func uploadUUIDImage(req: Types.ImageUploadRequest, caller: Principal, admins: [Principal], uuidExists: (Text) -> Bool, generateImageId: () -> Text, linkImage: (Text, Text) -> ()) : Text {
    Auth.requireAdmin(caller, admins); // Controllo admin

    if (not uuidExists(req.uuid)) {
      return "Error: UUID not found.";
    };

    let imageId = generateImageId();
    linkImage(req.uuid, imageId);

    return "Image upload successful with ID: " # imageId;
  };
}

