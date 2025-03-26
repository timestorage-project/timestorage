import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

module {
    public type AuthStore = {
        var admins : TrieMap.TrieMap<Principal, Bool>;
    };

    // Funzione per inizializzare lo store di autenticazione
    public func initAuthStore(initialAdmin : Principal) : AuthStore {
        let store = {
            var admins = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);
        };

        // Imposta il chiamante iniziale come admin
        store.admins.put(initialAdmin, true);

        return store;
    };

    // Verifica se il chiamante è un admin
    public func isAdmin(store : AuthStore, caller : Principal) : Bool {
        switch (store.admins.get(caller)) {
            case (?true) { return true };
            case _ { return false };
        };
    };

    // Richiede che il chiamante sia un admin
    public func requireAdmin(store : AuthStore, caller : Principal) : Result.Result<(), Text> {
        if (not isAdmin(store, caller)) {
            return #err("Unauthorized: Admin role required");
        };
        return #ok(());
    };

    // Gestione admin
    public func addAdmin(store : AuthStore, caller : Principal, newAdmin : Principal) : Result.Result<Text, Text> {
        if (isAdmin(store, caller)) {
            store.admins.put(newAdmin, true);
            return #ok("New admin added successfully.");
        } else {
            return #err("Unauthorized: Only admins can add other admins");
        };
    };

    public func removeAdmin(store : AuthStore, caller : Principal, admin : Principal) : Result.Result<Text, Text> {
        if (isAdmin(store, caller) and not Principal.equal(admin, caller)) {
            store.admins.delete(admin);
            return #ok("Admin removed successfully.");
        } else {
            if (Principal.equal(admin, caller)) {
                return #err("Cannot remove yourself as admin");
            };
            return #err("Unauthorized: Admin privileges required");
        };
    };
};
