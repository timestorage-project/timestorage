import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";

module {
    // Creazione di una nuova mappa degli admin
    public func newAdminMap() : HashMap.HashMap<Principal, Bool> {
        HashMap.HashMap<Principal, Bool>(0, Principal.equal, Principal.hash);
    };

    // Controlla se un utente è admin
    public func isAdmin(caller: Principal, admins: HashMap.HashMap<Principal, Bool>) : Bool {
        switch (admins.get(caller)) {
            case (?_) { return true; };
            case null { return false; };
        };
    };

    // Aggiunge un nuovo admin
    public func addAdmin(
        newAdmin: Principal,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>
    ) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can add new admins.");
        };
        if (isAdmin(newAdmin, admins)) {
            return #err("Admin already exists.");
        };
        admins.put(newAdmin, true);
        return #ok(());
    };

    // Verifica se un utente è admin, altrimenti ritorna errore
    public func requireAdmin(
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>
    ) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Admin role required.");
        };
        return #ok(());
    };
}


