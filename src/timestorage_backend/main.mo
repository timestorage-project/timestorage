import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import FileStorage "./filestorage";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

shared (msg) actor class TimestorageBackend() {

    type UUID = Types.UUID;
    type FileRecord = Types.FileRecord;
    type ValueLockStatus = Types.ValueLockStatus;
    type Result<T, E> = Types.Result<T, E>;
    type Response<T> = Types.Response<T>;

    // Stable state
    stable var uuidToStructureStable : [(UUID, Text)] = [];
    stable var uuidKeyValueStable : [(UUID, [(Text, Text)])] = [];
    stable var globalFilesStable : [(Text, FileRecord)] = []; // Global files storage
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var editorsStable : [(Principal, Bool)] = [];
    stable var uuidOwnersStable : [(Text, Principal)] = [];
    stable var valueLocksStable : [(Text, ValueLockStatus)] = [];
    stable var fileCounter : Nat = 0;

    // Volatile state
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidKeyValueMap = Storage.newUUIDKeyValueMap();
    var globalFiles = Storage.newFileMap(); // Global files storage
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

        // Restore globalFiles
        for ((k, v) in globalFilesStable.vals()) {
            globalFiles.put(k, v);
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

        // Save globalFiles
        globalFilesStable := Iter.toArray(globalFiles.entries());

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

    // Upload a file to the global storage
    public shared (msg) func uploadGlobalFile(base64FileData : Text, metadata : Types.FileMetadata) : async Result.Result<Text, Text> {
        let (result, newCounter) = FileStorage.uploadGlobalFile(
            base64FileData,
            metadata,
            globalFiles,
            fileCounter,
        );

        // Aggiorna il contatore solo se l'operazione ha avuto successo
        switch (result) {
            case (#ok(_)) { fileCounter := newCounter };
            case (#err(_)) {};
        };

        return result;
    };

    // Associate a global file with a UUID
    public shared (msg) func associateFileWithUUID(uuid : Text, fileId : Text) : async Result.Result<Text, Text> {
        FileStorage.associateFileWithUUID(
            uuid,
            fileId,
            uuidToStructure,
            uuidKeyValueMap,
            globalFiles,
        );
    };

    // Disassociate a global file from a UUID
    public shared (msg) func disassociateFileFromUUID(uuid : Text, fileId : Text) : async Result.Result<Text, Text> {
        FileStorage.disassociateFileFromUUID(
            uuid,
            fileId,
            uuidToStructure,
            uuidKeyValueMap,
        );
    };

    // Get a global file by ID
    public shared query (msg) func getGlobalFile(fileId : Text) : async Types.Result<Types.FileResponse, Text> {
        FileStorage.getGlobalFile(fileId, globalFiles);
    };

    // Get metadata for a global file
    public shared query (msg) func getGlobalFileMetadata(fileId : Text) : async Types.Result<Types.FileMetadataResponse, Text> {
        FileStorage.getGlobalFileMetadata(fileId, globalFiles);
    };

    // Get all files associated with a UUID
    public shared query (msg) func getUUIDAssociatedFiles(uuid : Text) : async Types.Result<[Types.FileMetadataResponse], Text> {
        FileStorage.getUUIDAssociatedFiles(
            uuid,
            uuidToStructure,
            uuidKeyValueMap,
            globalFiles,
        );
    };

    // Get all global files (admin only)
    public shared query (msg) func getAllGlobalFiles() : async Types.Result<[Types.FileMetadataResponse], Text> {
        FileStorage.getAllGlobalFiles(
            msg.caller,
            admins,
            globalFiles,
        );
    };

    // Delete a global file (admin only)
    public shared (msg) func deleteGlobalFile(fileId : Text) : async Result.Result<Text, Text> {
        FileStorage.deleteGlobalFile(
            fileId,
            msg.caller,
            admins,
            globalFiles,
            uuidKeyValueMap,
        );
    };

    // Count the references to a global file
    public shared query (msg) func countFileReferences(fileId : Text) : async Result.Result<Nat, Text> {
        FileStorage.countFileReferences(
            fileId,
            globalFiles,
            uuidKeyValueMap,
        );
    };

    // Copy all file associations from one UUID to another
    public shared (msg) func copyFileAssociations(sourceUuid : Text, targetUuid : Text) : async Result.Result<Text, Text> {
        FileStorage.copyFileAssociations(
            sourceUuid,
            targetUuid,
            uuidToStructure,
            uuidKeyValueMap,
        );
    };

    // Create a duplicate of a file in the global storage
    public shared (msg) func duplicateGlobalFile(fileId : Text) : async Result.Result<Text, Text> {
        let (result, newCounter) = FileStorage.duplicateGlobalFile(
            fileId,
            globalFiles,
            fileCounter,
        );

        // Aggiorna il contatore solo se l'operazione ha avuto successo
        switch (result) {
            case (#ok(_)) { fileCounter := newCounter };
            case (#err(_)) {};
        };

        return result;
    };

    // updateValue function
    public shared (msg) func updateValue(req : Types.ValueUpdateRequest) : async Result.Result<Text, Text> {
        // Retrieve the value submap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot update keys with __file__ prefix. Use associateFileWithUUID instead.");
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
            // Check if the key starts with __file__ which is reserved for file associations
            if (Storage.isFileAssociationKey(key)) {
                failedKeys := Array.append(failedKeys, [key]);
            } else {
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
        };

        if (failedKeys.size() > 0) {
            return #ok("Some keys could not be updated: " # Utils.arrayToText(failedKeys, ", "));
        } else {
            return #ok("All values updated successfully.");
        };
    };

    // updateValueAndLock function
    public shared (msg) func updateValueAndLock(req : Types.ValueUpdateRequest) : async Result.Result<Text, Text> {
        // Retrieve the value subMap for this UUID
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot update keys with __file__ prefix. Use associateFileWithUUID instead.");
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
            // Check if the key starts with __file__ which is reserved for file associations
            if (Storage.isFileAssociationKey(key)) {
                failedKeys := Array.append(failedKeys, [key]);
            } else {
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
            // Skip file association keys
            if (Storage.isFileAssociationKey(key)) {
                // Skip file association keys
            } else {
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
            // Skip file association keys
            if (Storage.isFileAssociationKey(key)) {
                // Skip file association keys
            } else {
                let lockKey = Storage.makeLockKey(req.uuid, key);
                let newStatus : Types.ValueLockStatus = {
                    locked = false;
                    lockedBy = null;
                };
                valueLocks.put(lockKey, newStatus);
            };
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
                // Filter out file association entries
                let filteredEntries = Array.filter<(Text, Text)>(
                    entries,
                    func((k, _)) {
                        not Storage.isFileAssociationKey(k);
                    },
                );
                return #ok(filteredEntries);
            };
        };
    };

    // lockValue function
    public shared (msg) func lockValue(req : Types.ValueLockRequest) : async Result.Result<Text, Text> {
        // Check UUID existence
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot lock keys with __file__ prefix.");
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

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot unlock keys with __file__ prefix.");
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
        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot get lock status for keys with __file__ prefix.");
        };

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
    public shared query (msg) func getUUIDInfo(uuid : Text) : async Result.Result<Text, Text> {
        // Retrieve the schema
        let schemaOpt = uuidToStructure.get(uuid);
        let schemaText = switch (schemaOpt) {
            case (null) { return #err("UUID not found.") };
            case (?text) { text };
        };

        // Retrieve the key/value map
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
            case (?map) { map };
        };

        // Prepare regular key/value pairs
        var regularEntries : [(Text, Text)] = [];

        // Prepare file associations
        var fileIds : [Text] = [];

        // Iterate through all key-value pairs for this UUID
        for ((key, value) in subMap.entries()) {
            if (Storage.isFileAssociationKey(key)) {
                fileIds := Array.append(fileIds, [value]);
            } else {
                regularEntries := Array.append(regularEntries, [(key, value)]);
            };
        };

        // Retrieve lock statuses for values
        var lockStatuses : [(Text, Text)] = [];
        for (entry in Iter.fromArray(regularEntries)) {
            let (key, _) = entry;
            let lockKey = Storage.makeLockKey(uuid, key);
            let lockStatusOpt = valueLocks.get(lockKey);
            let lockStatus = switch (lockStatusOpt) {
                case (null) { "unlocked" };
                case (?s) { if (s.locked) "locked" else "unlocked" };
            };
            lockStatuses := Array.append(lockStatuses, [(key, lockStatus)]);
        };

        // Format regular values as JSON
        let dataJson = Utils.mapEntriesToJson(regularEntries);

        // Format lock statuses as JSON
        let lockStatusesJson = Utils.mapEntriesToJson(lockStatuses);

        // Format file IDs as a JSON array
        let fileIdsJson = if (fileIds.size() == 0) {
            "[]";
        } else {
            "[\"" # Text.join("\", \"", Iter.fromArray(fileIds)) # "\"]";
        };

        // First, remove the outer JSON object from schemaText since it's already a complete JSON
        let schemaTextTrimmed = Text.trimStart(schemaText, #text "{");
        let schemaTextFinal = Text.trimEnd(schemaTextTrimmed, #text "}");

        // Construct the combined JSON response
        let combinedJson = "{"
        # schemaTextFinal # "}},"
        # "\"values\":" # dataJson # ","
        # "\"lockStatus\":" # lockStatusesJson # ","
        # "\"fileIds\":" # fileIdsJson
        # "}";

        return #ok(combinedJson);
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
            return #err("Unauthorized: Admin or Editor role required.");
        };
    };
};
