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
import Option "mo:base/Option";

shared (msg) actor class TimestorageBackend() {

    // =================================================================
    // STABLE STATE
    // =================================================================

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

    // Project stable state
    stable var projectsStable : [(Types.UUID, Types.ProjectCore)] = [];
    stable var projectDocumentsStable : [(Types.UUID, [Types.FileId])] = [];
    stable var projectPlacementsStable : [(Types.UUID, [Types.UUID])] = [];
    stable var placementDocumentsStable : [(Text, [Types.FileId])] = [];
    stable var uuidToProjectStable : [(Types.UUID, Types.UUID)] = [];
    stable var projectToUuidsStable : [(Types.UUID, [Types.UUID])] = [];
    stable var uuidLinksStable : [(Types.UUID, [Types.UUID])] = [];

    // =================================================================
    // VOLATILE STATE
    // =================================================================

    // Volatile state
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidKeyValueMap = Storage.newUUIDKeyValueMap();
    var uuidToFiles = Storage.newFileMap();
    var admins = Auth.newAdminMap();
    var editors = Auth.newEditorMap();
    var uuidOwners = Storage.newUUIDOwnerMap();
    var valueLocks = Storage.newValueLockMap();

    //Project Volatile State
    var projects = Storage.newProjectMap();
    var projectDocuments = Storage.newProjectDocumentsMap();
    var projectPlacements = Storage.newProjectPlacementsMap();
    var placementDocuments = Storage.newPlacementDocumentsMap();
    var uuidToProject = Storage.newUuidToProjectMap();
    var projectToUuids = Storage.newProjectToUuidsMap();
    var uuidLinks = Storage.newUuidLinksMap();

    // Initial admin setup
    let initialAdmin = msg.caller;
    admins.put(initialAdmin, true);

    // Migration functions
    system func postupgrade() {
        // Restore existing state
        for ((u, s) in uuidToStructureStable.vals()) {
            uuidToStructure.put(u, s);
        };
        for ((k, v) in uuidToFilesStable.vals()) { uuidToFiles.put(k, v) };
        for ((p, isA) in adminsStable.vals()) { admins.put(p, isA) };
        for ((p, isE) in editorsStable.vals()) { editors.put(p, isE) };
        for ((lk, lockVal) in valueLocksStable.vals()) {
            valueLocks.put(lk, lockVal);
        };
        for ((u, p) in uuidOwnersStable.vals()) { uuidOwners.put(u, p) };
        for ((u, keyVals) in uuidKeyValueStable.vals()) {
            let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
            for ((k, v) in keyVals.vals()) { subMap.put(k, v) };
            uuidKeyValueMap.put(u, subMap);
        };

        // Restore project state
        for ((k, v) in projectsStable.vals()) { projects.put(k, v) };
        for ((k, v) in projectDocumentsStable.vals()) {
            projectDocuments.put(k, v);
        };
        for ((k, v) in projectPlacementsStable.vals()) {
            projectPlacements.put(k, v);
        };
        for ((k, v) in placementDocumentsStable.vals()) {
            placementDocuments.put(k, v);
        };
        for ((k, v) in uuidToProjectStable.vals()) { uuidToProject.put(k, v) };
        for ((k, v) in projectToUuidsStable.vals()) { projectToUuids.put(k, v) };
        for ((k, v) in uuidLinksStable.vals()) { uuidLinks.put(k, v) };
    };

    system func preupgrade() {
        // Save existing state
        uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
        uuidToFilesStable := Iter.toArray(uuidToFiles.entries());
        uuidOwnersStable := Iter.toArray(uuidOwners.entries());
        adminsStable := Iter.toArray(admins.entries());
        editorsStable := Iter.toArray(editors.entries());
        valueLocksStable := Iter.toArray(valueLocks.entries());
        var kvArr : [(Types.UUID, [(Text, Text)])] = [];
        for ((u, subMap) in uuidKeyValueMap.entries()) {
            kvArr := Array.append(kvArr, [(u, Iter.toArray(subMap.entries()))]);
        };
        uuidKeyValueStable := kvArr;

        // Save project state
        projectsStable := Iter.toArray(projects.entries());
        projectDocumentsStable := Iter.toArray(projectDocuments.entries());
        projectPlacementsStable := Iter.toArray(projectPlacements.entries());
        placementDocumentsStable := Iter.toArray(placementDocuments.entries());
        uuidToProjectStable := Iter.toArray(uuidToProject.entries());
        projectToUuidsStable := Iter.toArray(projectToUuids.entries());
        uuidLinksStable := Iter.toArray(uuidLinks.entries());
    };

    // =================================================================
    // HELPER FUNCTIONS
    // =================================================================

    // Helper to get a `LinkedStructureIdentifier` from a standard UUID
    func getLinkedStructureIdentifier(uuid : Types.UUID) : ?Types.LinkedStructureIdentifier {
        // This function assumes 'info' is stored as a JSON string in uuidToStructure
        // and specific keys are in uuidKeyValueMap. A more robust implementation
        // might parse the JSON, but for now we'll fetch from key-value.
        switch (uuidKeyValueMap.get(uuid)) {
            case (null) { return null };
            case (?kvMap) {
                return ?{
                    identification = kvMap.get("info.identification");
                    subIdentification = kvMap.get("info.subIdentification");
                    typeText = kvMap.get("info.type");
                    category = kvMap.get("info.category");
                    positionNumber = kvMap.get("info.positionNumber");
                    sequenceNumber = kvMap.get("info.sequenceNumber");
                    floorNumber = kvMap.get("info.floorNumber");
                    roomDescription = kvMap.get("info.roomDescription");
                    productType = kvMap.get("info.productType");
                    brand = kvMap.get("info.brand");
                    model = kvMap.get("info.model");
                    dimensions = kvMap.get("info.dimensions");
                    notes = kvMap.get("info.notes");
                };
            };
        };
    };

    // Helper to fetch file details
    func getRemoteDocumentResponses(fileIds : [Types.FileId]) : [Types.RemoteDocumentResponse] {
        var docs : [Types.RemoteDocumentResponse] = [];
        for (fileId in fileIds.vals()) {
            switch (uuidToFiles.get(fileId)) {
                case (?fileRecord) {
                    let doc : Types.RemoteDocumentResponse = {
                        fileId = fileId;
                        uuid = fileRecord.uuid;
                        metadata = {
                            fileData = ""; // Keep this empty to save bandwidth
                            mimeType = fileRecord.metadata.mimeType;
                            fileName = fileRecord.metadata.fileName;
                            uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                        };
                    };
                    docs := Array.append(docs, [doc]);
                };
                case (null) {
                    // skip if file not found
                };
            };
        };
        return docs;
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

    // Upload an image associated with a UUID
    public shared (msg) func uploadFile(uuid : Text, base64FileData : Text, metadata : Types.FileMetadata) : async Result.Result<Text, Text> {

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
        return #ok("File uploaded successfully with ID: " # fileId);
    };

    // Helper function to generate a unique file ID
    func generateUniqueFileId() : Text {
        fileCounter += 1;
        return "file-" # Nat.toText(fileCounter);
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
    public shared query (msg) func getUUIDInfo(uuid : Text) : async Result.Result<(Text, Text, [Types.FileResponse]), Text> {
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

        // Create the values and lock status JSON
        let valuesAndLockJson = "{"
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

        // Return the schema, values and lock JSON, and files
        return #ok(schemaText, valuesAndLockJson, fileResponses);
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

    // =================================================================
    // PROJECT API - WRITE METHODS
    // =================================================================

    public shared (msg) func createProject(projectUuid: Types.UUID, info: Types.ProjectInfo): async Types.Response<Text> {
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e); };
            case (#ok()) {};
        };
        if (projects.get(projectUuid) != null) {
            return #err("Project with this UUID already exists.");
        };

        let newProject: Types.ProjectCore = {
            owner = msg.caller;
            status = #draft;
            info = info;
        };
        projects.put(projectUuid, newProject);
        return #ok("Project created successfully.");
    };

    public shared (msg) func updateProjectInfo(projectUuid: Types.UUID, newInfo: Types.ProjectInfo): async Types.Response<Text> {
        // 1. Find the project or return an error
        let project = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found."); };
            case (?p) { p };
        };

        // 2. Check permissions: Must be the owner
        if (project.owner != msg.caller) {
            return #err("Unauthorized: Only the project owner can edit the project info.");
        };

        // 3. Check condition: Project cannot be completed
        if (project.status == #completed) {
            return #err("Cannot edit info for a completed project.");
        };

        // 4. Create the updated project record and save it
        let updatedProject: Types.ProjectCore = {
            owner = project.owner;
            status = project.status;
            info = newInfo; // Use the new info provided
        };
        projects.put(projectUuid, updatedProject);
        
        return #ok("Project info updated successfully.");
    };

    public shared (msg) func updateProjectStatus(projectUuid: Types.UUID, newStatus: Types.ProjectStatus): async Types.Response<Text> {
        let project = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found."); };
            case (?p) { p };
        };

        if (project.owner != msg.caller) {
            return #err("Unauthorized: Only the project owner can change the status.");
        };

        if (project.status == #completed) {
            return #err("Cannot change status of a completed project.");
        };

        let updatedProject: Types.ProjectCore = {
            owner = project.owner;
            info = project.info;
            status = newStatus;
        };
        projects.put(projectUuid, updatedProject);
        
        return #ok("Project status updated successfully.");
    };

    public shared (msg) func deleteProject(projectUuid: Types.UUID): async Types.Response<Text> {
        let project = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found."); };
            case (?p) { p };
        };

        if (project.owner != msg.caller) {
            return #err("Unauthorized: Only the project owner can delete a project.");
        };
        
        if (project.status == #completed) {
            return #err("Cannot delete a completed project.");
        };

        // --- Perform comprehensive cleanup ---

        // 1. Clean up UUID assignments
        let assignedUuids = Option.get(projectToUuids.get(projectUuid), []);
        for (uuid in assignedUuids.vals()) {
            uuidToProject.delete(uuid); // Remove direct link
        };
        projectToUuids.delete(projectUuid); // Remove reverse link list

        // 2. Clean up placements and their documents
        let placementUuids = Option.get(projectPlacements.get(projectUuid), []);
        for (placementUuid in placementUuids.vals()) {
            let compositeKey = projectUuid # "|" # placementUuid;
            placementDocuments.delete(compositeKey); // Remove documents for this placement
        };
        projectPlacements.delete(projectUuid); // Remove the list of placements

        // 3. Clean up top-level project documents
        projectDocuments.delete(projectUuid);

        // 4. Finally, delete the project core object
        projects.delete(projectUuid);

        return #ok("Project and all associated data have been deleted successfully.");
    };
    
    public shared (msg) func assignUuidToProject(projectUuid: Types.UUID, itemUuid: Types.UUID): async Types.Response<Text> {
        // Auth: must be owner of project
        let _ = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found"); };
            case (?p) { if (p.owner != msg.caller) { return #err("Unauthorized"); }; p };
        };
        if (uuidToProject.get(itemUuid) != null) {
            return #err("This UUID is already assigned to another project.");
        };

        // Assign item to project
        uuidToProject.put(itemUuid, projectUuid);

        // Update reverse map for efficient querying
        var assigned = Option.get(projectToUuids.get(projectUuid), []);
        projectToUuids.put(projectUuid, Array.append(assigned, [itemUuid]));
        
        return #ok("UUID assigned to project.");
    };

    public shared (msg) func unassignUuidFromProject(projectUuid: Types.UUID, itemUuid: Types.UUID): async Types.Response<Text> {
        let project = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found."); };
            case (?p) { p };
        };

        if (project.owner != msg.caller) {
            return #err("Unauthorized: Only the project owner can unassign UUIDs.");
        };

        if (project.status == #completed) {
            return #err("Cannot unassign UUIDs from a completed project.");
        };

        // Verify that the UUID is indeed assigned to this project
        switch (uuidToProject.get(itemUuid)) {
            case null { return #err("This UUID is not assigned to any project."); };
            case (?pUuid) {
                if (pUuid != projectUuid) {
                    return #err("This UUID is assigned to a different project.");
                };
            };
        };

        // Remove the assignment
        uuidToProject.delete(itemUuid);

        // Update the reverse map by filtering out the itemUuid
        switch (projectToUuids.get(projectUuid)) {
            case (?assignedUuids) {
                let newAssignedUuids = Array.filter(assignedUuids, func(uuid : Types.UUID) : Bool { uuid != itemUuid });
                projectToUuids.put(projectUuid, newAssignedUuids);
            };
            case null { /* Should not happen if logic is consistent, but safe to ignore */ };
        };

        return #ok("UUID unassigned from project successfully.");
    };

    public shared (msg) func addPlacementToProject(projectUuid: Types.UUID, placementUuid: Types.UUID): async Types.Response<Text> {
        // Auth: must be owner of project
        let _ = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found"); };
            case (?p) { if (p.owner != msg.caller) { return #err("Unauthorized"); }; p };
        };
        if (uuidToStructure.get(placementUuid) == null) {
            return #err("Placement UUID does not exist as a valid entity.");
        };
        
        var placementsList = Option.get(projectPlacements.get(projectUuid), []);
        // Avoid duplicates
        if (Option.isSome(Array.find(placementsList, func(p : Types.UUID) : Bool { p == placementUuid }))) {
            return #err("This UUID is already a placement in this project.");
        };

        projectPlacements.put(projectUuid, Array.append(placementsList, [placementUuid]));
        return #ok("Placement added to project.");
    };

    public shared (msg) func linkUuids(uuid1: Types.UUID, uuid2: Types.UUID): async Types.Response<Text> {
        // For simplicity, we assume any editor/admin can link any two UUIDs.
        // A stricter check might be to ensure caller owns at least one.
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e); };
            case (#ok()) {};
        };
        if (uuid1 == uuid2) { return #err("Cannot link a UUID to itself."); };

        // Link 1 -> 2
        var links1 = Option.get(uuidLinks.get(uuid1), []);
        if (not Option.isSome(Array.find(links1, func(u : Types.UUID) : Bool { u == uuid2 }))) {
            uuidLinks.put(uuid1, Array.append(links1, [uuid2]));
        };

        // Link 2 -> 1 (symmetrical)
        var links2 = Option.get(uuidLinks.get(uuid2), []);
        if (not Option.isSome(Array.find(links2, func(u : Types.UUID) : Bool { u == uuid1 }))) {
            uuidLinks.put(uuid2, Array.append(links2, [uuid1]));
        };
        
        return #ok("UUIDs linked successfully.");
    };

    public shared (msg) func unlinkUuids(uuid1: Types.UUID, uuid2: Types.UUID): async Types.Response<Text> {
        // Permissions check
        switch (Auth.requireAdminOrEditor(msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e); };
            case (#ok()) {};
        };
        if (uuid1 == uuid2) { return #err("Cannot unlink a UUID from itself."); };

        // Unlink 1 -> 2
        switch (uuidLinks.get(uuid1)) {
            case (?links) {
                let newLinks = Array.filter(links, func(u : Types.UUID) : Bool { u != uuid2 });
                uuidLinks.put(uuid1, newLinks);
            };
            case null { /* Should not happen if logic is consistent, but safe to ignore */ };
        };

        // Unlink 2 -> 1 (for symmetry)
        switch (uuidLinks.get(uuid2)) {
            case (?links) {
                let newLinks = Array.filter(links, func(u : Types.UUID) : Bool { u != uuid1 });
                uuidLinks.put(uuid2, newLinks);
            };
            case null { /* Should not happen if logic is consistent, but safe to ignore */ };
        };
        
        return #ok("UUIDs unlinked successfully.");
    };

    // =================================================================
    // THE "BUNDLER" API - QUERY METHOD
    // =================================================================
    
    // Private helper to assemble project data
    func _getProject_(projectUuid: Types.UUID) : Types.Response<Types.ProjectAPIResponse> {
        // 1. Get Core Project Data
        let projectCore = switch(projects.get(projectUuid)) {
            case (null) { return #err("Project not found."); };
            case (?p) { p };
        };

        // 2. Get Top-Level Project Documents
        let projectFileIds = Option.get(projectDocuments.get(projectUuid), []);
        let projectDocsResponse = getRemoteDocumentResponses(projectFileIds);

        // 3. Get Placements and their documents
        var placementsResponse: [Types.ProjectPlacementResponse] = [];
        let placementUuids = Option.get(projectPlacements.get(projectUuid), []);
        for (placementUuid in placementUuids.vals()) {
            let compositeKey = projectUuid # "|" # placementUuid;
            let placementFileIds = Option.get(placementDocuments.get(compositeKey), []);
            
            let placement: Types.ProjectPlacementResponse = {
                uuid = placementUuid;
                info = getLinkedStructureIdentifier(placementUuid);
                documents = getRemoteDocumentResponses(placementFileIds);
            };
            placementsResponse := Array.append(placementsResponse, [placement]);
        };

        // 4. Get Linked Structures (UUIDs assigned to this project)
        var linkedStructuresResponse: [Types.ProjectLinkedStructureResponse] = [];
        let assignedUuids = Option.get(projectToUuids.get(projectUuid), []);
        for (assignedUuid in assignedUuids.vals()) {
            let linkedStructure: Types.ProjectLinkedStructureResponse = {
                uuid = assignedUuid;
                info = getLinkedStructureIdentifier(assignedUuid);
            };
            linkedStructuresResponse := Array.append(linkedStructuresResponse, [linkedStructure]);
        };
        
        // 5. Assemble the final response object
        let response : Types.ProjectAPIResponse = {
            uuid = projectUuid;
            status = projectCore.status;
            info = projectCore.info;
            documents = projectDocsResponse;
            placements = placementsResponse;
            linkedStructures = linkedStructuresResponse;
        };

        return #ok(response);
    };

    public shared query (msg) func getProjectByUuid(uuid: Types.UUID) : async Types.Response<Types.ProjectAPIResponse> {
        let projectUuid = switch(uuidToProject.get(uuid)) {
            case (null) { return #err("Project not found for this UUID."); };
            case (?p) { p };
        };

        return _getProject_(projectUuid);
    };

    public shared query (msg) func getProject(projectUuid: Types.UUID) : async Types.Response<Types.ProjectAPIResponse> {
        return _getProject_(projectUuid);
    };

    
};
