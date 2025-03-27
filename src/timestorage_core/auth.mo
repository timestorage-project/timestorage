import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Service "./service";
import Error "mo:base/Error";
import Iter "mo:base/Iter";

module {
    public type AuthStore = {
        var admins : TrieMap.TrieMap<Principal, Bool>;
    };

    // Function to initialize the auth store
    public func initAuthStore(initialAdmin : Principal) : AuthStore {
        let store = {
            var admins = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);
        };

        // Set initial caller as admin
        store.admins.put(initialAdmin, true);

        return store;
    };

    // Check if a principal is an admin
    public func isAdmin(store : AuthStore, caller : Principal) : Bool {
        switch (store.admins.get(caller)) {
            case (?true) { return true };
            case _ { return false };
        };
    };

    // Require admin privileges
    public func requireAdmin(store : AuthStore, caller : Principal) : Result.Result<(), Text> {
        if (not isAdmin(store, caller)) {
            return #err("Unauthorized: Admin role required");
        };
        return #ok(());
    };

    // Add a new admin with synchronization to storage canister
    public func addAdmin(store : AuthStore, caller : Principal, newAdmin : Principal) : async Result.Result<Text, Text> {
        if (isAdmin(store, caller)) {
            store.admins.put(newAdmin, true);

            // Sync with storage canister
            try {
                let syncResult = await Service.syncAdmin(newAdmin, true);
                switch (syncResult) {
                    case (#err(e)) {
                        // Rollback if synchronization fails
                        store.admins.delete(newAdmin);
                        return #err("Admin added locally but failed to sync with storage: " # e);
                    };
                    case (#ok(_)) {
                        return #ok("New admin added and synchronized successfully.");
                    };
                };
            } catch (e) {
                // Rollback if an error occurs
                store.admins.delete(newAdmin);
                return #err("Error syncing with storage: " # Error.message(e));
            };
        } else {
            return #err("Unauthorized: Only admins can add other admins");
        };
    };

    // Remove an admin with synchronization to storage canister
    public func removeAdmin(store : AuthStore, caller : Principal, admin : Principal) : async Result.Result<Text, Text> {
        if (isAdmin(store, caller) and not Principal.equal(admin, caller)) {
            store.admins.delete(admin);

            // Sync with storage canister
            try {
                let syncResult = await Service.syncAdmin(admin, false);
                switch (syncResult) {
                    case (#err(e)) {
                        // Rollback if synchronization fails
                        store.admins.put(admin, true);
                        return #err("Admin removed locally but failed to sync with storage: " # e);
                    };
                    case (#ok(_)) {
                        return #ok("Admin removed and synchronized successfully.");
                    };
                };
            } catch (e) {
                // Rollback if an error occurs
                store.admins.put(admin, true);
                return #err("Error syncing with storage: " # Error.message(e));
            };
        } else {
            if (Principal.equal(admin, caller)) {
                return #err("Cannot remove yourself as admin");
            };
            return #err("Unauthorized: Admin privileges required");
        };
    };

    // Get all admins for information purposes
    public func getAllAdmins(store : AuthStore) : [Principal] {
        let adminPrincipals = Iter.map(
            store.admins.entries(),
            func((p, _) : (Principal, Bool)) : Principal { p },
        );
        return Iter.toArray(adminPrincipals);
    };
};
