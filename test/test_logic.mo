import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import TrieMap "mo:base/TrieMap";
import HashMap "mo:base/HashMap";

import Logic "../src/timestorage_backend/logic";
import Storage "../src/timestorage_backend/storage";
import Types "../src/timestorage_backend/types";
import Auth "../src/timestorage_backend/auth";

module {

    // Helper function: creates the state maps used by Logic tests,
    // using the deployer (adminPrincipal) as the default admin.
    func createState(adminPrincipal : Principal) : {
        uuidToStructure : TrieMap.TrieMap<Text, Text>;
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>;
        uuidOwners : TrieMap.TrieMap<Text, Principal>;
        valueLocks : TrieMap.TrieMap<Text, Types.ValueLockStatus>;
        uuidToFiles : TrieMap.TrieMap<Text, Types.FileRecord>;
        admins : HashMap.HashMap<Principal, Bool>;
        editors : HashMap.HashMap<Principal, Bool>;
    } {
        let uuidToStructure = Storage.newUUIDStructure();
        let uuidKeyValueMap = Storage.newUUIDKeyValueMap();
        let uuidOwners = Storage.newUUIDOwnerMap();
        let valueLocks = Storage.newValueLockMap();
        let uuidToFiles = Storage.newFileMap();
        let admins = Auth.newAdminMap();
        let editors = Auth.newEditorMap();
        admins.put(adminPrincipal, true);
        return {
            uuidToStructure = uuidToStructure;
            uuidKeyValueMap = uuidKeyValueMap;
            uuidOwners = uuidOwners;
            valueLocks = valueLocks;
            uuidToFiles = uuidToFiles;
            admins = admins;
            editors = editors;
        };
    };

    // -------------------------------
    // Test for insertUUIDStructure
    public func testInsertUUIDStructure(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);

        // Authorized insertion
        let result1 = Logic.insertUUIDStructure(
            "uuid-1",
            "schema-1",
            state.uuidToStructure,
            state.uuidKeyValueMap,
            state.uuidOwners,
            adminPrincipal,
            state.admins,
            state.editors,
        );
        switch (result1) {
            case (#ok(msg)) {
                Debug.print("testInsertUUIDStructure: " # msg);
                assert msg == "UUID inserted successfully.";
            };
            case (#err(e)) {
                Debug.print("testInsertUUIDStructure failed: " # e);
                assert false;
            };
        };

        // Attempt duplicate insertion
        let result2 = Logic.insertUUIDStructure(
            "uuid-1",
            "schema-duplicate",
            state.uuidToStructure,
            state.uuidKeyValueMap,
            state.uuidOwners,
            adminPrincipal,
            state.admins,
            state.editors,
        );
        switch (result2) {
            case (#err(e)) {
                Debug.print("testInsertUUIDStructure duplicate: " # e);
                assert e == "UUID already exists.";
            };
            case (#ok(_)) {
                Debug.print("testInsertUUIDStructure: Duplicate insertion should not succeed.");
                assert false;
            };
        };

        // Attempt insertion with unauthorized principal
        let nonAuth = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        let result3 = Logic.insertUUIDStructure(
            "uuid-2",
            "schema-2",
            state.uuidToStructure,
            state.uuidKeyValueMap,
            state.uuidOwners,
            nonAuth,
            state.admins,
            state.editors,
        );
        switch (result3) {
            case (#err(e)) {
                Debug.print("testInsertUUIDStructure unauthorized: " # e);
                assert e == "Unauthorized: Admin o Editor role required.";
            };
            case (#ok(_)) {
                Debug.print("testInsertUUIDStructure: Unauthorized insertion succeeded (error).");
                assert false;
            };
        };

        Debug.print("testInsertUUIDStructure passed");
    };

    // -------------------------------
    // Test for uploadFile
    public func testUploadFile(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        // Insert a UUID first
        let _ = Logic.insertUUIDStructure(
            "uuid-file",
            "schema-file",
            state.uuidToStructure,
            state.uuidKeyValueMap,
            state.uuidOwners,
            adminPrincipal,
            state.admins,
            state.editors,
        );
        let fileMetadata : Types.FileMetadata = {
            fileName = "file.txt";
            mimeType = "text/plain";
            uploadTimestamp = 123;
        };
        let (result, newCounter) = Logic.uploadFile(
            "uuid-file",
            "base64data",
            fileMetadata,
            state.uuidToStructure,
            state.uuidToFiles,
            0,
            adminPrincipal,
        );
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUploadFile: " # msg);
                assert Text.startsWith(msg, #text("File uploaded successfully with ID:"));
            };
            case (#err(e)) {
                Debug.print("testUploadFile failed: " # e);
                assert false;
            };
        };

        // Error: upload for non-existent UUID
        let (resultErr, _) = Logic.uploadFile(
            "non-existent",
            "data",
            fileMetadata,
            state.uuidToStructure,
            state.uuidToFiles,
            newCounter,
            adminPrincipal,
        );
        switch (resultErr) {
            case (#err(e)) {
                Debug.print("testUploadFile non-existent UUID: " # e);
                assert e == "Error: UUID does not exist.";
            };
            case (#ok(_)) {
                Debug.print("testUploadFile: Upload should have failed for non-existent UUID.");
                assert false;
            };
        };

        // Error: invalid metadata (empty fileName)
        let invalidMetadata : Types.FileMetadata = {
            fileName = "";
            mimeType = "text/plain";
            uploadTimestamp = 123;
        };
        let (resultInvalid, _) = Logic.uploadFile(
            "uuid-file",
            "data",
            invalidMetadata,
            state.uuidToStructure,
            state.uuidToFiles,
            newCounter,
            adminPrincipal,
        );
        switch (resultInvalid) {
            case (#err(e)) {
                Debug.print("testUploadFile invalid metadata: " # e);
                assert e == "Invalid metadata: File name and mimeType cannot be empty.";
            };
            case (#ok(_)) {
                Debug.print("testUploadFile: Upload should have failed for invalid metadata.");
                assert false;
            };
        };

        Debug.print("testUploadFile passed");
    };

    // -------------------------------
    // Test for getFileByUUIDAndId
    public func testGetFileByUUIDAndId(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let _ = Logic.insertUUIDStructure(
            "uuid-file2",
            "schema-file2",
            state.uuidToStructure,
            state.uuidKeyValueMap,
            state.uuidOwners,
            adminPrincipal,
            state.admins,
            state.editors,
        );
        let fileMetadata : Types.FileMetadata = {
            fileName = "document.pdf";
            mimeType = "application/pdf";
            uploadTimestamp = 456;
        };
        let (uploadResult, _) = Logic.uploadFile(
            "uuid-file2",
            "pdfdata",
            fileMetadata,
            state.uuidToStructure,
            state.uuidToFiles,
            0,
            adminPrincipal,
        );
        var fileId : Text = "";
        switch (uploadResult) {
            case (#ok(msg)) {
                let parts = Iter.toArray(Text.split(msg, #text(": ")));
                if (parts.size() > 0) {
                    fileId := parts[parts.size() - 1];
                };
            };
            case (#err(e)) {
                Debug.print("testGetFileByUUIDAndId: Upload failed - " # e);
                assert false;
            };
        };

        // Retrieve file with correct UUID and fileId
        let getResult = Logic.getFileByUUIDAndId("uuid-file2", fileId, state.uuidToFiles);
        switch (getResult) {
            case (#ok(fileResponse)) {
                Debug.print("testGetFileByUUIDAndId: File retrieved - " # fileResponse.metadata.fileName);
                assert fileResponse.uuid == "uuid-file2";
            };
            case (#err(e)) {
                Debug.print("testGetFileByUUIDAndId failed: " # e);
                assert false;
            };
        };

        // Error: incorrect UUID for the fileId
        let getResultWrong = Logic.getFileByUUIDAndId("wrong-uuid", fileId, state.uuidToFiles);
        switch (getResultWrong) {
            case (#err(e)) {
                Debug.print("testGetFileByUUIDAndId wrong UUID: " # e);
                assert e == "File does not belong to the given UUID.";
            };
            case (#ok(_)) {
                Debug.print("testGetFileByUUIDAndId: Should have failed for wrong UUID.");
                assert false;
            };
        };

        // Error: non-existent fileId
        let getResultNonExistent = Logic.getFileByUUIDAndId("uuid-file2", "non-existent", state.uuidToFiles);
        switch (getResultNonExistent) {
            case (#err(e)) {
                Debug.print("testGetFileByUUIDAndId non-existent fileId: " # e);
                assert e == "File not found.";
            };
            case (#ok(_)) {
                Debug.print("testGetFileByUUIDAndId: Should have failed for non-existent fileId.");
                assert false;
            };
        };

        Debug.print("testGetFileByUUIDAndId passed");
    };

    // -------------------------------
    // Test for updateValue
    public func testUpdateValue(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        // Create a sub-map for UUID "uuid-update" with an initial key-value pair
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("key1", "oldValue");
        state.uuidKeyValueMap.put("uuid-update", subMap);

        let updateReq : Types.ValueUpdateRequest = {
            uuid = "uuid-update";
            key = "key1";
            newValue = "newValue";
        };
        let result = Logic.updateValue(updateReq, state.uuidKeyValueMap, state.valueLocks);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUpdateValue: " # msg);
                let updatedVal = subMap.get("key1");
                assert updatedVal == ?"newValue";
            };
            case (#err(e)) {
                Debug.print("testUpdateValue failed: " # e);
                assert false;
            };
        };

        // Error: value is locked
        let lockKey = Storage.makeLockKey("uuid-update", "key1");
        state.valueLocks.put(lockKey, { locked = true; lockedBy = ?adminPrincipal });
        let resultLocked = Logic.updateValue(updateReq, state.uuidKeyValueMap, state.valueLocks);
        switch (resultLocked) {
            case (#err(e)) {
                Debug.print("testUpdateValue locked: " # e);
                assert e == "Value is locked and cannot be modified.";
            };
            case (#ok(_)) {
                Debug.print("testUpdateValue: Should have failed due to locked value.");
                assert false;
            };
        };

        Debug.print("testUpdateValue passed");
    };

    // -------------------------------
    // Test for updateManyValues
    public func testUpdateManyValues(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        // Create a sub-map for UUID "uuid-many" with two key-value pairs
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("k1", "v1");
        subMap.put("k2", "v2");
        state.uuidKeyValueMap.put("uuid-many", subMap);
        // Lock key "k2"
        let lockKey = Storage.makeLockKey("uuid-many", "k2");
        state.valueLocks.put(lockKey, { locked = true; lockedBy = ?adminPrincipal });

        let updates : [(Text, Text)] = [("k1", "newV1"), ("k2", "newV2")];
        let result = Logic.updateManyValues("uuid-many", updates, state.uuidKeyValueMap, state.valueLocks);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUpdateManyValues: " # msg);
                let v1 = subMap.get("k1");
                assert v1 == ?"newV1";
                let v2 = subMap.get("k2");
                // k2 should not update because it is locked
                assert v2 == ?"v2";
            };
            case (#err(e)) {
                Debug.print("testUpdateManyValues failed: " # e);
                assert false;
            };
        };

        Debug.print("testUpdateManyValues passed");
    };

    // -------------------------------
    // Test for updateValueAndLock
    public func testUpdateValueAndLock(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("key-lock", "old");
        state.uuidKeyValueMap.put("uuid-update-lock", subMap);

        let req : Types.ValueUpdateRequest = {
            uuid = "uuid-update-lock";
            key = "key-lock";
            newValue = "lockedValue";
        };
        let result = Logic.updateValueAndLock(req, state.uuidKeyValueMap, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUpdateValueAndLock: " # msg);
                let newVal = subMap.get("key-lock");
                assert newVal == ?"lockedValue";
                let lockKey = Storage.makeLockKey("uuid-update-lock", "key-lock");
                let lockStatus = state.valueLocks.get(lockKey);
                switch (lockStatus) {
                    case (?s) {
                        assert s.locked == true;
                        assert s.lockedBy == ?adminPrincipal;
                    };
                    case null { assert false };
                };
            };
            case (#err(e)) {
                Debug.print("testUpdateValueAndLock failed: " # e);
                assert false;
            };
        };

        Debug.print("testUpdateValueAndLock passed");
    };

    // -------------------------------
    // Test for updateManyValuesAndLock
    public func testUpdateManyValuesAndLock(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("a", "1");
        subMap.put("b", "2");
        state.uuidKeyValueMap.put("uuid-update-many-lock", subMap);
        // Pre-lock key "b"
        let lockKeyB = Storage.makeLockKey("uuid-update-many-lock", "b");
        state.valueLocks.put(lockKeyB, { locked = true; lockedBy = ?adminPrincipal });

        let updates : [(Text, Text)] = [("a", "100"), ("b", "200")];
        let result = Logic.updateManyValuesAndLock("uuid-update-many-lock", updates, state.uuidKeyValueMap, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUpdateManyValuesAndLock: " # msg);
                let va = subMap.get("a");
                assert va == ?"100";
                let vb = subMap.get("b");
                // "b" should not update because it is already locked
                assert vb == ?"2";
            };
            case (#err(e)) {
                Debug.print("testUpdateManyValuesAndLock failed: " # e);
                assert false;
            };
        };

        Debug.print("testUpdateManyValuesAndLock passed");
    };

    // -------------------------------
    // Test for lockAllValues
    public func testLockAllValues(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("x", "valX");
        subMap.put("y", "valY");
        state.uuidKeyValueMap.put("uuid-lockall", subMap);
        state.uuidToStructure.put("uuid-lockall", "schema-lockall");

        let req : Types.ValueLockAllRequest = {
            uuid = "uuid-lockall";
            lock = true;
        };
        let result = Logic.lockAllValues(req, state.uuidToStructure, state.uuidKeyValueMap, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testLockAllValues: " # msg);
                let lockKeyX = Storage.makeLockKey("uuid-lockall", "x");
                let lockKeyY = Storage.makeLockKey("uuid-lockall", "y");
                let statusX = state.valueLocks.get(lockKeyX);
                let statusY = state.valueLocks.get(lockKeyY);
                switch (statusX) {
                    case (?s) { assert s.locked == true };
                    case null { assert false };
                };
                switch (statusY) {
                    case (?s) { assert s.locked == true };
                    case null { assert false };
                };
            };
            case (#err(e)) {
                Debug.print("testLockAllValues failed: " # e);
                assert false;
            };
        };

        Debug.print("testLockAllValues passed");
    };

    // -------------------------------
    // Test for unlockAllValues
    public func testUnlockAllValues(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("p", "valP");
        subMap.put("q", "valQ");
        state.uuidKeyValueMap.put("uuid-unlockall", subMap);
        state.uuidToStructure.put("uuid-unlockall", "schema-unlockall");
        let lockKeyP = Storage.makeLockKey("uuid-unlockall", "p");
        let lockKeyQ = Storage.makeLockKey("uuid-unlockall", "q");
        state.valueLocks.put(lockKeyP, { locked = true; lockedBy = ?adminPrincipal });
        state.valueLocks.put(lockKeyQ, { locked = true; lockedBy = ?adminPrincipal });

        let req : Types.ValueUnlockAllRequest = { uuid = "uuid-unlockall" };
        let result = Logic.unlockAllValues(req, state.uuidToStructure, state.uuidKeyValueMap, state.uuidOwners, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUnlockAllValues: " # msg);
                let statusP = state.valueLocks.get(lockKeyP);
                let statusQ = state.valueLocks.get(lockKeyQ);
                switch (statusP) {
                    case (?s) { assert s.locked == false };
                    case null { assert false };
                };
                switch (statusQ) {
                    case (?s) { assert s.locked == false };
                    case null { assert false };
                };
            };
            case (#err(e)) {
                Debug.print("testUnlockAllValues failed: " # e);
                assert false;
            };
        };

        Debug.print("testUnlockAllValues passed");
    };

    // -------------------------------
    // Test for getValue
    public func testGetValue(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("foo", "bar");
        state.uuidKeyValueMap.put("uuid-get", subMap);

        let req : Types.ValueRequest = { uuid = "uuid-get"; key = "foo" };
        let result = Logic.getValue(req, state.uuidKeyValueMap);
        switch (result) {
            case (#ok(val)) {
                Debug.print("testGetValue: Retrieved value " # val);
                assert val == "bar";
            };
            case (#err(e)) {
                Debug.print("testGetValue failed: " # e);
                assert false;
            };
        };

        let req2 : Types.ValueRequest = {
            uuid = "uuid-get";
            key = "nonexistent";
        };
        let result2 = Logic.getValue(req2, state.uuidKeyValueMap);
        switch (result2) {
            case (#err(e)) {
                Debug.print("testGetValue for nonexistent key: " # e);
                assert e == "Key not found.";
            };
            case (#ok(_)) {
                Debug.print("testGetValue: Should have failed for nonexistent key.");
                assert false;
            };
        };

        Debug.print("testGetValue passed");
    };

    // -------------------------------
    // Test for getAllValues
    public func testGetAllValues(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("a", "1");
        subMap.put("b", "2");
        state.uuidKeyValueMap.put("uuid-all", subMap);

        let result = Logic.getAllValues("uuid-all", state.uuidKeyValueMap);
        switch (result) {
            case (#ok(entries)) {
                Debug.print("testGetAllValues: Retrieved entries " # debug_show (entries));
                assert entries.size() == 2;
            };
            case (#err(e)) {
                Debug.print("testGetAllValues failed: " # e);
                assert false;
            };
        };

        let result2 = Logic.getAllValues("nonexistent", state.uuidKeyValueMap);
        switch (result2) {
            case (#err(e)) {
                Debug.print("testGetAllValues for nonexistent UUID: " # e);
                assert e == "UUID not found.";
            };
            case (#ok(_)) {
                Debug.print("testGetAllValues: Should have failed for nonexistent UUID.");
                assert false;
            };
        };

        Debug.print("testGetAllValues passed");
    };

    // -------------------------------
    // Test for lockValue
    public func testLockValue(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        state.uuidToStructure.put("uuid-lock", "schema-lock");
        let req : Types.ValueLockRequest = {
            uuid = "uuid-lock";
            key = "lockKey";
            lock = true;
        };
        let result = Logic.lockValue(req, state.uuidToStructure, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testLockValue: " # msg);
                assert msg == "Value locked successfully.";
                let lockKey = Storage.makeLockKey("uuid-lock", "lockKey");
                let status = state.valueLocks.get(lockKey);
                switch (status) {
                    case (?s) { assert s.locked == true };
                    case null { assert false };
                };
            };
            case (#err(e)) {
                Debug.print("testLockValue failed: " # e);
                assert false;
            };
        };

        let result2 = Logic.lockValue(req, state.uuidToStructure, state.valueLocks, adminPrincipal);
        switch (result2) {
            case (#err(e)) {
                Debug.print("testLockValue already locked: " # e);
                assert e == "Value is already locked.";
            };
            case (#ok(_)) {
                Debug.print("testLockValue: Should have failed for already locked value.");
                assert false;
            };
        };

        Debug.print("testLockValue passed");
    };

    // -------------------------------
    // Test for unlockValue
    public func testUnlockValue(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        state.uuidToStructure.put("uuid-unlock", "schema-unlock");
        let lockKey = Storage.makeLockKey("uuid-unlock", "uKey");
        state.valueLocks.put(lockKey, { locked = true; lockedBy = ?adminPrincipal });
        let req : Types.ValueUnlockRequest = {
            uuid = "uuid-unlock";
            key = "uKey";
        };
        let result = Logic.unlockValue(req, state.uuidToStructure, state.valueLocks, adminPrincipal);
        switch (result) {
            case (#ok(msg)) {
                Debug.print("testUnlockValue: " # msg);
                let status = state.valueLocks.get(lockKey);
                switch (status) {
                    case (?s) { assert s.locked == false };
                    case null { assert false };
                };
            };
            case (#err(e)) {
                Debug.print("testUnlockValue failed: " # e);
                assert false;
            };
        };

        let result2 = Logic.unlockValue(req, state.uuidToStructure, state.valueLocks, adminPrincipal);
        switch (result2) {
            case (#err(e)) {
                Debug.print("testUnlockValue already unlocked: " # e);
                assert e == "Value is already unlocked.";
            };
            case (#ok(_)) {
                Debug.print("testUnlockValue: Should have failed for already unlocked value.");
                assert false;
            };
        };

        Debug.print("testUnlockValue passed");
    };

    // -------------------------------
    // Test for getValueLockStatus
    public func testGetValueLockStatus(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        state.uuidToStructure.put("uuid-status", "schema-status");
        let lockKey = Storage.makeLockKey("uuid-status", "statusKey");
        state.valueLocks.put(lockKey, { locked = true; lockedBy = ?adminPrincipal });
        let req : Types.ValueLockStatusRequest = {
            uuid = "uuid-status";
            key = "statusKey";
        };
        let result = Logic.getValueLockStatus(req, state.valueLocks);
        switch (result) {
            case (#ok(status)) {
                Debug.print("testGetValueLockStatus: Retrieved status.");
                assert status.locked == true;
            };
            case (#err(e)) {
                Debug.print("testGetValueLockStatus failed: " # e);
                assert false;
            };
        };

        let req2 : Types.ValueLockStatusRequest = {
            uuid = "uuid-status";
            key = "nonexistent";
        };
        let result2 = Logic.getValueLockStatus(req2, state.valueLocks);
        switch (result2) {
            case (#err(e)) {
                Debug.print("testGetValueLockStatus for nonexistent key: " # e);
                assert e == "No lock status found (value not locked).";
            };
            case (#ok(_)) {
                Debug.print("testGetValueLockStatus: Should have failed for nonexistent key.");
                assert false;
            };
        };

        Debug.print("testGetValueLockStatus passed");
    };

    // -------------------------------
    // Test for getUUIDInfo
    public func testGetUUIDInfo(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        state.uuidToStructure.put("uuid-info", "{ \"title\": \"Test\" }");
        let subMap = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        subMap.put("k", "v");
        state.uuidKeyValueMap.put("uuid-info", subMap);
        let lockKey = Storage.makeLockKey("uuid-info", "k");
        state.valueLocks.put(lockKey, { locked = false; lockedBy = null });
        let fileMetadata : Types.FileMetadata = {
            fileName = "info.txt";
            mimeType = "text/plain";
            uploadTimestamp = 789;
        };
        let fileRecord : Types.FileRecord = {
            uuid = "uuid-info";
            fileData = "filedata";
            metadata = fileMetadata;
        };
        state.uuidToFiles.put("file-1", fileRecord);

        let result = Logic.getUUIDInfo("uuid-info", state.uuidToStructure, state.uuidKeyValueMap, state.valueLocks, state.uuidToFiles);
        switch (result) {
            case (#ok((json, fileResponses))) {
                Debug.print("testGetUUIDInfo: JSON info: " # json);
                Debug.print("testGetUUIDInfo: Number of files: " # Nat.toText(fileResponses.size()));
                assert fileResponses.size() == 1;
            };
            case (#err(e)) {
                Debug.print("testGetUUIDInfo failed: " # e);
                assert false;
            };
        };

        Debug.print("testGetUUIDInfo passed");
    };

    // -------------------------------
    // Test for getAllUUIDs
    public func testGetAllUUIDs(adminPrincipal : Principal) {
        let state = createState(adminPrincipal);
        state.uuidToStructure.put("uuid-1", "schema1");
        state.uuidToStructure.put("uuid-2", "schema2");
        state.uuidToStructure.put("uuid-3", "schema3");
        state.uuidOwners.put("uuid-1", adminPrincipal);
        state.uuidOwners.put("uuid-2", adminPrincipal);
        let otherPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        state.uuidOwners.put("uuid-3", otherPrincipal);

        // Test as admin: without filter
        let resultAdmin = Logic.getAllUUIDs(null, state.uuidToStructure, state.uuidOwners, adminPrincipal, state.admins, state.editors);
        switch (resultAdmin) {
            case (#ok(uuids)) {
                Debug.print("testGetAllUUIDs (admin): " # debug_show (uuids));
                assert uuids.size() == 3;
            };
            case (#err(e)) {
                Debug.print("testGetAllUUIDs (admin) failed: " # e);
                assert false;
            };
        };

        // Test as editor: only own UUIDs should be visible
        state.editors.put(otherPrincipal, true);
        let resultEditor = Logic.getAllUUIDs(null, state.uuidToStructure, state.uuidOwners, otherPrincipal, state.admins, state.editors);
        switch (resultEditor) {
            case (#ok(uuids)) {
                Debug.print("testGetAllUUIDs (editor): " # debug_show (uuids));
                assert uuids.size() == 1;
                assert Array.find(uuids, func(u : Text) : Bool { u == "uuid-3" }) != null;
            };
            case (#err(e)) {
                Debug.print("testGetAllUUIDs (editor) failed: " # e);
                assert false;
            };
        };

        // Test: editor requesting UUIDs with an owner filter (should be unauthorized)
        let resultEditorFilter = Logic.getAllUUIDs(?adminPrincipal, state.uuidToStructure, state.uuidOwners, otherPrincipal, state.admins, state.editors);
        switch (resultEditorFilter) {
            case (#err(e)) {
                Debug.print("testGetAllUUIDs (editor with filter): " # e);
                assert e == "Unauthorized: Can only query your own UUIDs";
            };
            case (#ok(_)) {
                Debug.print("testGetAllUUIDs: Editor should not be able to request others' UUIDs.");
                assert false;
            };
        };

        Debug.print("testGetAllUUIDs passed");
    };

    // -------------------------------
    // Run all Logic tests
    public func runAllTests(adminPrincipal : Principal) {
        testInsertUUIDStructure(adminPrincipal);
        testUploadFile(adminPrincipal);
        testGetFileByUUIDAndId(adminPrincipal);
        testUpdateValue(adminPrincipal);
        testUpdateManyValues(adminPrincipal);
        testUpdateValueAndLock(adminPrincipal);
        testUpdateManyValuesAndLock(adminPrincipal);
        testLockAllValues(adminPrincipal);
        testUnlockAllValues(adminPrincipal);
        testGetValue(adminPrincipal);
        testGetAllValues(adminPrincipal);
        testLockValue(adminPrincipal);
        testUnlockValue(adminPrincipal);
        testGetValueLockStatus(adminPrincipal);
        testGetUUIDInfo(adminPrincipal);
        testGetAllUUIDs(adminPrincipal);
        Debug.print("All Logic tests passed!");
    };
};
