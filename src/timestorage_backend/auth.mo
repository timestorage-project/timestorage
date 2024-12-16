import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Result "mo:base/Result";

module {
    public func isAdmin(caller: Principal, admins: [Principal]) : Bool {
        for (admin in admins.vals()) {
            if (admin == caller) {
                return true;
            };
        };
        return false;
    };

    public func addAdmin(newAdmin: Principal, caller: Principal, admins: [Principal]) : Result.Result<[Principal], Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can add new admins.");
        };
        if (isAdmin(newAdmin, admins)) {
            return #err("Admin already exists.");
        };
        let updatedAdmins = Array.append<Principal>(admins, [newAdmin]);
        return #ok(updatedAdmins);
    };

    public func requireAdmin(caller: Principal, admins: [Principal]) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Admin role required.");
        };
        return #ok(());
    };
}



