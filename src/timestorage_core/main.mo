import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Bool "mo:base/Bool";
import Types "./types";
import Service "./service";
import Auth "./auth";

shared (msg) actor class Core() {
    // Initialize auth store with the initial caller as admin
    let initialAdmin = msg.caller;
    let authStore = Auth.initAuthStore(initialAdmin);

    // Stable state for admin storage
    stable var adminsStable : [(Principal, Bool)] = [];

    // Counter for metrics and debugging
    stable var operationCounter : Nat = 0;
    stable var isStorageInitialized : Bool = false;

    // Upgrade hooks
    system func preupgrade() {
        adminsStable := Iter.toArray(authStore.admins.entries());
    };

    system func postupgrade() {
        // Restore admins
        for ((p, isA) in adminsStable.vals()) {
            authStore.admins.put(p, isA);
        };
    };

    // Private function to initialize storage access
    private func initializeStorageAccess() : async Bool {
        if (isStorageInitialized) {
            return true;
        };

        try {
            // Sync the initial admin with storage canister
            let syncResult = await Service.syncAdmin(initialAdmin, true);
            switch (syncResult) {
                case (#err(_)) {
                    return false;
                };
                case (#ok(_)) {
                    isStorageInitialized := true;
                    return true;
                };
            };
        } catch (_) {
            return false;
        };
    };

    // Admin management functions
    public shared (msg) func addAdmin(newAdmin : Principal) : async Result.Result<Text, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        return await Auth.addAdmin(authStore, msg.caller, newAdmin);
    };

    public shared (msg) func removeAdmin(admin : Principal) : async Result.Result<Text, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        return await Auth.removeAdmin(authStore, msg.caller, admin);
    };

    public shared query (msg) func isAdmin() : async Bool {
        return Auth.isAdmin(authStore, msg.caller);
    };

    // Helper function to convert Error to Text
    private func errorToText(e : Error.Error) : Text {
        return Error.message(e);
    };

    // Company management functions
    public shared (msg) func createCompany(brand : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat) : async Result.Result<Nat, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let id = await Service.createCompany(brand, contacts, bio, typeValue, subtypeValue);
                    return #ok(id);
                } catch (e) {
                    return #err("Error creating company: " # errorToText(e));
                };
            };
        };
    };

    public shared (msg) func getCompany(id : Nat) : async Result.Result<?Types.Company, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        try {
            operationCounter += 1;
            let company = await Service.getCompany(id);
            return #ok(company);
        } catch (e) {
            return #err("Error retrieving company: " # errorToText(e));
        };
    };

    public shared (msg) func updateCompany(id : Nat, brand : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat) : async Result.Result<Bool, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let result = await Service.updateCompany(id, brand, contacts, bio, typeValue, subtypeValue);
                    return #ok(result);
                } catch (e) {
                    return #err("Error updating company: " # errorToText(e));
                };
            };
        };
    };

    public shared (msg) func addWorkspaceToCompany(companyId : Nat, title : Text, image : Text, qrCodes : [Text], models : [Text]) : async Result.Result<Bool, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let result = await Service.addWorkspaceToCompany(companyId, title, image, qrCodes, models);
                    return #ok(result);
                } catch (e) {
                    return #err("Error adding workspace: " # errorToText(e));
                };
            };
        };
    };

    // User management functions
    public shared (msg) func createUser(email : Text, firstName : Text, lastName : Text, photo : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat, roles : [Types.Role], companyId : ?Nat) : async Result.Result<Nat, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let id = await Service.createUser(email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, roles, companyId);
                    return #ok(id);
                } catch (e) {
                    return #err("Error creating user: " # errorToText(e));
                };
            };
        };
    };

    public shared (msg) func getUser(id : Nat) : async Result.Result<?Types.User, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        try {
            operationCounter += 1;
            let user = await Service.getUser(id);
            return #ok(user);
        } catch (e) {
            return #err("Error retrieving user: " # errorToText(e));
        };
    };

    public shared (msg) func updateUser(id : Nat, email : ?Text, firstName : ?Text, lastName : ?Text, photo : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat, companyId : ?Nat) : async Result.Result<Bool, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let result = await Service.updateUser(id, email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, companyId);
                    return #ok(result);
                } catch (e) {
                    return #err("Error updating user: " # errorToText(e));
                };
            };
        };
    };

    // QR code management functions
    public shared (msg) func addQrInstalled(userId : Nat, qrCode : Text, timestamp : Nat64) : async Result.Result<Bool, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let result = await Service.addQrInstalled(userId, qrCode, timestamp);
                    return #ok(result);
                } catch (e) {
                    return #err("Error adding installed QR: " # errorToText(e));
                };
            };
        };
    };

    public shared (msg) func addQrCreated(userId : Nat, qrCode : Text) : async Result.Result<Bool, Text> {
        // Ensure storage is initialized
        if (not isStorageInitialized) {
            let initialized = await initializeStorageAccess();
            if (not initialized) {
                return #err("Failed to initialize storage access");
            };
        };

        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                try {
                    operationCounter += 1;
                    let result = await Service.addQrCreated(userId, qrCode);
                    return #ok(result);
                } catch (e) {
                    return #err("Error adding created QR: " # errorToText(e));
                };
            };
        };
    };

    // Helper method to get metrics
    public shared query (msg) func getMetrics() : async Result.Result<Text, Text> {
        switch (Auth.requireAdmin(authStore, msg.caller)) {
            case (#err(e)) { return #err(e) };
            case (#ok(_)) {
                return #ok("Total operations processed: " # Nat.toText(operationCounter) # ", Storage initialized: " # Bool.toText(isStorageInitialized));
            };
        };
    };
};
