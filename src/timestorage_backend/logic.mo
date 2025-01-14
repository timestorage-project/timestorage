import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

module {
    //
    public func mint(
        req: Types.MintRequest,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>,
        insertUUID: (Text, Text) -> Result.Result<Text, Text>,
        uuidExists: (Text) -> Bool
    ) : Result.Result<Text, Text> {
        
        // Admin check
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) return #err(e);
            case (#ok(())) {};
        };

        // Input validation
        if (req.uuids.size() == 0 or Text.size(req.structures) == 0) {
            return #err("Input validation failed: empty UUID list or structure.");
        };

        // Validate UUIDs format and uniqueness
        for (uuid in Iter.fromArray(req.uuids)) {
            if (not Utils.isValidUUID(uuid)) {
                return #err("Invalid UUID format: " # uuid);
            };
            if (uuidExists(uuid)) {
                return #err("UUID already exists: " # uuid);
            };
        };

        // Insert UUIDs with associated structure
        for (uuid in Iter.fromArray(req.uuids)) {
            switch (insertUUID(uuid, req.structures)) {
                case (#err(e)) return #err(e);
                case (#ok(_)) {};
            };
        };

        #ok("Mint successful")
    };

    // Function to upload a file with a given UUID
    public func uploadUUIDFile(
        req: Types.FileUploadRequest,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>,
        uuidExists: (Text) -> Bool,
        generateFileId: () -> Text,
        linkFile: (Text, Text) -> ()
    ) : Result.Result<Text, Text> {

        // Admin check
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        if (not Utils.isValidUUID(req.uuid)) {
            return #err("Invalid UUID format.");
        };
        if (not uuidExists(req.uuid)) {
            return #err("Error: UUID not found.");
        };
        if (req.metadata.fileName.size() == 0 or req.metadata.mimeType.size() == 0) {
            return #err("Invalid metadata: File name and mimeType cannot be empty.");
        };

        let fileId = generateFileId();
        // ex linkImage(req.uuid, imageId)
        linkFile(req.uuid, fileId);

        return #ok("File upload successful with ID: " # fileId);
    };

}
