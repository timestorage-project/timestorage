import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Types "../src/timestorage_backend/types";

module {
    // Helper function to get the timestorage_backend canister
    private func getBackendCanister() : async actor {
        insertUUIDStructure: (Text, Text) -> async Result.Result<Text, Text>;
        uploadFile: (Text, Text, Types.FileMetadata) -> async Result.Result<Text, Text>;
        updateValue: (Types.ValueUpdateRequest) -> async Result.Result<Text, Text>;
        getValue: (Types.ValueRequest) -> async Result.Result<Text, Text>;
        lockValue: (Types.ValueLockRequest) -> async Result.Result<Text, Text>;
        getValueLockStatus: (Types.ValueLockStatusRequest) -> async Result.Result<Types.ValueLockStatus, Text>;
        addAdmin: (Principal) -> async Result.Result<Text, Text>;
        removeAdmin: (Principal) -> async Result.Result<Text, Text>;
        getAllUUIDs: () -> async Result.Result<[Text], Text>;
    } {
        let backend_id = Principal.fromText("bkyz2-fmaaa-aaaaa-qaaaq-cai");
        actor(Principal.toText(backend_id));
    };

    // Test for insertUUIDStructure function
    public func testInsertUUIDStructure(deployerPrincipal: Principal) : async () {
        let backend = await getBackendCanister();
        
        // Add test principal as admin || otherwise set it in test.mo the principal of the timestorage_backend canister
        let addAdminResult = await backend.addAdmin(deployerPrincipal);
        switch (addAdminResult) {
            case (#ok(msg)) { Debug.print("Test principal added as admin: " # msg); };
            case (#err(e)) { Debug.print("Failed to add test principal as admin: " # e); };
        };

        let result = await backend.insertUUIDStructure("uuid-1", "schema-1");
        switch (result) {
            case (#ok(msg)) {
                assert msg == "UUID inserted successfully.";
                Debug.print("UUID structure inserted successfully");
            };
            case (#err(e)) {
                Debug.print("testInsertUUIDStructure: Failed - " # e);
                assert false;
            };
        };

        Debug.print("testInsertUUIDStructure: Passed");
    };

    // Test for uploadFile function
    public func testUploadFile(deployerPrincipal: Principal) : async () {
        let backend = await getBackendCanister();

        Debug.print("Testing file upload with deployer principal: " # Principal.toText(deployerPrincipal));

        // Valid file upload
        let validFileRequest = {
            uuid = "uuid-1";
            base64FileData = "base64-data";
            metadata = {
                fileName = "file.txt";
                mimeType = "text/plain";
                uploadTimestamp = 0;
            };
        };

        let uploadResult = await backend.uploadFile("uuid-1", "base64-data", validFileRequest.metadata);
        switch (uploadResult) {
            case (#ok(msg)) {
                assert Text.startsWith(msg, #text "File uploaded successfully");
                Debug.print("File uploaded successfully");
            };
            case (#err(e)) {
                Debug.print("testUploadFile: Failed - " # e);
                assert false;
            };
        };

        Debug.print("testUploadFile: Passed");
    };

    // Test for updateValue function
    public func testUpdateValue(deployerPrincipal: Principal) : async () {
        let backend = await getBackendCanister();

        Debug.print("Testing value update with deployer principal: " # Principal.toText(deployerPrincipal));

        // Update a value
        let updateRequest : Types.ValueUpdateRequest = {
            uuid = "uuid-1";
            key = "key1";
            newValue = "value1";
        };

        let updateResult = await backend.updateValue(updateRequest);
        switch (updateResult) {
            case (#ok(msg)) {
                assert msg == "Value updated successfully.";
                Debug.print("Value updated successfully");
            };
            case (#err(e)) {
                Debug.print("testUpdateValue: Failed - " # e);
                assert false;
            };
        };

        Debug.print("testUpdateValue: Passed");
    };

    // Test for lockValue function
    public func testLockValue(deployerPrincipal: Principal) : async () {
        let backend = await getBackendCanister();

        Debug.print("Testing value lock with deployer principal: " # Principal.toText(deployerPrincipal));

        // Lock a value
        let lockRequest : Types.ValueLockRequest = {
            uuid = "uuid-1";
            key = "key1";
            lock = true;
        };

        let lockResult = await backend.lockValue(lockRequest);
        switch (lockResult) {
            case (#ok(msg)) {
                assert msg == "Value locked successfully.";
                Debug.print("Value locked successfully");
            };
            case (#err(e)) {
                Debug.print("testLockValue: Failed - " # e);
                assert false;
            };
        };

        Debug.print("testLockValue: Passed");
    };

    // Test for getAllUUIDs function
    public func testGetAllUUIDs(deployerPrincipal: Principal) : async () {
        let backend = await getBackendCanister();

        Debug.print("Testing getAllUUIDs with deployer principal: " # Principal.toText(deployerPrincipal));

        let uuid1 = "uuid-1";
        let uuid2 = "uuid-2";
        let uuid3 = "uuid-3";

        let _ = await backend.insertUUIDStructure(uuid1, "schema-1");
        let _ = await backend.insertUUIDStructure(uuid2, "schema-2");
        let _ = await backend.insertUUIDStructure(uuid3, "schema-3");

        // Chiama getAllUUIDs
        let result = await backend.getAllUUIDs();
        switch (result) {
            case (#ok(uuids)) {
                assert uuids.size() == 3;
                assert Array.find(uuids, func (u: Text) : Bool { u == uuid1 }) != null;
                assert Array.find(uuids, func (u: Text) : Bool { u == uuid2 }) != null;
                assert Array.find(uuids, func (u: Text) : Bool { u == uuid3 }) != null;
                Debug.print("getAllUUIDs returned the correct UUIDs");
            };
            case (#err(e)) {
                Debug.print("testGetAllUUIDs: Failed - " # e);
                assert false;
            };
        };

        Debug.print("testGetAllUUIDs: Passed");
    };

    // Run all main tests
    public func runAllTests(deployerPrincipal: Principal) : async () {
        Debug.print("Running main tests with deployer principal: " # Principal.toText(deployerPrincipal));
        await testInsertUUIDStructure(deployerPrincipal);
        await testUploadFile(deployerPrincipal);
        await testUpdateValue(deployerPrincipal);
        await testLockValue(deployerPrincipal);
        await testGetAllUUIDs(deployerPrincipal);
        Debug.print("All main tests passed!");
    };
};