import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Auth "../src/timestorage_backend/auth";
import Logic "../src/timestorage_backend/logic";
import Storage "../src/timestorage_backend/storage";
import Utils "../src/timestorage_backend/utils";
import Types "../src/timestorage_backend/types";

actor class TestRunner() {

    // Test per Auth module
    public func testAuth() : async () {
        let admins = Auth.newAdminMap();
        
        // Ottieni il Principal di chi deploya il canister
        let deployer = Principal.fromText(""); // Sostituisci con il tuo Principal
        let randomAdmin = Principal.fromText(""); // Principal casuale valido

        // Verifica che il deployer non sia un admin inizialmente
        assert Auth.isAdmin(deployer, admins) == false;

        // Prova ad aggiungere il deployer come admin (dovrebbe fallire perché non è un admin)
        switch (Auth.addAdmin(deployer, deployer, admins)) {
            case (#err(e)) { Debug.print("Test 1 passed: " # e); };
            case (#ok(())) { Debug.print("Test 1 failed: deployer was able to add itself as admin."); };
        };

        // Prova ad aggiungere un admin casuale (dovrebbe fallire perché il deployer non è un admin)
        switch (Auth.addAdmin(randomAdmin, deployer, admins)) {
            case (#err(e)) { Debug.print("Test 2 passed: " # e); };
            case (#ok(())) { Debug.print("Test 2 failed: deployer was able to add a random admin."); };
        };

        // Aggiungi il deployer come admin (dovrebbe funzionare)
        switch (Auth.addAdmin(deployer, deployer, admins)) {
            case (#err(e)) { Debug.print("Test 3 failed: " # e); };
            case (#ok(())) { Debug.print("Test 3 passed: deployer was added as admin."); };
        };

        // Verifica che il deployer sia ora un admin
        assert Auth.isAdmin(deployer, admins) == true;

        Debug.print("Auth tests passed.");
    };

    // Test per Utils module
    public func testUtils() : async () {
        assert Utils.isValidUUID("uuid-1234") == true;
        assert Utils.isValidUUID("1234") == false;

        Debug.print("Utils tests passed.");
    };

    // Test per Logic module
    public func testLogic() : async () {
        let admins = Auth.newAdminMap();
        let deployer = Principal.fromText(""); // Sostituisci con il tuo Principal
        let uuidMap = Storage.newUUIDStructure();
        let imageMap = Storage.newImageMap();

        // Aggiungi il deployer alla mappa degli admin
        admins.put(deployer, true);

        // Test per la funzione mint
        let mintRequest : Types.MintRequest = {
            uuids = ["uuid-1234", "uuid-5678"];
            structures = "structure";
        };

        assert Logic.mint(mintRequest, deployer, admins, func(u, s) { uuidMap.put(u, s); }, func(u) { uuidMap.get(u) != null }) == #ok("Mint successful");
        assert Logic.mint(mintRequest, deployer, admins, func(u, s) { uuidMap.put(u, s); }, func(u) { uuidMap.get(u) != null }) == #err("UUID already exists: uuid-1234");

        // Test per la funzione uploadUUIDImage
        let imageUploadRequest : Types.ImageUploadRequest = {
            uuid = "uuid-1234";
            imageData = "base64ImageData";
            metadata = {
                fileName = "image.png";
                fileType = "png";
                uploadTimestamp = 0;
            };
        };

        assert Logic.uploadUUIDImage(imageUploadRequest, deployer, admins, func(u) { uuidMap.get(u) != null }, func() { "img-1" }, func(u, i) {
            // Creazione di un ImageRecord
            let imageRecord : Types.ImageRecord = {
                uuid = u;
                imageData = "base64ImageData";
                metadata = imageUploadRequest.metadata;
            };
            imageMap.put(i, imageRecord);
        }) == #ok("Image upload successful with ID: img-1");

        Debug.print("Logic tests passed.");
    };

    // Esegui tutti i test
    public func runAllTests() : async () {
        await testAuth();
        await testUtils();
        await testLogic();
    };
};