import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

actor TimestorageBackend {
    // STABLE DATA: array di coppie per persistenza
    stable var uuidToStructureStable : [(Text, Text)] = [];
    stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
    stable var adminsStable : [Principal] = [];
    stable var imageCounter : Nat = 0;

    // MAPPE DINAMICHE
    var uuidToStructure = Storage.newUUIDStructure();
    var uuidToImages = Storage.newImageMap();

    // Inizializza l'admin principale solo se la lista è vuota
    if (adminsStable.size() == 0) {
        let caller = Principal.fromActor(TimestorageBackend);
        adminsStable := [caller];
    };

    // Caricamento all'avvio
    system func postupgrade() {
        for ((k, v) in uuidToStructureStable.vals()) { uuidToStructure.put(k, v); };
        for ((k, v) in uuidToImagesStable.vals()) { uuidToImages.put(k, v); };
    };

    // Salvataggio prima dell'aggiornamento
    system func preupgrade() {
        uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
        uuidToImagesStable := Iter.toArray(uuidToImages.entries());
    };

    // Aggiungere un nuovo admin
    public func addAdmin(newAdmin: Principal, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.addAdmin(newAdmin, caller, adminsStable)) {
            case (#err(e)) { return #err(e); };           // Gestione errore
            case (#ok(updatedAdmins)) {                   // Aggiorna la lista di admin
                adminsStable := updatedAdmins;
                return #ok("New admin added successfully.");
            };
        };
    };

    // Verifica se l'utente corrente è admin
    public shared query func isAdmin(caller: Principal) : async Bool {
        return Auth.isAdmin(caller, adminsStable);
    };

    // Inserire un UUID con struttura (solo admin)
    public func insertUUIDStructure(uuid : Text, structure : Text, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, adminsStable)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        if (not Utils.startsWith(uuid, "uuid-")) {
            return #err("Invalid UUID format.");
        };

        uuidToStructure.put(uuid, structure);
        return #ok("UUID inserted successfully.");
    };

    // Ottenere tutti gli UUID (solo admin)
    public shared query func getAllUUIDs(caller: Principal) : async Result.Result<[Text], Text> {
        switch (Auth.requireAdmin(caller, adminsStable)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        return #ok(Iter.toArray(uuidToStructure.keys()));
    };

    // Caricare un'immagine (solo admin)
    public func uploadImage(uuid: Text, imgData: Blob, metadata: Types.ImageMetadata, caller: Principal) : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(caller, adminsStable)) {
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

    // Generare un ID immagine unico
    func generateUniqueImageId() : Text {
        imageCounter += 1;
        return "img-" # Nat.toText(imageCounter);
    };
}
