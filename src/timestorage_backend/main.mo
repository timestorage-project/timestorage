import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

shared (msg) actor class TimestorageBackend() {
    stable var uuidToStructureStable : [(Text, Text)] = [];
    stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var imageCounter : Nat = 0;

    var uuidToStructure = Storage.newUUIDStructure();
    var uuidToImages = Storage.newImageMap();
    var admins = Auth.newAdminMap();

    // Inizializza l'admin principale con il deployer dell'actor
    let initialAdmin = msg.caller;
    admins.put(initialAdmin, true);

    system func postupgrade() {
        for ((k, v) in uuidToStructureStable.vals()) { uuidToStructure.put(k, v); };
        for ((k, v) in uuidToImagesStable.vals()) { uuidToImages.put(k, v); };
        for ((k, v) in adminsStable.vals()) { admins.put(k, v); };
    };

    system func preupgrade() {
        uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
        uuidToImagesStable := Iter.toArray(uuidToImages.entries());
        adminsStable := Iter.toArray(admins.entries());
    };

    // Verifica se il chiamante è admin
    public shared query (msg) func isAdmin() : async Bool {
        return Auth.isAdmin(msg.caller, admins);
    };

    // Aggiunta di un nuovo admin
    public shared (msg) func addAdmin(newAdmin: Principal) : async Result.Result<Text, Text> {
        switch (Auth.addAdmin(newAdmin, msg.caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) { return #ok("New admin added successfully."); };
        };
    };

    // Inserimento di un UUID con struttura
    public shared (msg) func insertUUIDStructure(uuid: Text, structure: Text) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        if (not Utils.isValidUUID(uuid)) {
            return #err("Invalid UUID format.");
        };

        // Controllo se l'UUID esiste già
        if (uuidToStructure.get(uuid) != null) {
            return #err("UUID already exists.");
        };

        uuidToStructure.put(uuid, structure);
        return #ok("UUID inserted successfully.");
    };


    // Ottenere tutti gli UUID
    public shared query (msg) func getAllUUIDs() : async Result.Result<[Text], Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        return #ok(Iter.toArray(uuidToStructure.keys()));
    };

    // Caricare un'immagine associata a un UUID
    public shared (msg) func uploadImage(uuid: Text, imgData: Blob, metadata: Types.ImageMetadata) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(msg.caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        if (uuidToStructure.get(uuid) == null) {
            return #err("Error: UUID does not exist.");
        };

        if (metadata.fileName.size() == 0 or metadata.fileType.size() == 0) {
            return #err("Invalid metadata: File name and type cannot be empty.");
        };

        let imageId = generateUniqueImageId();
        uuidToImages.put(imageId, { uuid = uuid; imageData = imgData; metadata = metadata });
        return #ok("Image uploaded successfully with ID: " # imageId);
    };

    // Genera un ID univoco per le immagini
    func generateUniqueImageId() : Text {
        imageCounter += 1;
        return "img-" # Nat.toText(imageCounter);
    };

    // Restituisce la struttura e tutti gli imageId associati ad un dato UUID (no admin required)
    public shared query (msg) func getUUIDInfo(uuid: Text) : async Result.Result<(Text, [Text]), Text> {
        let s = uuidToStructure.get(uuid);
        if (s == null) {
            return #err("Error: UUID not found.");
        };

        let structureText = switch (s) {
            case (?val) val;
            case null "unreachable"; // non verrà mai eseguito
        };

        var imageIds : [Text] = [];
        for ((imgId, record) in uuidToImages.entries()) {
            if (record.uuid == uuid) {
                imageIds := Array.append(imageIds, [imgId]);
            };
        };

        return #ok((structureText, imageIds));
    };

    // Restituisce l'immagine dato un imageId (no admin required)
    public shared query (msg) func getImage(imageId: Text) : async Result.Result<Storage.ImageRecord, Text> {
        let imageRecord = uuidToImages.get(imageId);
        switch (imageRecord) {
            case null { return #err("Error: Image not found."); };
            case (?rec) { return #ok(rec); };
        };
    };
}