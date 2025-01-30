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

    // Volatile state
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidKeyValueMap = Storage.newUUIDKeyValueMap();
    var uuidToFiles = Storage.newFileMap();
    var admins = Auth.newAdminMap();
    var editors = Auth.newEditorMap();
    var uuidOwners = Storage.newUUIDOwnerMap();
    var valueLocks = Storage.newValueLockMap();

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
    public shared (msg) func updateManyValues(uuid : Text, updates : [(Text, Text)]) : async Result.Result<Text, [Text]> {

        // Check if UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err(["UUID not found"]);
        };

        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err(["UUID not found or not initialized."]) };
            case (?m) m;
        };

        var failedKeys : [Text] = [];

        // Iterate through the updates
        for ((key, newValue) in updates.vals()) {
            // Check if the value is locked
            let lockKey = Storage.makeLockKey(uuid, key);
            let lockOpt = valueLocks.get(lockKey);
            let isLocked = switch (lockOpt) {
                case (?l) { l.locked };
                case null { false };
            };

            if (isLocked) {
                // If the value is locked, add the key to failedKeys
                failedKeys := Array.append(failedKeys, [key]);
            } else {
                // If the key exists, update the value
                if (subMap.get(key) != null) {
                    subMap.put(key, newValue);
                } else {
                    // If the key does not exist, add it to failedKeys
                    failedKeys := Array.append(failedKeys, [key]);
                };
            };
        };

        // Return the list of keys that couldn't be updated
        if (failedKeys.size() > 0) {
            return #ok("Some keys could not be updated: " # Utils.arrayToText(failedKeys, ", "));
        } else {
            return #ok("All values updated successfully.");
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
                        fileData = record.fileData;
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
};
