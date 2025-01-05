import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

shared (msg) actor class TimestorageBackend() {
  stable var uuidToStructureStable : [(Text, Text)] = [];
  stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
  stable var adminsStable : [(Principal, Bool)] = [];
  stable var paramLocksStable : [(Text, Types.ParamLockStatus)] = [];
  stable var schemaLocksStable : [(Text, Types.SchemaLockStatus)] = [];
  stable var imageCounter : Nat = 0;

  var uuidToStructure = Storage.newUUIDStructure();
  var uuidToImages = Storage.newImageMap();
  var admins = Auth.newAdminMap();
  var paramLocks = Storage.newParamLockMap();
  var schemaLocks = Storage.newSchemaLockMap();

  // Inizializza l'admin principale con il deployer dell'actor
  let initialAdmin = msg.caller;
  admins.put(initialAdmin, true);

  system func postupgrade() {
    for ((k, v) in uuidToStructureStable.vals()) { uuidToStructure.put(k, v); };
    for ((k, v) in uuidToImagesStable.vals()) { uuidToImages.put(k, v); };
    for ((k, v) in adminsStable.vals()) { admins.put(k, v); };
    for ((k, v) in paramLocksStable.vals()) { paramLocks.put(k, v); };
    for ((k, v) in schemaLocksStable.vals()) { schemaLocks.put(k, v); };
  };

  system func preupgrade() {
    uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
    uuidToImagesStable := Iter.toArray(uuidToImages.entries());
    adminsStable := Iter.toArray(admins.entries());
    paramLocksStable := Iter.toArray(paramLocks.entries());
    schemaLocksStable := Iter.toArray(schemaLocks.entries());
  };

  // Verifica se il chiamante è admin
  public shared query (msg) func isAdmin() : async Bool {
    return Auth.isAdmin(msg.caller, admins);
  };

  // Aggiunta di un nuovo admin
  public shared (msg) func addAdmin(newAdmin: Principal) : async Result.Result<Text, Text> {
    switch (Auth.addAdmin(newAdmin, msg.caller, admins)) {
      case (#err(e)) { return #err(e); };
      case (#ok(())) { return #ok("New admin added successfully."); };
    };
  };

  // Inserimento di un UUID con struttura
  public shared (msg) func insertUUIDStructure(uuid: Text, structure: Text) : async Result.Result<Text, Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
      case (#err(e)) { return #err(e); };
      case (#ok(())) {};
    };

    if (not Utils.isValidUUID(uuid)) {
      return #err("Invalid UUID format.");
    };

    // Controllo se l'UUID esiste già
    if (uuidToStructure.get(uuid) != null) {
      return #err("UUID already exists.");
    };

    uuidToStructure.put(uuid, structure);
    return #ok("UUID inserted successfully.");
  };

  // Ottenere tutti gli UUID
  public shared query (msg) func getAllUUIDs() : async Result.Result<[Text], Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
      case (#err(e)) { return #err(e); };
      case (#ok(())) {};
    };

    return #ok(Iter.toArray(uuidToStructure.keys()));
  };

  // Caricare un'immagine associata a un UUID
  public shared (msg) func uploadImage(uuid: Text, base64ImgData: Text, metadata: Types.ImageMetadata) : async Result.Result<Text, Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
      case (#err(e)) { return #err(e); };
      case (#ok(())) {};
    };

    if (uuidToStructure.get(uuid) == null) {
      return #err("Error: UUID does not exist.");
    };

    if (metadata.fileName.size() == 0 or metadata.fileType.size() == 0) {
      return #err("Invalid metadata: File name and type cannot be empty.");
    };

    // Genera un imageId unico
    let imageId = generateUniqueImageId();

    // Crea il record dell'immagine
    let imageRecord : Storage.ImageRecord = {
      uuid = uuid;
      imageData = base64ImgData; // Base64
      metadata = metadata;
    };

    uuidToImages.put(imageId, imageRecord);
    return #ok("Image uploaded successfully with ID: " # imageId);
  };

  // Genera un ID univoco per le immagini
  func generateUniqueImageId() : Text {
    imageCounter += 1;
    return "img-" # Nat.toText(imageCounter);
  };

  // Restituisce la struttura e tutti gli imageId associati ad un dato UUID (no admin required)
  public shared query (msg) func getUUIDInfo(uuid: Text) : async Result.Result<(Text, [Text]), Text> {
    let s = uuidToStructure.get(uuid);
    if (s == null) {
      return #err("Error: UUID not found.");
    };

    let structureText = switch (s) {
      case (?val) val;
      case null "unreachable"; // non verrà mai eseguito
    };

    var imageIds : [Text] = [];
    for ((imgId, record) in uuidToImages.entries()) {
      if (record.uuid == uuid) {
        imageIds := Array.append(imageIds, [imgId]);
      };
    };

    return #ok((structureText, imageIds));
  };

  // Restituisce l'immagine dato un imageId (no admin required)
  public shared query (msg) func getImageByUUIDAndId(uuid: Text, imageId: Text) : async Result.Result<Storage.ImageRecord, Text> {
    if (not Utils.isValidUUID(uuid)) {
      return #err("Invalid UUID format.");
    };

    // Controlla se l'UUID esiste
    let s = uuidToStructure.get(uuid);
    if (s == null) {
      return #err("UUID not found.");
    };

    let imageRecord = uuidToImages.get(imageId);
    switch (imageRecord) {
      case null { return #err("No image found for the given UUID and image ID."); };
      case (?rec) {
        if (rec.uuid == uuid) {
          return #ok(rec);
        } else {
          return #err("The image does not belong to the given UUID.");
        };
      };
    };
  };

  // Funzione per modificare un parametro
  public shared (msg) func updateParam(req: Types.ParamUpdateRequest) : async Result.Result<Text, Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
      case (#err(e)) { return #err(e); };
      case (#ok(())) {};
    };

    // Controlla se l'intero schema è bloccato
    let schemaLockStatus = schemaLocks.get(req.uuid);
    switch (schemaLockStatus) {
      case (?status) {
        if (status.locked) {
          return #err("Schema is locked and cannot be modified.");
        };
      };
      case null {};
    };

    // Controlla se il parametro specifico è bloccato
    let lockKey = req.uuid # "-" # req.key;
    let paramLockStatus = paramLocks.get(lockKey);
    switch (paramLockStatus) {
      case (?status) {
        if (status.locked) {
          return #err("Parameter is locked and cannot be modified.");
        };
      };
      case null {};
    };

    // Ottieni lo schema JSON associato all'UUID
    let schema = uuidToStructure.get(req.uuid);
    switch (schema) {
      case null { return #err("UUID not found."); };
      case (?json) {
        // Verifica se la chiave esiste nello schema
        let keyExists = Utils.keyExistsInSchema(json, req.key);
        if (not keyExists) {
          return #err("Key does not exist in the schema.");
        };

        // Verifica se il tipo di dato è compatibile
        //let isTypeValid = Utils.isValueTypeValid(json, req.key, req.newValue);
        //if (not isTypeValid) {
        //  return #err("Invalid value type for the specified key.");
        //};

        // Modifica il valore nel JSON
        let updatedJson = Utils.updateJsonValue(json, req.key, "\"" # req.newValue # "\"");

        // Aggiorna lo schema nel canister
        uuidToStructure.put(req.uuid, updatedJson);
        return #ok("Parameter updated successfully.");
      };
    };
  };

  // Funzione per bloccare/sbloccare un parametro
  public shared (msg) func lockParam(req: Types.ParamLockRequest) : async Result.Result<Text, Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
        case (#err(e)) { return #err(e); };
        case (#ok(())) {};
    };

    // Verifica se l'UUID esiste
    if (uuidToStructure.get(req.uuid) == null) {
        return #err("UUID not found.");
    };

    // Controlla se lo schema è già bloccato
    let schemaLockStatus = schemaLocks.get(req.uuid);
    switch (schemaLockStatus) {
        case (?status) {
        if (status.locked) {
            return #err("Schema is already locked. Cannot lock individual parameters.");
        };
        };
        case null {};
    };

    let lockKey = req.uuid # "-" # req.key;
    let paramLockStatus = paramLocks.get(lockKey);

    switch (paramLockStatus) {
        case (?status) {
        if (status.locked) {
            // Se il parametro è già bloccato
            if (req.lock) {
            return #err("Parameter is already locked.");
            } else {
            // Se stai cercando di sbloccarlo, verifica che sia bloccato dallo stesso admin
            if (status.lockedBy != ?msg.caller) {
                return #err("Parameter is locked by another admin and cannot be modified.");
            };
            };
        } else {
            // Se il parametro non è bloccato
            if (not req.lock) {
            return #ok("Parameter is already unlocked.");
            };
        };
        };
        case null {
        // Se il parametro non è mai stato bloccato
        if (not req.lock) {
            return #ok("Parameter is already unlocked.");
        };
        };
    };

    let newStatus : Types.ParamLockStatus = {
        locked = req.lock;
        lockedBy = if (req.lock) ?msg.caller else null;
    };

    paramLocks.put(lockKey, newStatus);
    return #ok(if (req.lock) "Parameter locked successfully." else "Parameter unlocked successfully.");
    };

  // Funzione per bloccare/sbloccare l'intero schema
  public shared (msg) func lockSchema(req: Types.SchemaLockRequest) : async Result.Result<Text, Text> {
    switch (Auth.requireAdmin(msg.caller, admins)) {
        case (#err(e)) { return #err(e); };
        case (#ok(())) {};
    };

    // Verifica se l'UUID esiste
    if (uuidToStructure.get(req.uuid) == null) {
        return #err("UUID not found.");
    };

    let schemaLockStatus = schemaLocks.get(req.uuid);

    switch (schemaLockStatus) {
        case (?status) {
        if (status.locked) {
            // Se lo schema è già bloccato
            if (req.lock) {
            return #err("Schema is already locked.");
            } else {
            // Se stai cercando di sbloccarlo, verifica che sia bloccato dallo stesso admin
            if (status.lockedBy != ?msg.caller) {
                return #err("Schema is locked by another admin and cannot be modified.");
            };
            };
        } else {
            // Se lo schema non è bloccato
            if (not req.lock) {
            return #ok("Schema is already unlocked.");
            };
        };
        };
        case null {
        // Se lo schema non è mai stato bloccato
        if (not req.lock) {
            return #ok("Schema is already unlocked.");
        };
        };
    };

    let newStatus : Types.SchemaLockStatus = {
        locked = req.lock;
        lockedBy = if (req.lock) ?msg.caller else null;
    };

    schemaLocks.put(req.uuid, newStatus);
    return #ok(if (req.lock) "Schema locked successfully." else "Schema unlocked successfully.");
    };

  // Funzione per verificare se l'intero schema è bloccato
  public shared query (msg) func isSchemaLocked(uuid: Text) : async Result.Result<Bool, Text> {
    let schemaLockStatus = schemaLocks.get(uuid);
    switch (schemaLockStatus) {
      case (?status) { return #ok(status.locked); };
      case null { return #ok(false); };
    };
  };
};