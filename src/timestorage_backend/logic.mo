import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

module {
    // Funzione per il mint di nuovi UUID
    public func mint(
        req: Types.MintRequest,
        caller: Principal,
        admins: [Principal],
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

        for (u in req.uuids.vals()) {
            if (u.size() < 5 or not Utils.startsWith(u, "uuid-")) {
                return #err("Invalid UUID format: " # u);
            };
            if (uuidExists(u)) {
                return #err("UUID already exists: " # u);
            };
        };

        for (u in req.uuids.vals()) {
            insertUUID(u, req.structures);
        };

        return #ok("Mint successful");
    };

    // Funzione per caricare immagini associate a un UUID
    public func uploadUUIDImage(
        req: Types.ImageUploadRequest,
        caller: Principal,
        admins: [Principal],
        uuidExists: (Text) -> Bool,
        generateImageId: () -> Text,
        linkImage: (Text, Text) -> ()
    ) : Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); }; // Non admin
            case (#ok(())) {};                 // Procede se admin
        };

        if (not Utils.startsWith(req.uuid, "uuid-")) {
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

