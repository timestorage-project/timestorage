import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Debug "mo:base/Debug";

shared (msg) actor class TimestorageBackend() {
    stable var uuidToStructureStable : [(Text, Text)] = [];
    stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
    stable var uuidToValuesStable : [(Text, Text)] = [];
    stable var uuidToKeysStable : [(Text, [Text])] = [];
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var schemaLocksStable : [(Text, Types.SchemaLockStatus)] = [];
    stable var valueLocksStable : [(Text, Types.ValueLockStatus)] = [];
    stable var imageCounter : Nat = 0;

    var uuidToStructure = Storage.newUUIDStructure();
    var uuidToImages = Storage.newImageMap();
    var uuidToValues = Storage.newValueMap();
    var uuidToKeys = Storage.newKeyMap();
    var admins = Auth.newAdminMap();
    var schemaLocks = Storage.newSchemaLockMap();
    var valueLocks = Storage.newValueLockMap();

    // Inizializza l'admin principale con il deployer dell'actor
    let initialAdmin = msg.caller;
    admins.put(initialAdmin, true);

    system func postupgrade() {
        for ((k, v) in uuidToStructureStable.vals()) { uuidToStructure.put(k, v); };
        for ((k, v) in uuidToImagesStable.vals()) { uuidToImages.put(k, v); };
        for ((k, v) in uuidToValuesStable.vals()) { uuidToValues.put(k, v); };
        for ((k, v) in uuidToKeysStable.vals()) { uuidToKeys.put(k, v); };
        for ((k, v) in adminsStable.vals()) { admins.put(k, v); };
        for ((k, v) in schemaLocksStable.vals()) { schemaLocks.put(k, v); };
        for ((k, v) in valueLocksStable.vals()) { valueLocks.put(k, v); };
    };

    system func preupgrade() {
        uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
        uuidToImagesStable := Iter.toArray(uuidToImages.entries());
        uuidToValuesStable := Iter.toArray(uuidToValues.entries());
        uuidToKeysStable := Iter.toArray(uuidToKeys.entries());
        adminsStable := Iter.toArray(admins.entries());
        schemaLocksStable := Iter.toArray(schemaLocks.entries());
        valueLocksStable := Iter.toArray(valueLocks.entries());
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
    public shared (msg) func insertUUIDStructure(uuid: Text, schema: Text) : async Result.Result<Text, Text> {
        Debug.print("Starting insertUUIDStructure for UUID: " # uuid);

        // Controllo admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) {
                Debug.print("Admin check failed: " # e);
                return #err(e);
            };
            case (#ok(())) {
                Debug.print("Admin check passed.");
            };
        };

        // Controllo formato UUID
        if (not Utils.isValidUUID(uuid)) {
            Debug.print("Invalid UUID format: " # uuid);
            return #err("Invalid UUID format.");
        };

        // Controlla se l'UUID esiste già
        if (uuidToStructure.get(uuid) != null) {
            Debug.print("UUID already exists: " # uuid);
            return #err("UUID already exists.");
        };

        Debug.print("Inserting schema for UUID: " # uuid);
        uuidToStructure.put(uuid, schema);

        schemaLocks.put(uuid, {
            locked = true;
            lockedBy = ?msg.caller;
        });

        Debug.print("Generating initial JSON for UUID: " # uuid);
        let (initialJson, keys) = Utils.generateInitialJson(schema);
        Debug.print("Initial JSON generated: " # initialJson);

        Debug.print("Storing initial JSON for UUID: " # uuid);
        uuidToValues.put(uuid, initialJson);

        // Memorizza le chiavi estratte
        uuidToKeys.put(uuid, keys);

        Debug.print("UUID inserted successfully and schema locked.");
        return #ok("UUID inserted successfully and schema locked.");
    };

    // Upload di un'immagine
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

        let imageRecord : Storage.ImageRecord = {
            uuid = uuid;
            imageData = base64ImgData;
            metadata = metadata;
        };

        uuidToImages.put(imageId, imageRecord);
        return #ok("Image uploaded successfully with ID: " # imageId);
    };

    // Generazione di un ID univoco per le immagini
    func generateUniqueImageId() : Text {
        imageCounter += 1;
        return "img-" # Nat.toText(imageCounter);
    };

    // Restituisce il JSON completo associato a un UUID
    public shared query (msg) func getFullJson(uuid: Text) : async Result.Result<Text, Text> {
        switch (uuidToValues.get(uuid)) {
            case null {
                return #err("UUID not found.");
            };
            case (?json) {
                return #ok(json);
            };
        };
    };

    // Restituisce la struttura e tutti gli imageId associati a un UUID
    public shared query (msg) func getUUIDInfo(uuid: Text) : async Result.Result<(Text, [Text]), Text> {
        let s = uuidToStructure.get(uuid);
        if (s == null) {
            return #err("Error: UUID not found.");
        };

        // Sblocchiamo s
        let structureText = switch (s) {
            case (?val) val;
            case null "unreachable"; 
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

        let s = uuidToStructure.get(uuid);
        if (s == null) {
            return #err("UUID not found.");
        };

        let imageRecordOpt = uuidToImages.get(imageId);
        switch (imageRecordOpt) {
            case null {
                return #err("No image found for the given UUID and image ID.");
            };
            case (?imageRecord) {
                if (imageRecord.uuid == uuid) {
                    return #ok(imageRecord);
                } else {
                    return #err("The image does not belong to the given UUID.");
                };
            };
        };
    };

    // Ottenere tutti gli UUID (con paginazione)
    public shared query (msg) func getUUIDs(offset: Nat, limit: Nat) : async Result.Result<[Text], Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        let allUUIDs = Iter.toArray(uuidToStructure.keys());
        if (offset >= allUUIDs.size()) {
            return #err("Offset exceeds the number of available UUIDs.");
        };

        let end = Nat.min(offset + limit, allUUIDs.size());
        let paginatedUUIDs = Array.tabulate<Text>(end - offset, func(i) { 
            allUUIDs[offset + i] 
        });

        return #ok(paginatedUUIDs);
    };

    // Aggiorna un valore all’interno del JSON
    public shared (msg) func updateValue(req: Types.ValueUpdateRequest) : async Result.Result<Text, Text> {
        // Controllo admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) {
                Debug.print("Admin check failed: " # e);
                return #err(e);
            };
            case (#ok(())) {
                Debug.print("Admin check passed.");
            };
        };

        // Verifica se l'UUID esiste
        let currentJsonOpt = uuidToValues.get(req.uuid);
        switch (currentJsonOpt) {
            case null {
                return #err("UUID not found or values not initialized.");
            };
            case (?json) {
                // Controlla se il valore è bloccato
                let lockKey = req.uuid # "-" # req.key;
                let valueLockStatus = valueLocks.get(lockKey);
                switch (valueLockStatus) {
                    case (?status) {
                        if (status.locked and status.lockedBy != ?msg.caller) {
                            return #err("Value is locked by another admin and cannot be modified.");
                        };
                    };
                    case null {};
                };

                // Aggiorna il valore nel JSON
                let updatedJson = Utils.updateJsonValue(json, req.key, req.newValue);
                uuidToValues.put(req.uuid, updatedJson);
                return #ok("Value updated successfully.");
            };
        };
    };

    // Blocca o sblocca un valore
    public shared (msg) func lockValue(req: Types.ValueLockRequest) : async Result.Result<Text, Text> {
        // Controllo admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) {
                Debug.print("Admin check failed: " # e);
                return #err(e);
            };
            case (#ok(())) {
                Debug.print("Admin check passed.");
            };
        };

        // Verifica se l'UUID esiste
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        let lockKey = req.uuid # "-" # req.key;
        let valueLockStatus = valueLocks.get(lockKey);

        switch (valueLockStatus) {
            case (?status) {
                if (status.locked) {
                    if (req.lock) {
                        return #err("Value is already locked.");
                    } else {
                        if (status.lockedBy != ?msg.caller) {
                            return #err("Value is locked by another admin and cannot be modified.");
                        };
                    };
                } else {
                    if (not req.lock) {
                        return #ok("Value is already unlocked.");
                    };
                };
            };
            case null {
                // Se non esiste alcun record e stiamo sbloccando (req.lock = false)
                if (not req.lock) {
                    return #ok("Value is already unlocked.");
                };
            };
        };

        let newStatus : Types.ValueLockStatus = {
            locked = req.lock;
            lockedBy = if (req.lock) ?msg.caller else null;
        };

        valueLocks.put(lockKey, newStatus);
        return #ok(if (req.lock) 
                    "Value locked successfully." 
                else 
                    "Value unlocked successfully.");
    };

    // Ottieni lo stato di blocco di un valore specifico
    public shared query (msg) func getValueLockStatus(req: Types.ValueLockStatusRequest) : async Result.Result<Types.ValueLockStatus, Text> {
        // Controllo admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) {
                Debug.print("Admin check failed: " # e);
                return #err(e);
            };
            case (#ok(())) {
                Debug.print("Admin check passed.");
            };
        };

        let lockKey = req.uuid # "-" # req.key;
        let valueLockStatus = valueLocks.get(lockKey);

        switch (valueLockStatus) {
            case (?status) {
                return #ok(status);
            };
            case null {
                return #err("Value lock status not found.");
            };
        };
    };

    // Ottieni un singolo valore dal JSON, data la chiave
    public shared query (msg) func getValue(req: Types.ValueRequest) : async Result.Result<Text, Text> {
        // Verifica se l'UUID esiste
        let currentJsonOpt = uuidToValues.get(req.uuid);
        switch (currentJsonOpt) {
            case null {
                return #err("UUID not found.");
            };
            case (?json) {
                Debug.print("JSON for UUID: " # req.uuid # " is: " # json);

                // Converti il JSON in una mappa
                let mapOpt = Utils.jsonToMap(json);
                switch (mapOpt) {
                    case null {
                        return #err("JSON structure is invalid or not parseable.");
                    };
                    case (?map) {
                        // Cerca la chiave nella mappa
                        let valueOpt = map.get(req.key);
                        switch (valueOpt) {
                            case null {
                                return #err("Key not found.");
                            };
                            case (?val) {
                                return #ok(val);
                            };
                        };
                    };
                };
            };
        };
    };
};