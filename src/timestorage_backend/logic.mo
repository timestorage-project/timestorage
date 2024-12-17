import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

module {
    // Funzione per il mint di nuovi UUID
    public func mint(
        req: Types.MintRequest,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>,
        insertUUID: (Text, Text) -> (),
        uuidExists: (Text) -> Bool
    ) : Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); }; // Non admin
            case (#ok(())) {};                 // Procede se admin
        };

        // Validazione input
        if (req.uuids.size() == 0 or req.structures.size() == 0) {
            return #err("Input validation failed: UUID list and structure cannot be empty.");
        };

        for (u in Iter.fromArray(req.uuids)) {
            if (not Utils.isValidUUID(u)) {
                return #err("Invalid UUID format: " # u);
            };
            if (uuidExists(u)) {
                return #err("UUID already exists: " # u);
            };
        };

        for (u in Iter.fromArray(req.uuids)) {
            insertUUID(u, req.structures);
        };

        return #ok("Mint successful");
    };

    // Funzione per caricare immagini associate a un UUID
    public func uploadUUIDImage(
        req: Types.ImageUploadRequest,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>,
        uuidExists: (Text) -> Bool,
        generateImageId: () -> Text,
        linkImage: (Text, Text) -> ()
    ) : Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); }; // Non admin
            case (#ok(())) {};                 // Procede se admin
        };

        if (not Utils.isValidUUID(req.uuid)) {
            return #err("Invalid UUID format.");
        };
        if (not uuidExists(req.uuid)) {
            return #err("Error: UUID not found.");
        };
        if (req.metadata.fileName.size() == 0 or req.metadata.fileType.size() == 0) {
            return #err("Invalid metadata: File name and type cannot be empty.");
        };

        let imageId = generateImageId();
        linkImage(req.uuid, imageId);

        return #ok("Image upload successful with ID: " # imageId);
    };
}