import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import Auth "../src/timestorage_backend/auth";
import Iter "mo:base/Iter";

module {
    // Helper: crea una mappa degli admin con il deployer impostato come admin di default
    func createAdminMap(deployerPrincipal : Principal) : HashMap.HashMap<Principal, Bool> {
        let admins = Auth.newAdminMap();
        admins.put(deployerPrincipal, true);
        Debug.print("Admin map initialized with deployer as admin.");
        return admins;
    };

    // Test della funzione isAdmin
    public func testIsAdmin(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("Non-Admin Principal: " # Principal.toText(nonAdminPrincipal));

        // Il deployer (admin) deve risultare tale
        let isAdminResult = Auth.isAdmin(deployerPrincipal, admins);
        Debug.print("Is deployer an admin? " # debug_show (isAdminResult));
        assert isAdminResult == true;

        // Un principal non presente nella mappa non è admin
        let isNonAdminResult = Auth.isAdmin(nonAdminPrincipal, admins);
        Debug.print("Is non-admin an admin? " # debug_show (isNonAdminResult));
        assert isNonAdminResult == false;

        Debug.print("testIsAdmin: Passed");
    };

    // Test della funzione addAdmin
    public func testAddAdmin(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let newAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("New Admin Principal: " # Principal.toText(newAdminPrincipal));

        let addAdminResult = Auth.addAdmin(newAdminPrincipal, deployerPrincipal, admins);
        switch (addAdminResult) {
            case (#ok(())) {
                Debug.print("New admin added successfully.");
                let entriesAfter = Iter.toArray(admins.entries());
                Debug.print("Admin map after addition: " # debug_show (entriesAfter));
                assert Auth.isAdmin(newAdminPrincipal, admins) == true;
            };
            case (#err(e)) {
                Debug.print("testAddAdmin: Failed to add admin - " # e);
                assert false;
            };
        };

        // Verifica che un non-admin non possa aggiungere un admin
        let adminsForNonAdminTest = createAdminMap(deployerPrincipal);
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        let addAdminByNonAdminResult = Auth.addAdmin(newAdminPrincipal, nonAdminPrincipal, adminsForNonAdminTest);
        switch (addAdminByNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Only admins can add new admins.";
            };
            case (#ok(())) {
                Debug.print("testAddAdmin: Failed - Non-admin was able to add an admin");
                assert false;
            };
        };

        Debug.print("testAddAdmin: Passed");
    };

    // Test della funzione removeAdmin
    public func testRemoveAdmin(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let newAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        // Aggiungiamo un nuovo admin
        ignore Auth.addAdmin(newAdminPrincipal, deployerPrincipal, admins);

        // Rimuoviamo l'admin appena aggiunto
        let removeAdminResult = Auth.removeAdmin(newAdminPrincipal, deployerPrincipal, admins);
        switch (removeAdminResult) {
            case (#ok(())) {
                Debug.print("Admin removed successfully.");
                assert Auth.isAdmin(newAdminPrincipal, admins) == false;
            };
            case (#err(e)) {
                Debug.print("testRemoveAdmin: Failed - " # e);
                assert false;
            };
        };

        // Verifica che un non-admin non possa rimuovere un admin
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        let removeAdminByNonAdminResult = Auth.removeAdmin(deployerPrincipal, nonAdminPrincipal, admins);
        switch (removeAdminByNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Only admins can remove admins.";
            };
            case (#ok(())) {
                Debug.print("testRemoveAdmin: Failed - Non-admin was able to remove an admin");
                assert false;
            };
        };

        Debug.print("testRemoveAdmin: Passed");
    };

    // Test della funzione requireAdmin
    public func testRequireAdmin(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        let requireAdminResult = Auth.requireAdmin(deployerPrincipal, admins);
        switch (requireAdminResult) {
            case (#ok(())) {
                Debug.print("Admin role verified.");
            };
            case (#err(e)) {
                Debug.print("testRequireAdmin: Failed - " # e);
                assert false;
            };
        };

        let requireNonAdminResult = Auth.requireAdmin(nonAdminPrincipal, admins);
        switch (requireNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Admin role required.";
            };
            case (#ok(())) {
                Debug.print("testRequireAdmin: Failed - Non-admin authorized.");
                assert false;
            };
        };

        Debug.print("testRequireAdmin: Passed");
    };

    // ======================================
    // Test per le funzionalità relative all'editor
    // ======================================

    // Test della funzione isEditor
    public func testIsEditor(deployerPrincipal : Principal) {
        let editors = Auth.newEditorMap();
        let nonEditorPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("Non-Editor Principal: " # Principal.toText(nonEditorPrincipal));

        // All'inizio, nessun editor è presente
        let isEditorResult = Auth.isEditor(deployerPrincipal, editors);
        Debug.print("Is deployer an editor? " # debug_show (isEditorResult));
        assert isEditorResult == false;

        // Aggiungiamo il deployer manualmente per testare isEditor
        editors.put(deployerPrincipal, true);
        let isEditorAfterAdd = Auth.isEditor(deployerPrincipal, editors);
        Debug.print("After adding, is deployer an editor? " # debug_show (isEditorAfterAdd));
        assert isEditorAfterAdd == true;

        Debug.print("testIsEditor: Passed");
    };

    // Test della funzione addEditor
    public func testAddEditor(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let editors = Auth.newEditorMap();
        let newEditorPrincipal = Principal.fromText("xd7us-q23m2-djaxo-dv2g3-corol-jj5et-jhle6-kborp-xk7gl-x4vfi-pae");

        Debug.print("Deployer Principal (admin): " # Principal.toText(deployerPrincipal));
        Debug.print("New Editor Principal: " # Principal.toText(newEditorPrincipal));

        let addEditorResult = Auth.addEditor(newEditorPrincipal, deployerPrincipal, admins, editors);
        switch (addEditorResult) {
            case (#ok(())) {
                Debug.print("New editor added successfully.");
                let entriesAfter = Iter.toArray(editors.entries());
                Debug.print("Editor map after addition: " # debug_show (entriesAfter));
                assert Auth.isEditor(newEditorPrincipal, editors) == true;
            };
            case (#err(e)) {
                Debug.print("testAddEditor: Failed to add editor - " # e);
                assert false;
            };
        };

        // Verifica che un non-admin non possa aggiungere un editor
        let editorsForNonAdminTest = Auth.newEditorMap();
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        let addEditorByNonAdminResult = Auth.addEditor(newEditorPrincipal, nonAdminPrincipal, admins, editorsForNonAdminTest);
        switch (addEditorByNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Only admins can add new editors.";
            };
            case (#ok(())) {
                Debug.print("testAddEditor: Failed - Non-admin was able to add an editor");
                assert false;
            };
        };

        Debug.print("testAddEditor: Passed");
    };

    // Test della funzione removeEditor
    public func testRemoveEditor(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let editors = Auth.newEditorMap();
        let newEditorPrincipal = Principal.fromText("xd7us-q23m2-djaxo-dv2g3-corol-jj5et-jhle6-kborp-xk7gl-x4vfi-pae");

        // Aggiungiamo un nuovo editor
        ignore Auth.addEditor(newEditorPrincipal, deployerPrincipal, admins, editors);

        // Rimuoviamo l'editor appena aggiunto
        let removeEditorResult = Auth.removeEditor(newEditorPrincipal, deployerPrincipal, admins, editors);
        switch (removeEditorResult) {
            case (#ok(())) {
                Debug.print("Editor removed successfully.");
                assert Auth.isEditor(newEditorPrincipal, editors) == false;
            };
            case (#err(e)) {
                Debug.print("testRemoveEditor: Failed - " # e);
                assert false;
            };
        };

        // Verifica che un non-admin non possa rimuovere un editor
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        // Aggiungiamo nuovamente l'editor per testare la rimozione da parte di un non-admin
        ignore Auth.addEditor(newEditorPrincipal, deployerPrincipal, admins, editors);
        let removeEditorByNonAdminResult = Auth.removeEditor(newEditorPrincipal, nonAdminPrincipal, admins, editors);
        switch (removeEditorByNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Only admins can remove editors.";
            };
            case (#ok(())) {
                Debug.print("testRemoveEditor: Failed - Non-admin was able to remove an editor");
                assert false;
            };
        };

        Debug.print("testRemoveEditor: Passed");
    };

    // Test della funzione requireAdminOrEditor
    public func testRequireAdminOrEditor(deployerPrincipal : Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let editors = Auth.newEditorMap();
        let newEditorPrincipal = Principal.fromText("xd7us-q23m2-djaxo-dv2g3-corol-jj5et-jhle6-kborp-xk7gl-x4vfi-pae");
        // Aggiungiamo un editor usando i privilegi di admin
        ignore Auth.addEditor(newEditorPrincipal, deployerPrincipal, admins, editors);

        // Caller è admin
        let requireAdminOrEditorResultAdmin = Auth.requireAdminOrEditor(deployerPrincipal, admins, editors);
        switch (requireAdminOrEditorResultAdmin) {
            case (#ok(())) {
                Debug.print("Admin authorized for requireAdminOrEditor.");
            };
            case (#err(e)) {
                Debug.print("testRequireAdminOrEditor: Failed for admin - " # e);
                assert false;
            };
        };

        // Caller è editor
        let requireAdminOrEditorResultEditor = Auth.requireAdminOrEditor(newEditorPrincipal, admins, editors);
        switch (requireAdminOrEditorResultEditor) {
            case (#ok(())) {
                Debug.print("Editor authorized for requireAdminOrEditor.");
            };
            case (#err(e)) {
                Debug.print("testRequireAdminOrEditor: Failed for editor - " # e);
                assert false;
            };
        };

        // Caller non è né admin né editor
        let nonAuthorizedPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        let requireAdminOrEditorResultNonAuth = Auth.requireAdminOrEditor(nonAuthorizedPrincipal, admins, editors);
        switch (requireAdminOrEditorResultNonAuth) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Admin o Editor role required.";
            };
            case (#ok(())) {
                Debug.print("testRequireAdminOrEditor: Failed - Non-authorized user passed.");
                assert false;
            };
        };

        Debug.print("testRequireAdminOrEditor: Passed");
    };

    // Funzione per eseguire tutti i test di Auth (inclusi quelli per gli editor)
    public func runAllTests(deployerPrincipal : Principal) {
        testIsAdmin(deployerPrincipal);
        testAddAdmin(deployerPrincipal);
        testRemoveAdmin(deployerPrincipal);
        testRequireAdmin(deployerPrincipal);

        testIsEditor(deployerPrincipal);
        testAddEditor(deployerPrincipal);
        testRemoveEditor(deployerPrincipal);
        testRequireAdminOrEditor(deployerPrincipal);

        Debug.print("All auth tests passed!");
    };
};
