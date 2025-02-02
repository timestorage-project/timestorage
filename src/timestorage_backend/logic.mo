import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

import Auth "./auth";
import Storage "./storage";
import Types "./types";
import Utils "./utils";

module Logic {

    // Insert a new UUID along with its schema.
    // This function initializes the key-value map and registers the caller as owner.
    public func insertUUIDStructure(
        uuid : Text,
        schema : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        uuidOwners : TrieMap.TrieMap<Text, Principal>,
        caller : Principal,
        admins : HashMap.HashMap<Principal, Bool>,
        editors : HashMap.HashMap<Principal, Bool>,
    ) : Types.Result<Text, Text> {
        switch (Auth.requireAdminOrEditor(caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        if (uuidToStructure.get(uuid) != null) {
            return #err("UUID already exists.");
        };
        uuidToStructure.put(uuid, schema);
        uuidOwners.put(uuid, caller);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        uuidKeyValueMap.put(uuid, subMap);
        return #ok("UUID inserted successfully.");
    };

    // Upload a file associated with a given UUID.
    // Returns a tuple containing the result and the updated fileCounter.
    public func uploadFile(
        uuid : Text,
        base64FileData : Text,
        metadata : Types.FileMetadata,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidToFiles : TrieMap.TrieMap<Text, Types.FileRecord>,
        fileCounter : Nat,
        _caller : Principal,
    ) : (Types.Result<Text, Text>, Nat) {
        if (uuidToStructure.get(uuid) == null) {
            return (#err("Error: UUID does not exist."), fileCounter);
        };
        if (metadata.fileName.size() == 0 or metadata.mimeType.size() == 0) {
            return (#err("Invalid metadata: File name and mimeType cannot be empty."), fileCounter);
        };
        let newFileCounter = fileCounter + 1;
        let fileId = "file-" # Nat.toText(newFileCounter);
        let fileRecord : Types.FileRecord = {
            uuid = uuid;
            fileData = base64FileData;
            metadata = metadata;
        };
        uuidToFiles.put(fileId, fileRecord);
        return (#ok("File uploaded successfully with ID: " # fileId), newFileCounter);
    };

    // Retrieve a file by UUID and file ID.
    public func getFileByUUIDAndId(
        uuid : Text,
        fileId : Text,
        uuidToFiles : TrieMap.TrieMap<Text, Types.FileRecord>,
    ) : Types.Result<Types.FileResponse, Text> {
        let fileOpt = uuidToFiles.get(fileId);
        switch (fileOpt) {
            case null { return #err("File not found.") };
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

    // Update the value for a given key (if it is not locked).
    public func updateValue(
        req : Types.ValueUpdateRequest,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
    ) : Types.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };
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
        subMap.put(req.key, req.newValue);
        return #ok("Value updated successfully.");
    };

    // Update multiple values and report any keys that are locked.
    public func updateManyValues(
        uuid : Text,
        updates : [(Text, Text)],
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
    ) : Types.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
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

    // Update a value and lock it at the same time.
    public func updateValueAndLock(
        req : Types.ValueUpdateRequest,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        caller : Principal,
    ) : Types.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };
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
        subMap.put(req.key, req.newValue);
        let newStatus : Types.ValueLockStatus = {
            locked = true;
            lockedBy = ?caller;
        };
        valueLocks.put(lockKey, newStatus);
        return #ok("Value updated and locked successfully.");
    };

    // Update multiple values and lock them, reporting any keys that could not be updated.
    public func updateManyValuesAndLock(
        uuid : Text,
        updates : [(Text, Text)],
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        caller : Principal,
    ) : Types.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
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
                    lockedBy = ?caller;
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

    // Lock all values for a given UUID.
    public func lockAllValues(
        req : Types.ValueLockAllRequest,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        caller : Principal,
    ) : Types.Result<Text, Text> {
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };
        for ((key, _) in subMap.entries()) {
            let lockKey = Storage.makeLockKey(req.uuid, key);
            let current = valueLocks.get(lockKey);
            switch (current) {
                case (?status) {
                    if (not status.locked) {
                        let newStatus : Types.ValueLockStatus = {
                            locked = true;
                            lockedBy = ?caller;
                        };
                        valueLocks.put(lockKey, newStatus);
                    };
                };
                case null {
                    let newStatus : Types.ValueLockStatus = {
                        locked = true;
                        lockedBy = ?caller;
                    };
                    valueLocks.put(lockKey, newStatus);
                };
            };
        };
        return #ok("All values locked successfully.");
    };

    // Unlock all values for a given UUID.
    public func unlockAllValues(
        req : Types.ValueUnlockAllRequest,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        _uuidOwners : TrieMap.TrieMap<Text, Principal>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        _caller : Principal,
    ) : Types.Result<Text, Text> {
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };
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

    // Get the value for a given key.
    public func getValue(
        req : Types.ValueRequest,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Types.Result<Text, Text> {
        let subMapOpt = uuidKeyValueMap.get(req.uuid);
        let subMap = switch (subMapOpt) {
            case null { return #err("UUID not found.") };
            case (?m) m;
        };
        let valOpt = subMap.get(req.key);
        switch (valOpt) {
            case null { return #err("Key not found.") };
            case (?v) { return #ok(v) };
        };
    };

    // Get all key-value pairs for a given UUID.
    public func getAllValues(
        uuid : Text,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Types.Result<[(Text, Text)], Text> {
        let subMapOpt = uuidKeyValueMap.get(uuid);
        switch (subMapOpt) {
            case null { return #err("UUID not found.") };
            case (?subMap) {
                let entries = Iter.toArray(subMap.entries());
                return #ok(entries);
            };
        };
    };

    // Lock a single value.
    public func lockValue(
        req : Types.ValueLockRequest,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        caller : Principal,
    ) : Types.Result<Text, Text> {
        if (uuidToStructure.get(req.uuid) == null) {
            return #err("UUID not found.");
        };
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let current = valueLocks.get(lockKey);
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
            lockedBy = ?caller;
        };
        valueLocks.put(lockKey, newStatus);
        return #ok("Value locked successfully.");
    };

    // Unlock a single value.
    public func unlockValue(
        req : Types.ValueUnlockRequest,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        _caller : Principal,
    ) : Types.Result<Text, Text> {
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
            case null { return #err("Value lock status not found.") };
        };
        let newStatus : Types.ValueLockStatus = {
            locked = false;
            lockedBy = null;
        };
        valueLocks.put(lockKey, newStatus);
        return #ok("Value unlocked successfully.");
    };

    // Get the lock status for a given key.
    public func getValueLockStatus(
        req : Types.ValueLockStatusRequest,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
    ) : Types.Result<Types.ValueLockStatus, Text> {
        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let statusOpt = valueLocks.get(lockKey);
        switch (statusOpt) {
            case null {
                return #err("No lock status found (value not locked).");
            };
            case (?s) { return #ok(s) };
        };
    };

    // Get full information for a given UUID including schema, key-value pairs, lock statuses, and associated files.
    public func getUUIDInfo(
        uuid : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        uuidToFiles : TrieMap.TrieMap<Text, Types.FileRecord>,
    ) : Types.Result<(Text, [Types.FileResponse]), Text> {
        let schemaOpt = uuidToStructure.get(uuid);
        let schemaText = switch (schemaOpt) {
            case null { return #err("UUID not found.") };
            case (?text) { text };
        };
        let subMapOpt = uuidKeyValueMap.get(uuid);
        let dataJson = switch (subMapOpt) {
            case null { "{}" };
            case (?map) {
                let entries = Iter.toArray(map.entries());
                Utils.mapEntriesToJson(entries);
            };
        };
        var lockStatuses : [(Text, Text)] = [];
        switch (subMapOpt) {
            case null {};
            case (?map) {
                for ((key, _) in map.entries()) {
                    let lockKey = Storage.makeLockKey(uuid, key);
                    let lockStatusOpt = valueLocks.get(lockKey);
                    let lockStatus = switch (lockStatusOpt) {
                        case null { "unlocked" };
                        case (?s) { if (s.locked) "locked" else "unlocked" };
                    };
                    lockStatuses := Array.append(lockStatuses, [(key, lockStatus)]);
                };
            };
        };
        let schemaTextTrimmed = Text.trimStart(schemaText, #text "{");
        let schemaTextFinal = Text.trimEnd(schemaTextTrimmed, #text "}");
        let combinedJson = "{" # schemaTextFinal # "}," # "\"values\":" # dataJson # "," # "\"lockStatus\":" # Utils.mapEntriesToJson(lockStatuses) # "}";
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
        return #ok((combinedJson, fileResponses));
    };

    // Get all UUIDs based on the caller's role (admin/editor) and an optional owner filter.
    public func getAllUUIDs(
        ownerPrincipal : ?Principal,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidOwners : TrieMap.TrieMap<Text, Principal>,
        caller : Principal,
        admins : HashMap.HashMap<Principal, Bool>,
        editors : HashMap.HashMap<Principal, Bool>,
    ) : Types.Result<[Text], Text> {
        if (Auth.isAdmin(caller, admins)) {
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
        } else if (Auth.isEditor(caller, editors)) {
            switch (ownerPrincipal) {
                case null {
                    var editorUuids : [Text] = [];
                    for ((u, owner) in uuidOwners.entries()) {
                        if (owner == caller) {
                            editorUuids := Array.append(editorUuids, [u]);
                        };
                    };
                    return #ok(editorUuids);
                };
                case (?principal) {
                    if (principal == caller) {
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
