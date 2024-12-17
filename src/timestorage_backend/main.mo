import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

actor TimestorageBackend {
    stable var uuidToStructureStable : [(Text, Text)] = [];
    stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
    stable var adminsStable : [(Principal, Bool)] = [];
    stable var imageCounter : Nat = 0;

    var uuidToStructure = Storage.newUUIDStructure();
    var uuidToImages = Storage.newImageMap();
    var admins = Auth.newAdminMap();

    // Inizializzazione degli admin
    if (adminsStable.size() == 0) {
        let initialAdmin = Principal.fromActor(TimestorageBackend);
        admins.put(initialAdmin, true);
    } else {
        for ((k, v) in adminsStable.vals()) {
            admins.put(k, v);
        };
    };

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

    public shared func addAdmin(newAdmin: Principal, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.addAdmin(newAdmin, caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {
                return #ok("New admin added successfully.");
            };
        };
    };

    public shared query func isAdmin(caller: Principal) : async Bool {
        return Auth.isAdmin(caller, admins);
    };

    public shared func insertUUIDStructure(uuid: Text, structure: Text, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        if (not Utils.isValidUUID(uuid)) {
            return #err("Invalid UUID format.");
        };

        uuidToStructure.put(uuid, structure);
        return #ok("UUID inserted successfully.");
    };

    public shared query func getAllUUIDs(caller: Principal) : async Result.Result<[Text], Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        return #ok(Iter.toArray(uuidToStructure.keys()));
    };

    public shared func uploadImage(uuid: Text, imgData: Blob, metadata: Types.ImageMetadata, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
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
        uuidToImages.put(imageId, { imageData = imgData; metadata = metadata });
        return #ok("Image uploaded successfully with ID: " # imageId);
    };

    func generateUniqueImageId() : Text {
        imageCounter += 1;
        return "img-" # Nat.toText(imageCounter);
    };
}
