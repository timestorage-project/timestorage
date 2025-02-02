import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Logic "./logic";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

shared (msg) actor class TimestorageBackend() {

    // --- Stable state ---
    stable var uuidToStructureStable : [(Types.UUID, Text)] = [];
    stable var uuidKeyValueStable : [(Types.UUID, [(Text, Text)])] = [];
    stable var uuidToFilesStable : [(Types.UUID, Types.FileRecord)] = [];
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var editorsStable : [(Principal, Bool)] = [];
    stable var uuidOwnersStable : [(Text, Principal)] = [];
    stable var valueLocksStable : [(Text, Types.ValueLockStatus)] = [];

    // --- Volatile state ---
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidKeyValueMap = Storage.newUUIDKeyValueMap();
    var uuidToFiles = Storage.newFileMap();
    var admins = Auth.newAdminMap();
    var editors = Auth.newEditorMap();
    var uuidOwners = Storage.newUUIDOwnerMap();
    var valueLocks = Storage.newValueLockMap();
    var fileCounter : Nat = 0;

    // Initial setup
    let initialAdmin = msg.caller;
    admins.put(initialAdmin, true);

    // --- Migration functions ---
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

    // --- Public functions ---

    // isAdmin function
    public shared query (msg) func isAdmin() : async Bool {
        return Auth.isAdmin(msg.caller, admins);
    };

    // isEditor function
    public shared query (msg) func isEditor() : async Bool {
        return Auth.isEditor(msg.caller, editors);
    };

    // addAdmin function
    public shared (msg) func addAdmin(newAdmin : Principal) : async Types.Result<Text, Text> {
        switch (Auth.addAdmin(newAdmin, msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("New admin added successfully.") };
        };
    };

    // addEditor function
    public shared (msg) func addEditor(newEditor : Principal) : async Types.Result<Text, Text> {
        switch (Auth.addEditor(newEditor, msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("New editor added successfully.") };
        };
    };

    // removeAdmin function
    public shared (msg) func removeAdmin(adminToRemove : Principal) : async Types.Result<Text, Text> {
        switch (Auth.removeAdmin(adminToRemove, msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("Admin removed successfully.") };
        };
    };

    // removeEditor function
    public shared (msg) func removeEditor(editorToRemove : Principal) : async Types.Result<Text, Text> {
        switch (Auth.removeEditor(editorToRemove, msg.caller, admins, editors)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) { return #ok("Editor removed successfully.") };
        };
    };

    // insertUUIDStructure function
    public shared (msg) func insertUUIDStructure(uuid : Text, schema : Text) : async Types.Result<Text, Text> {
        return Logic.insertUUIDStructure(
            uuid,
            schema,
            uuidToStructure,
            uuidKeyValueMap,
            uuidOwners,
            msg.caller,
            admins,
            editors,
        );
    };

    // uploadFile function
    public shared (msg) func uploadFile(uuid : Types.UUID, base64FileData : Text, metadata : Types.FileMetadata) : async Types.Result<Text, Text> {
        let (res, newCounter) = Logic.uploadFile(
            uuid,
            base64FileData,
            metadata,
            uuidToStructure,
            uuidToFiles,
            fileCounter,
            msg.caller,
        );
        fileCounter := newCounter;
        return res;
    };

    // getFileByUUIDAndId function
    public shared query (msg) func getFileByUUIDAndId(uuid : Types.UUID, fileId : Text) : async Types.Result<Types.FileResponse, Text> {
        return Logic.getFileByUUIDAndId(uuid, fileId, uuidToFiles);
    };

    // upadateValue function
    public shared (msg) func updateValue(req : Types.ValueUpdateRequest) : async Types.Result<Text, Text> {
        return Logic.updateValue(req, uuidKeyValueMap, valueLocks);
    };

    // updateManyValues function
    public shared (msg) func updateManyValues(uuid : Types.UUID, updates : [(Text, Text)]) : async Types.Result<Text, Text> {
        return Logic.updateManyValues(uuid, updates, uuidKeyValueMap, valueLocks);
    };

    // updateValueAndlock function
    public shared (msg) func updateValueAndLock(req : Types.ValueUpdateRequest) : async Types.Result<Text, Text> {
        return Logic.updateValueAndLock(req, uuidKeyValueMap, valueLocks, msg.caller);
    };

    // updateManyValuesAndLock function
    public shared (msg) func updateManyValuesAndLock(uuid : Types.UUID, updates : [(Text, Text)]) : async Types.Result<Text, Text> {
        return Logic.updateManyValuesAndLock(uuid, updates, uuidKeyValueMap, valueLocks, msg.caller);
    };

    // lockAllValues function
    public shared (msg) func lockAllValues(req : Types.ValueLockAllRequest) : async Types.Result<Text, Text> {
        return Logic.lockAllValues(req, uuidToStructure, uuidKeyValueMap, valueLocks, msg.caller);
    };

    // unlockAllValues function
    public shared (msg) func unlockAllValues(req : Types.ValueUnlockAllRequest) : async Types.Result<Text, Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };
        return Logic.unlockAllValues(req, uuidToStructure, uuidKeyValueMap, uuidOwners, valueLocks, msg.caller);
    };

    // getValue function
    public shared query (msg) func getValue(req : Types.ValueRequest) : async Types.Result<Text, Text> {
        return Logic.getValue(req, uuidKeyValueMap);
    };

    // getAllValues function
    public shared query (msg) func getAllValues(uuid : Types.UUID) : async Types.Result<[(Text, Text)], Text> {
        return Logic.getAllValues(uuid, uuidKeyValueMap);
    };

    // lockValue function
    public shared (msg) func lockValue(req : Types.ValueLockRequest) : async Types.Result<Text, Text> {
        return Logic.lockValue(req, uuidToStructure, valueLocks, msg.caller);
    };

    // unlockValue function
    public shared (msg) func unlockValue(req : Types.ValueUnlockRequest) : async Types.Result<Text, Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };
        return Logic.unlockValue(req, uuidToStructure, valueLocks, msg.caller);
    };

    // getValueLockStatus function
    public shared query (msg) func getValueLockStatus(req : Types.ValueLockStatusRequest) : async Types.Result<Types.ValueLockStatus, Text> {
        return Logic.getValueLockStatus(req, valueLocks);
    };

    // getUUIDInfo function
    public shared query (msg) func getUUIDInfo(uuid : Types.UUID) : async Types.Result<(Text, [Types.FileResponse]), Text> {
        return Logic.getUUIDInfo(uuid, uuidToStructure, uuidKeyValueMap, valueLocks, uuidToFiles);
    };

    // getAllUUIDs function
    public shared query (msg) func getAllUUIDs(ownerPrincipal : ?Principal) : async Types.Result<[Text], Text> {
        return Logic.getAllUUIDs(ownerPrincipal, uuidToStructure, uuidOwners, msg.caller, admins, editors);
    };
};
