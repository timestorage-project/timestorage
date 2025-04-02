import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Int "mo:base/Int";

shared (msg) actor class TimestorageBackend() {

    type UUID = Types.UUID;
    type FileRecord = Types.FileRecord;
    type ValueLockStatus = Types.ValueLockStatus;
    type Result<T, E> = Types.Result<T, E>;
    type Response<T> = Types.Response<T>;

    // Stable state
    stable var uuidToStructureStable : [(UUID, Text)] = [];
    stable var uuidKeyValueStable : [(UUID, [(Text, Text)])] = [];
    stable var uuidToFilesStable : [(UUID, FileRecord)] = [];
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var editorsStable : [(Principal, Bool)] = [];
    stable var uuidOwnersStable : [(Text, Principal)] = [];
    stable var valueLocksStable : [(Text, ValueLockStatus)] = [];
    stable var fileCounter : Nat = 0;

    // Nuovo stato stabile per template/modelli
    stable var modelToFilesStable : [(Text, [Text])] = []; // Modello -> [FileIDs]
    stable var fileToModelsStable : [(Text, [Text])] = []; // FileID -> [Modelli]

    // Volatile state
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidKeyValueMap = Storage.newUUIDKeyValueMap();
    var uuidToFiles = Storage.newFileMap();
    var admins = Auth.newAdminMap();
    var editors = Auth.newEditorMap();
    var uuidOwners = Storage.newUUIDOwnerMap();
    var valueLocks = Storage.newValueLockMap();

    // Nuovo stato volatile per template/modelli
    var modelToFiles = Storage.newModelFilesMap(); // Modello -> [FileIDs]
    var fileToModels = Storage.newFileModelsMap(); // FileID -> [Modelli]

    // Initial admin setup
    let initialAdmin = msg.caller;
    admins.put(initialAdmin, true);

    // Migration functions
    system func postupgrade() {
        // Restore uuidToStructure
        for ((u, s) in uuidToStructureStable.vals()) {
            uuidToStructure.put(u, s);
        };

        // Restore uuidToFiles
        for ((k, v) in uuidToFilesStable.vals()) {
            uuidToFiles.put(k, v);
        };

        // Restore uuidKeyValueMap
        for ((u, keyVals) in uuidKeyValueStable.vals()) {
            let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
            for ((k, v) in keyVals.vals()) {
                subMap.put(k, v);
            };
            uuidKeyValueMap.put(u, subMap);
        };

        // Restore admins
        for ((p, isA) in adminsStable.vals()) {
            admins.put(p, isA);
        };

        // Restore editors
        for ((p, isE) in editorsStable.vals()) {
            editors.put(p, isE);
        };

        // Restore valueLocks
        for ((lk, lockVal) in valueLocksStable.vals()) {
            valueLocks.put(lk, lockVal);
        };

        // Restore uuidOwners
        for ((u, p) in uuidOwnersStable.vals()) {
            uuidOwners.put(u, p);
        };

        for ((u, _) in uuidToStructureStable.vals()) {
            if (uuidOwners.get(u) == null) {
                uuidOwners.put(u, initialAdmin);
            };
        };

        // Restore modelToFiles
        for ((model, fileIds) in modelToFilesStable.vals()) {
            modelToFiles.put(model, fileIds);
        };

        // Restore fileToModels
        for ((fileId, models) in fileToModelsStable.vals()) {
            fileToModels.put(fileId, models);
        };
    };

    system func preupgrade() {
        // Save uuidToStructure
        uuidToStructureStable := Iter.toArray(uuidToStructure.entries());

        // Save uuidKeyValueMap
        var arr : [(Text, [(Text, Text)])] = [];
        for ((u, subMap) in uuidKeyValueMap.entries()) {
            let keyVals = Iter.toArray(subMap.entries());
            arr := Array.append(arr, [(u, keyVals)]);
        };
        uuidKeyValueStable := arr;

        // Save uuidToFiles
        uuidToFilesStable := Iter.toArray(uuidToFiles.entries());

        // Save uuidOwners
        uuidOwnersStable := Iter.toArray(uuidOwners.entries());

        // Save admins
        adminsStable := Iter.toArray(admins.entries());

        // Save editors
        editorsStable := Iter.toArray(editors.entries());

        // Save valueLocks
        valueLocksStable := Iter.toArray(valueLocks.entries());

        // Save modelToFiles
        modelToFilesStable := Iter.toArray(modelToFiles.entries());

        // Save fileToModels
        fileToModelsStable := Iter.toArray(fileToModels.entries());
    };

    // isAdmin function
    public shared query (msg) func isAdmin() : async Bool {
        return Auth.isAdmin(msg.caller, admins);
    };

    // isEditor function
    public shared query (msg) func isEditor() : async Bool {
        Auth.isEditor(msg.caller, editors);
    };

    // addAdmin function
    public shared (msg) func addAdmin(newAdmin : Principal) : async Result.Result<Text, Text> {
        switch (Auth.addAdmin(newAdmin, msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("New admin added successfully.") };
        };
    };

    // addEditor function
    public shared (msg) func addEditor(newEditor : Principal) : async Result.Result<Text, Text> {
        switch (Auth.addEditor(newEditor, msg.caller, admins, editors)) {
            case (#err(e)) { #err(e) };
            case (#ok(())) { #ok("New editor added successfully.") };
        };
    };

    // removeAdmin function
    public shared (msg) func removeAdmin(adminToRemove : Principal) : async Result.Result<Text, Text> {
        switch (Auth.removeAdmin(adminToRemove, msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("Admin removed successfully.") };
        };
    };

    // removeEditor function
    public shared (msg) func removeEditor(editorToRemove : Principal) : async Result.Result<Text, Text> {
        switch (Auth.removeEditor(editorToRemove, msg.caller, admins, editors)) {
            case (#err(e)) { #err(e) };
            case (#ok(())) { #ok("Editor removed successfully.") };
        };
    };

    // insertUUIDStructure function
    public shared (msg) func insertUUIDStructure(uuid : Text, schema : Text) : async Result.Result<Text, Text> {

        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (uuidToStructure.get(uuid) != null) {
            return #err("UUID already exists.");
        };

        // Save the schema
        uuidToStructure.put(uuid, schema);

        // Register the owner
        uuidOwners.put(uuid, msg.caller);

        // Initialize the value submap
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        uuidKeyValueMap.put(uuid, subMap);

        return #ok("UUID inserted successfully.");
    };

    // updateUUIDStructure function - allows admins to update the structure of an existing UUID
    public shared (msg) func updateUUIDStructure(uuid : Text, newSchema : Text) : async Result.Result<Text, Text> {
        // Check if the caller is an admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        // Check if the UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err("UUID does not exist. Please create it first with insertUUIDStructure.");
        };

        // Update the structure/schema
        uuidToStructure.put(uuid, newSchema);

        return #ok("UUID structure updated successfully.");
    };

    // createEmptyUUID function - creates a UUID without schema, which can be added later
    public shared (msg) func createEmptyUUID(uuid : Text) : async Result.Result<Text, Text> {
        // Check if the caller is an admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (uuidToStructure.get(uuid) != null) {
            return #err("UUID already exists.");
        };

        // Save an empty schema
        uuidToStructure.put(uuid, "{}");

        // Register the owner
        uuidOwners.put(uuid, msg.caller);

        // Initialize the value submap
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        uuidKeyValueMap.put(uuid, subMap);

        return #ok("UUID created successfully without structure. Use updateUUIDStructure to add structure later.");
    };

    // Upload an image associated with a UUID and optional model
    public shared (msg) func uploadFile(uuid : Text, base64FileData : Text, metadata : Types.FileMetadata, modelId : ?Text) : async Result.Result<Text, Text> {

        // Check if the UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err("Error: UUID does not exist.");
        };

        // Validate metadata
        if (metadata.fileName.size() == 0 or metadata.mimeType.size() == 0) {
            return #err("Invalid metadata: File name and mimeType cannot be empty.");
        };

        // Generate a unique file ID
        let fileId = generateUniqueFileId();

        // Create a new file record
        let fileRecord : Storage.FileRecord = {
            uuid = uuid;
            fileData = base64FileData; // Base64
            metadata = metadata;
        };

        uuidToFiles.put(fileId, fileRecord);

        // Se è fornito un ID del modello, associa il file a quel modello
        switch (modelId) {
            case (null) {
                // Nessun modello specificato, nessuna associazione da fare
            };
            case (?model) {
                // Aggiungi fileId all'elenco dei file associati al modello
                let existingFiles = switch (modelToFiles.get(model)) {
                    case (null) { [] };
                    case (?files) { files };
                };

                if (not Utils.contains<Text>(existingFiles, fileId, Text.equal)) {
                    let updatedFiles = Array.append(existingFiles, [fileId]);
                    modelToFiles.put(model, updatedFiles);
                };

                // Aggiungi il modello all'elenco dei modelli associati al file
                let existingModels = switch (fileToModels.get(fileId)) {
                    case (null) { [] };
                    case (?models) { models };
                };

                if (not Utils.contains<Text>(existingModels, model, Text.equal)) {
                    let updatedModels = Array.append(existingModels, [model]);
                    fileToModels.put(fileId, updatedModels);
                };
            };
        };

        return #ok("File uploaded successfully with ID: " # fileId);
    };

    // Helper function to generate a unique file ID
    func generateUniqueFileId() : Text {
        fileCounter += 1;
        return "file-" # Nat.toText(fileCounter);
    };

    // Nuova funzione: associa un file esistente a un modello
    public shared (msg) func associateFileToModel(fileId : Text, modelId : Text) : async Result.Result<Text, Text> {
        // Verifica se il file esiste
        let fileOpt = uuidToFiles.get(fileId);
        switch (fileOpt) {
            case (null) {
                return #err("File not found.");
            };
            case (?_) {
                // Aggiungi il fileId all'elenco dei file del modello
                let existingFiles = switch (modelToFiles.get(modelId)) {
                    case (null) { [] };
                    case (?files) { files };
                };

                if (not Utils.contains<Text>(existingFiles, fileId, Text.equal)) {
                    let updatedFiles = Array.append(existingFiles, [fileId]);
                    modelToFiles.put(modelId, updatedFiles);
                } else {
                    return #err("File already associated with this model.");
                };

                // Aggiungi il modello all'elenco dei modelli del file
                let existingModels = switch (fileToModels.get(fileId)) {
                    case (null) { [] };
                    case (?models) { models };
                };

                if (not Utils.contains<Text>(existingModels, modelId, Text.equal)) {
                    let updatedModels = Array.append(existingModels, [modelId]);
                    fileToModels.put(fileId, updatedModels);
                };

                return #ok("File associated with model successfully.");
            };
        };
    };

    // Nuova funzione: dissocia un file da un modello
    public shared (msg) func disassociateFileFromModel(fileId : Text, modelId : Text) : async Result.Result<Text, Text> {
        // Verifica se il file esiste
        let fileOpt = uuidToFiles.get(fileId);
        switch (fileOpt) {
            case (null) {
                return #err("File not found.");
            };
            case (?_) {
                // Rimuovi il fileId dall'elenco dei file del modello
                let existingFiles = switch (modelToFiles.get(modelId)) {
                    case (null) { [] };
                    case (?files) { files };
                };

                if (Utils.contains<Text>(existingFiles, fileId, Text.equal)) {
                    let updatedFiles = Array.filter<Text>(existingFiles, func(id) { id != fileId });
                    modelToFiles.put(modelId, updatedFiles);
                } else {
                    return #err("File is not associated with this model.");
                };

                // Rimuovi il modello dall'elenco dei modelli del file
                let existingModels = switch (fileToModels.get(fileId)) {
                    case (null) { [] };
                    case (?models) { models };
                };

                if (Utils.contains<Text>(existingModels, modelId, Text.equal)) {
                    let updatedModels = Array.filter<Text>(existingModels, func(id) { id != modelId });
                    fileToModels.put(fileId, updatedModels);
                };

                return #ok("File disassociated from model successfully.");
            };
        };
    };

    // Nuova funzione: ottieni tutti i file associati a un modello
    public shared query (msg) func getFilesByModel(modelId : Text) : async Types.Result<[Types.FileMetadataResponse], Text> {
        var fileResponses : [Types.FileMetadataResponse] = [];

        let fileIds = switch (modelToFiles.get(modelId)) {
            case (null) { return #ok([]) };
            case (?ids) { ids };
        };

        for (fileId in fileIds.vals()) {
            let fileOpt = uuidToFiles.get(fileId);

            switch (fileOpt) {
                case (null) {
                    // File ID exists in the model but actual file not found, skip
                };
                case (?record) {
                    let responseItem : Types.FileMetadataResponse = {
                        uuid = record.uuid;
                        metadata = {
                            mimeType = record.metadata.mimeType;
                            fileName = record.metadata.fileName;
                            uploadTimestamp = Int.toText(record.metadata.uploadTimestamp);
                        };
                    };
                    fileResponses := Array.append(fileResponses, [responseItem]);
                };
            };
        };

        return #ok(fileResponses);
    };

    // Nuova funzione: crea un nuovo UUID e associa automaticamente i file dal modello
    public shared (msg) func createUUIDFromModel(uuid : Text, schema : Text, modelId : Text) : async Result.Result<Text, Text> {
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (uuidToStructure.get(uuid) != null) {
            return #err("UUID already exists.");
        };

        // Save the schema
        uuidToStructure.put(uuid, schema);

        // Register the owner
        uuidOwners.put(uuid, msg.caller);

        // Initialize the value submap
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        uuidKeyValueMap.put(uuid, subMap);

        // Associa i file dal modello al nuovo UUID
        var associatedFiles : Nat = 0;
        let modelFiles = switch (modelToFiles.get(modelId)) {
            case (null) { [] };
            case (?files) { files };
        };

        for (fileId in modelFiles.vals()) {
            let fileOpt = uuidToFiles.get(fileId);

            switch (fileOpt) {
                case (null) {
                    // Skip file if not found
                };
                case (?fileRecord) {
                    // Crea una copia del file per il nuovo UUID
                    let newFileId = generateUniqueFileId();

                    let newFileRecord : Storage.FileRecord = {
                        uuid = uuid; // Il nuovo UUID
                        fileData = fileRecord.fileData;
                        metadata = fileRecord.metadata;
                    };

                    uuidToFiles.put(newFileId, newFileRecord);
                    associatedFiles += 1;
                };
            };
        };

        return #ok("UUID created successfully with " # Nat.toText(associatedFiles) # " files associated from model.");
    };

    // getFileByUUIDAndId function
    public shared query (msg) func getFileByUUIDAndId(uuid : Text, fileId : Text) : async Types.Result<Types.FileResponse, Text> {
        let fileOpt = uuidToFiles.get(fileId);

        // Check if the file exists and belongs to the given UUID
        switch (fileOpt) {
            case null {
                return #err("File not found.");
            };
            case (?fileRecord) {
                if (fileRecord.uuid != uuid) {
                    return #err("File does not belong to the given UUID.");
                };

                let response : Types.FileResponse = {
                    uuid = fileRecord.uuid;
                    metadata = {
                        fileData = fileRecord.fileData;
                        mimeType = fileRecord.metadata.mimeType;
                        fileName = fileRecord.metadata.fileName;
                        uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                    };
                };

                return #ok(response);
            };
        };
    };

    // getFileMetadataByUUIDAndId function
    public shared query (msg) func getFileMetadataByUUIDAndId(uuid : Text, fileId : Text) : async Types.Result<Types.FileMetadataResponse, Text> {
        let fileOpt = uuidToFiles.get(fileId);

        // Check if the file exists and belongs to the given UUID
        switch (fileOpt) {
            case null {
                return #err("File not found.");
            };
            case (?fileRecord) {
                if (fileRecord.uuid != uuid) {
                    return #err("File does not belong to the given UUID.");
                };

                let response : Types.FileMetadataResponse = {
                    uuid = fileRecord.uuid;
                    metadata = {
                        mimeType = fileRecord.metadata.mimeType;
                        fileName = fileRecord.metadata.fileName;
                        uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                    };
                };

                return #ok(response);
            };
        };
    };

    // getFileMetadataByUUID function
    public shared query (msg) func getFileMetadataByUUID(uuid : Text) : async Types.Result<[Types.FileMetadataResponse], Text> {
        var fileMetadataResponses : [Types.FileMetadataResponse] = [];

        for ((fileId, record) in uuidToFiles.entries()) {
            if (record.uuid == uuid) {
                let responseItem : Types.FileMetadataResponse = {
                    uuid = record.uuid;
                    metadata = {
                        mimeType = record.metadata.mimeType;
                        fileName = record.metadata.fileName;
                        uploadTimestamp = Int.toText(record.metadata.uploadTimestamp);
                    };
                };
                fileMetadataResponses := Array.append(fileMetadataResponses, [responseItem]);
            };
        };

        return #ok(fileMetadataResponses);
    };

    // updateValue function
    public shared (msg) func updateValue(req : Types.ValueUpdateRequest) : async Result.Result<Text, Text> {

        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Check if the value is locked
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let lockOpt = valueLocks.get(lockKey);
        switch (lockOpt) {
            case (?l) {
                if (l.locked) {
                    return #err("Value is locked and cannot be modified.");
                };
            };
            case null {};
        };

        // Update the value
        subMap.put(req.key, req.newValue);

        return #ok("Value updated successfully.");
    };

    // updateManyValues function
    public shared (msg) func updateManyValues(uuid : Text, updates : [(Text, Text)]) : async Result.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        var failedKeys : [Text] = [];

        for ((key, newValue) in updates.vals()) {
            let lockKey = Storage.makeLockKey(uuid, key);
            let lockOpt = valueLocks.get(lockKey);
            let isLocked = switch (lockOpt) {
                case (?l) { l.locked };
                case null { false };
            };

            if (isLocked) {
                failedKeys := Array.append(failedKeys, [key]);
            } else {
                subMap.put(key, newValue);
            };
        };

        if (failedKeys.size() > 0) {
            return #ok("Some keys could not be updated: " # Utils.arrayToText(failedKeys, ", "));
        } else {
            return #ok("All values updated successfully.");
        };
    };

    // updateValeAndLock function
    public shared (msg) func updateValueAndLock(req : Types.ValueUpdateRequest) : async Result.Result<Text, Text> {
        // Retrieve the value subMap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Check if the value is already locked
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let lockOpt = valueLocks.get(lockKey);
        switch (lockOpt) {
            case (?l) {
                if (l.locked) {
                    return #err("Value is locked and cannot be modified.");
                };
            };
            case null {};
        };

        // Update or create the value
        subMap.put(req.key, req.newValue);

        // Lock the value
        let newStatus : Types.ValueLockStatus = {
            locked = true;
            lockedBy = ?msg.caller;
        };
        valueLocks.put(lockKey, newStatus);
        return #ok("Value updated and locked successfully.");
    };

    // updateManyValuesAndLock function
    public shared (msg) func updateManyValuesAndLock(uuid : Text, updates : [(Text, Text)]) : async Result.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        var failedKeys : [Text] = [];

        for ((key, newValue) in updates.vals()) {
            let lockKey = Storage.makeLockKey(uuid, key);
            let lockOpt = valueLocks.get(lockKey);
            let isLocked = switch (lockOpt) {
                case (?l) { l.locked };
                case null { false };
            };

            if (isLocked) {
                failedKeys := Array.append(failedKeys, [key]);
            } else {
                subMap.put(key, newValue);

                let newStatus : Types.ValueLockStatus = {
                    locked = true;
                    lockedBy = ?msg.caller;
                };
                valueLocks.put(lockKey, newStatus);
            };
        };

        if (failedKeys.size() > 0) {
            return #ok("Some keys could not be updated and locked: " # Utils.arrayToText(failedKeys, ", "));
        } else {
            return #ok("All values updated and locked successfully.");
        };
    };

    // lockAllValues function
    public shared (msg) func lockAllValues(req : Types.ValueLockAllRequest) : async Result.Result<Text, Text> {
        // Check UUID existence
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Iterate through all keys and lock them
        for ((key, _) in subMap.entries()) {
            let lockKey = Storage.makeLockKey(req.uuid, key);
            let current = valueLocks.get(lockKey);

            // Skip if already locked
            switch (current) {
                case (?status) {
                    if (not status.locked) {
                        let newStatus : Types.ValueLockStatus = {
                            locked = true;
                            lockedBy = ?msg.caller;
                        };
                        valueLocks.put(lockKey, newStatus);
                    };
                };
                case null {
                    let newStatus : Types.ValueLockStatus = {
                        locked = true;
                        lockedBy = ?msg.caller;
                    };
                    valueLocks.put(lockKey, newStatus);
                };
            };
        };

        return #ok("All values locked successfully.");
    };

    public shared (msg) func unlockAllValues(req : Types.ValueUnlockAllRequest) : async Result.Result<Text, Text> {
        // Check Admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        // Check UUID existence
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Iterate through all keys and unlock them
        for ((key, _) in subMap.entries()) {
            let lockKey = Storage.makeLockKey(req.uuid, key);
            let newStatus : Types.ValueLockStatus = {
                locked = false;
                lockedBy = null;
            };
            valueLocks.put(lockKey, newStatus);
        };

        return #ok("All values unlocked successfully.");
    };

    // getValue function
    public shared query (msg) func getValue(req : Types.ValueRequest) : async Result.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found.") };
            case (?m) m;
        };

        let valOpt = subMap.get(req.key);
        switch (valOpt) {
            case null { return #err("Key not found.") };
            case (?v) { return #ok(v) };
        };
    };

    // getAllValues function
    public shared query (msg) func getAllValues(uuid : Text) : async Result.Result<[(Text, Text)], Text> {

        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(uuid);
        switch (subMapOpt) {
            case null { return #err("UUID not found.") };
            case (?subMap) {
                let entries = Iter.toArray(subMap.entries());
                return #ok(entries);
            };
        };
    };

    // lockValue function
    public shared (msg) func lockValue(req : Types.ValueLockRequest) : async Result.Result<Text, Text> {
        // Check UUID existence
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        // Determine lock status
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let current = valueLocks.get(lockKey);

        // Check if already locked
        switch (current) {
            case (?status) {
                if (status.locked) {
                    return #err("Value is already locked.");
                };
            };
            case null {};
        };

        let newStatus : Types.ValueLockStatus = {
            locked = true;
            lockedBy = ?msg.caller;
        };
        valueLocks.put(lockKey, newStatus);

        return #ok("Value locked successfully.");
    };

    public shared (msg) func unlockValue(req : Types.ValueUnlockRequest) : async Result.Result<Text, Text> {
        // Check Admin
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        // Check UUID existence
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let current = valueLocks.get(lockKey);

        switch (current) {
            case (?status) {
                if (not status.locked) {
                    return #err("Value is already unlocked.");
                };
            };
            case null {
                return #err("Value lock status not found.");
            };
        };

        let newStatus : Types.ValueLockStatus = {
            locked = false;
            lockedBy = null;
        };
        valueLocks.put(lockKey, newStatus);

        return #ok("Value unlocked successfully.");
    };

    // getValueLockStatus function
    public shared query (msg) func getValueLockStatus(req : Types.ValueLockStatusRequest) : async Result.Result<Types.ValueLockStatus, Text> {

        // Check if the value is locked or not
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let statusOpt = valueLocks.get(lockKey);
        switch (statusOpt) {
            case null {
                return #err("No lock status found (value not locked).");
            };
            case (?s) { return #ok(s) };
        };
    };

    // getUUIDInfo function
    public shared query (msg) func getUUIDInfo(uuid : Text) : async Result.Result<(Text, [Types.FileResponse]), Text> {
        // Retrieve the schema
        let schemaOpt = uuidToStructure.get(uuid);
        let schemaText = switch (schemaOpt) {
            case (null) { return #err("UUID not found.") };
            case (?text) { text };
        };

        // Retrieve the key/value map
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let dataJson = switch (subMapOpt) {
            case null { "{}" };
            case (?map) {
                let entries = Iter.toArray(map.entries());
                Utils.mapEntriesToJson(entries);
            };
        };

        // Retrieve lock statuses for values
        var lockStatuses : [(Text, Text)] = [];
        switch (subMapOpt) {
            case (null) {};
            case (?map) {
                for ((key, _) in map.entries()) {
                    let lockKey = Storage.makeLockKey(uuid, key);
                    let lockStatusOpt = valueLocks.get(lockKey);
                    let lockStatus = switch (lockStatusOpt) {
                        case (null) { "unlocked" };
                        case (?s) { if (s.locked) "locked" else "unlocked" };
                    };
                    lockStatuses := Array.append(lockStatuses, [(key, lockStatus)]);
                };
            };
        };

        // First, remove the outer JSON object from schemaText since it's already a complete JSON
        let schemaTextTrimmed = Text.trimStart(schemaText, #text "{");
        let schemaTextFinal = Text.trimEnd(schemaTextTrimmed, #text "}");

        let combinedJson = "{"
        # schemaTextFinal # "}},"
        # "\"values\":" # dataJson # ","
        # "\"lockStatus\":" # Utils.mapEntriesToJson(lockStatuses)
        # "}";

        var fileResponses : [Types.FileResponse] = [];
        for ((fileId, record) in uuidToFiles.entries()) {
            if (record.uuid == uuid) {
                let responseItem : Types.FileResponse = {
                    uuid = record.uuid;
                    metadata = {
                        fileData = ""; // Remove actual file data from the response
                        mimeType = record.metadata.mimeType;
                        fileName = record.metadata.fileName;
                        uploadTimestamp = Int.toText(record.metadata.uploadTimestamp);
                    };
                };
                fileResponses := Array.append(fileResponses, [responseItem]);
            };
        };

        // Return the combined JSON and files
        return #ok(combinedJson, fileResponses);
    };

    // getAllUUIDs function
    public shared query (msg) func getAllUUIDs(ownerPrincipal : ?Principal) : async Result.Result<[Text], Text> {
        if (Auth.isAdmin(msg.caller, admins)) {
            switch (ownerPrincipal) {
                case null {
                    let uuids = Iter.toArray(uuidToStructure.keys());
                    return #ok(uuids);
                };
                case (?principal) {
                    var ownerUuids : [Text] = [];
                    for ((u, owner) in uuidOwners.entries()) {
                        if (owner == principal) {
                            ownerUuids := Array.append(ownerUuids, [u]);
                        };
                    };
                    return #ok(ownerUuids);
                };
            };
        } else if (Auth.isEditor(msg.caller, editors)) {
            switch (ownerPrincipal) {
                case null {
                    var editorUuids : [Text] = [];
                    for ((u, owner) in uuidOwners.entries()) {
                        if (owner == msg.caller) {
                            editorUuids := Array.append(editorUuids, [u]);
                        };
                    };
                    return #ok(editorUuids);
                };
                case (?principal) {
                    if (principal == msg.caller) {
                        var ownerUuids : [Text] = [];
                        for ((u, owner) in uuidOwners.entries()) {
                            if (owner == principal) {
                                ownerUuids := Array.append(ownerUuids, [u]);
                            };
                        };
                        return #ok(ownerUuids);
                    } else {
                        return #err("Unauthorized: Can only query your own UUIDs");
                    };
                };
            };
        } else {
            #err("Unauthorized: Admin or Editor role required.");
        };
    };

    // Nuova funzione: ottieni tutti i modelli disponibili
    public shared query (msg) func getAllModels() : async Result.Result<[Text], Text> {
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        let models = Iter.toArray(modelToFiles.keys());
        return #ok(models);
    };

    // Nuova funzione: crea un nuovo modello
    public shared (msg) func createModel(modelId : Text) : async Result.Result<Text, Text> {
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (modelToFiles.get(modelId) != null) {
            return #err("Model ID already exists.");
        };

        // Inizializza il modello con un array vuoto di file
        modelToFiles.put(modelId, []);

        return #ok("Model created successfully.");
    };

    // Nuova funzione: elimina un modello
    public shared (msg) func deleteModel(modelId : Text) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (modelToFiles.get(modelId) == null) {
            return #err("Model not found.");
        };

        // Ottieni tutti i file associati a questo modello
        let files = switch (modelToFiles.get(modelId)) {
            case (null) { [] };
            case (?files) { files };
        };

        // Rimuovi le associazioni per ciascun file
        for (fileId in files.vals()) {
            let existingModels = switch (fileToModels.get(fileId)) {
                case (null) { [] };
                case (?models) { models };
            };

            if (Utils.contains<Text>(existingModels, modelId, Text.equal)) {
                let updatedModels = Array.filter<Text>(existingModels, func(id) { id != modelId });
                fileToModels.put(fileId, updatedModels);
            };
        };

        // Rimuovi il modello
        modelToFiles.delete(modelId);

        return #ok("Model deleted successfully.");
    };
};
