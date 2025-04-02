import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
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

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot update keys with __file__ prefix. Use associateFileWithUUID instead.");
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

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot update keys with __file__ prefix. Use associateFileWithUUID instead.");
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
                        lockedBy = ?caller;
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
            // Skip file association keys
            if (Storage.isFileAssociationKey(key)) {
                // Skip file association keys
            } else {
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

        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot lock keys with __file__ prefix.");
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
        // Check if the key starts with __file__ which is reserved for file associations
        if (Storage.isFileAssociationKey(req.key)) {
            return #err("Cannot get lock status for keys with __file__ prefix.");
        };

        let lockKey = Storage.makeLockKey(req.uuid, req.key);
        let statusOpt = valueLocks.get(lockKey);
        switch (statusOpt) {
            case null {
                return #err("No lock status found (value not locked).");
            };
            case (?s) { return #ok(s) };
        };
    };

    // Get full information for a given UUID including schema, key-value pairs, and lock statuses.
    public func getUUIDInfo(
        uuid : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>,
        _ : TrieMap.TrieMap<Text, Types.FileRecord>,
    ) : Types.Result<Text, Text> {
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
