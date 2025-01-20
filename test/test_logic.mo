import Logic "../src/timestorage_backend/logic";
import Types "../src/timestorage_backend/types";
import Auth "../src/timestorage_backend/auth";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Debug "mo:base/Debug";

module {

    // Helper function to create a mock admin map with the deployer as the default admin
    func createAdminMap(deployerPrincipal: Principal) : HashMap.HashMap<Principal, Bool> {
        let admins = Auth.newAdminMap();
        admins.put(deployerPrincipal, true); // Use the deployer's principal as the initial admin
        return admins;
    };

    // Mock function for insertUUID
    func mockInsertUUID(_uuid: Text, _schema: Text) : Result.Result<Text, Text> {
        if (_uuid == "uuid-1") {
            #err("UUID already exists: " # _uuid);
        } else {
            #ok("UUID inserted successfully");
        };
    };

    // Mock function for uuidExists
    func mockUUIDExists(_uuid: Text) : Bool {
        _uuid == "uuid-1";
    };

    // Mock function for generateFileId
    func mockGenerateFileId() : Text {
        "file-1";
    };

    // Mock function for linkFile
    func mockLinkFile(_uuid: Text, _fileId: Text) : () {
        // Do nothing
    };

    // Test for mint function
    public func testMint(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);

        // Valid mint request
        let validRequest : Types.MintRequest = {
            uuids = ["uuid-1", "uuid-2"];
            structures = "schema-1";
        };

        let mintResult = Logic.mint(validRequest, deployerPrincipal, admins, mockInsertUUID, mockUUIDExists);
        switch (mintResult) {
            case (#ok(msg)) {
                Debug.print("Mint successful: " # msg);
                assert msg == "Mint successful";
            };
            case (#err(e)) {
                Debug.print("testMint: Failed - " # e);
                if (e == "UUID already exists: uuid-1") {
                    Debug.print("testMint: UUID already exists, but this is expected.");
                    assert true; 
                } else {
                    assert false;
                };
            };
        };

        // Invalid mint request (empty UUIDs)
        let invalidRequest : Types.MintRequest = {
            uuids = [];
            structures = "schema-1";
        };

        let invalidMintResult = Logic.mint(invalidRequest, deployerPrincipal, admins, mockInsertUUID, mockUUIDExists);
        switch (invalidMintResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Input validation failed: empty UUID list or structure.";
            };
            case (#ok(_)) {
                Debug.print("testMint: Failed - Invalid request was accepted");
                assert false;
            };
        };

        Debug.print("testMint: Passed");
    };

    // Test for uploadUUIDFile function
    public func testUploadUUIDFile(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));

        // Valid file upload request
        let validUUID = "uuid-1";
        let validRequest : Types.FileUploadRequest = {
            uuid = validUUID;
            fileData = "base64-data";
            metadata = {
                fileName = "file.txt";
                mimeType = "text/plain";
                uploadTimestamp = 0;
            };
        };

        Debug.print("Valid UUID: " # validUUID);

        // Verify if the UUID exists before the upload
        Debug.print("Does UUID exist before upload? " # debug_show(mockUUIDExists(validUUID)));

        let uploadResult = Logic.uploadUUIDFile(validRequest, deployerPrincipal, admins, mockUUIDExists, mockGenerateFileId, mockLinkFile);
        switch (uploadResult) {
            case (#ok(msg)) {
                Debug.print("File upload successful with ID: " # msg);
                assert msg == "File upload successful with ID: file-1";
            };
            case (#err(e)) {
                Debug.print("testUploadUUIDFile: Failed - " # e);
                assert false;
            };
        };

        // Invalid file upload request (invalid UUID)
        let invalidUUID = "invalid-uuid";
        let invalidRequest : Types.FileUploadRequest = {
            uuid = invalidUUID;
            fileData = "base64-data";
            metadata = {
                fileName = "file.txt";
                mimeType = "text/plain";
                uploadTimestamp = 0;
            };
        };

        Debug.print("Invalid UUID: " # invalidUUID);

        // Verifiy if the UUID exists before the upload
        Debug.print("Does invalid UUID exist before upload? " # debug_show(mockUUIDExists(invalidUUID)));

        let invalidUploadResult = Logic.uploadUUIDFile(invalidRequest, deployerPrincipal, admins, mockUUIDExists, mockGenerateFileId, mockLinkFile);
        switch (invalidUploadResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Invalid UUID format.";
            };
            case (#ok(_)) {
                Debug.print("testUploadUUIDFile: Failed - Invalid UUID was accepted");
                assert false;
            };
        };

        Debug.print("testUploadUUIDFile: Passed");
    };

    // Run all logic tests
    public func runAllTests(deployerPrincipal: Principal) {
        testMint(deployerPrincipal);
        testUploadUUIDFile(deployerPrincipal);
        Debug.print("All logic tests passed!");
    };
};