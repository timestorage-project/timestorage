import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import Auth "../src/timestorage_backend/auth";
import Iter "mo:base/Iter";

module {
    // Helper function to create a new admin map with the deployer as the default admin
    func createAdminMap(deployerPrincipal: Principal) : HashMap.HashMap<Principal, Bool> {
        let admins = Auth.newAdminMap();
        admins.put(deployerPrincipal, true);
        Debug.print("Admin map initialized with deployer as admin.");
        return admins;
    };

    // Test for isAdmin function
    public func testIsAdmin(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("Non-Admin Principal: " # Principal.toText(nonAdminPrincipal));

        // Test with admin principal (deployer)
        let isAdminResult = Auth.isAdmin(deployerPrincipal, admins);
        Debug.print("Is deployer an admin? " # debug_show(isAdminResult));
        assert isAdminResult == true;

        // Test with non-admin principal
        let isNonAdminResult = Auth.isAdmin(nonAdminPrincipal, admins);
        Debug.print("Is non-admin an admin? " # debug_show(isNonAdminResult));
        assert isNonAdminResult == false;

        Debug.print("testIsAdmin: Passed");
    };

    // Test for addAdmin function
    public func testAddAdmin(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let newAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("New Admin Principal: " # Principal.toText(newAdminPrincipal));

        Debug.print("Is deployer an admin? " # debug_show(Auth.isAdmin(deployerPrincipal, admins)));
        let entriesBeforeArray = Iter.toArray(admins.entries());
        Debug.print("Admin map before adding new admin: " # debug_show(entriesBeforeArray));

        // Test adding a new admin by an existing admin (deployer)
        let addAdminResult = Auth.addAdmin(newAdminPrincipal, deployerPrincipal, admins);
        switch (addAdminResult) {
            case (#ok(())) {
                Debug.print("New admin added successfully.");
                // Stampa lo stato della mappa degli admin dopo l'aggiunta del nuovo admin
                let entriesAfterArray = Iter.toArray(admins.entries());
                Debug.print("Admin map after adding new admin: " # debug_show(entriesAfterArray));
                Debug.print("Is new admin an admin? " # debug_show(Auth.isAdmin(newAdminPrincipal, admins)));
                assert Auth.isAdmin(newAdminPrincipal, admins) == true;
            };
            case (#err(e)) {
                Debug.print("testAddAdmin: Failed to add admin - " # e);
                assert false;
            };
        };

        // Reinitialize the admin map for the next test
        let adminsForNonAdminTest = createAdminMap(deployerPrincipal);

        // Test adding an admin by a non-admin
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        Debug.print("Non-Admin Principal: " # Principal.toText(nonAdminPrincipal));

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

    // Test for removeAdmin function
    public func testRemoveAdmin(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let newAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("New Admin Principal: " # Principal.toText(newAdminPrincipal));

        // Add a new admin first
        ignore Auth.addAdmin(newAdminPrincipal, deployerPrincipal, admins);

        // Test removing an admin by an existing admin (deployer)
        let removeAdminResult = Auth.removeAdmin(newAdminPrincipal, deployerPrincipal, admins);
        switch (removeAdminResult) {
            case (#ok(())) {
                Debug.print("Admin removed successfully.");
                Debug.print("Is new admin still an admin? " # debug_show(Auth.isAdmin(newAdminPrincipal, admins)));
                assert Auth.isAdmin(newAdminPrincipal, admins) == false;
            };
            case (#err(e)) {
                Debug.print("testRemoveAdmin: Failed - " # e);
                assert false;
            };
        };

        // Test removing an admin by a non-admin
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
        Debug.print("Non-Admin Principal: " # Principal.toText(nonAdminPrincipal));

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

    // Test for requireAdmin function
    public func testRequireAdmin(deployerPrincipal: Principal) {
        let admins = createAdminMap(deployerPrincipal);
        let nonAdminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

        Debug.print("Deployer Principal: " # Principal.toText(deployerPrincipal));
        Debug.print("Non-Admin Principal: " # Principal.toText(nonAdminPrincipal));

        // Test with admin principal (deployer)
        let requireAdminResult = Auth.requireAdmin(deployerPrincipal, admins);
        switch (requireAdminResult) {
            case (#ok(())) {
                Debug.print("Admin role verified successfully.");
                assert true;
            };
            case (#err(e)) {
                Debug.print("testRequireAdmin: Failed - " # e);
                assert false;
            };
        };

        // Test with non-admin principal
        let requireNonAdminResult = Auth.requireAdmin(nonAdminPrincipal, admins);
        switch (requireNonAdminResult) {
            case (#err(e)) {
                Debug.print("Expected error: " # e);
                assert e == "Unauthorized: Admin role required.";
            };
            case (#ok(())) {
                Debug.print("testRequireAdmin: Failed - Non-admin was authorized");
                assert false;
            };
        };

        Debug.print("testRequireAdmin: Passed");
    };

    // Run all tests
    public func runAllTests(deployerPrincipal: Principal) {
        testIsAdmin(deployerPrincipal);
        testAddAdmin(deployerPrincipal);
        testRemoveAdmin(deployerPrincipal);
        testRequireAdmin(deployerPrincipal);
        Debug.print("All auth tests passed!");
    };
};