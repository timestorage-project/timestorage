import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";

module Auth {
    public func newAdminMap() : HashMap.HashMap<Principal, Bool> {
        HashMap.HashMap<Principal, Bool>(0, Principal.equal, Principal.hash);
    };

    public func newEditorMap() : HashMap.HashMap<Principal, Bool> {
        HashMap.HashMap<Principal, Bool>(0, Principal.equal, Principal.hash);
    };

    // Function to check if the caller is an admin
    public func isAdmin(caller : Principal, admins : HashMap.HashMap<Principal, Bool>) : Bool {
        switch (admins.get(caller)) {
            case (?_) { return true };
            case null { return false };
        };
    };

    // Function to check if the caller is an editor
    public func isEditor(caller : Principal, editors : HashMap.HashMap<Principal, Bool>) : Bool {
        switch (editors.get(caller)) {
            case (?_) { return true };
            case null { return false };
        };
    };

    // Function for adding an admin
    public func addAdmin(newAdmin : Principal, caller : Principal, admins : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can add new admins.");
        };
        if (isAdmin(newAdmin, admins)) {
            return #err("Admin already exists.");
        };
        admins.put(newAdmin, true);
        return #ok(());
    };

    // Function for adding an editor
    public func addEditor(newEditor : Principal, caller : Principal, admins : HashMap.HashMap<Principal, Bool>, editors : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can add new editors.");
        };
        if (isEditor(newEditor, editors)) {
            return #err("Editor already exists.");
        };
        editors.put(newEditor, true);
        #ok(());
    };

    // Function to remove an admin
    public func removeAdmin(adminToRemove : Principal, caller : Principal, admins : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can remove admins.");
        };
        if (not isAdmin(adminToRemove, admins)) {
            return #err("Admin does not exist.");
        };
        admins.delete(adminToRemove);
        return #ok(());
    };

    // Function to remove an editor
    public func removeEditor(editorToRemove : Principal, caller : Principal, admins : HashMap.HashMap<Principal, Bool>, editors : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Only admins can remove editors.");
        };
        if (not isEditor(editorToRemove, editors)) {
            return #err("Editor does not exist.");
        };
        editors.delete(editorToRemove);
        #ok(());
    };

    // Function for requiring admin role
    public func requireAdmin(caller : Principal, admins : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (not isAdmin(caller, admins)) {
            return #err("Unauthorized: Admin role required.");
        };
        return #ok(());
    };

    // Function for requiring admin role
    public func requireAdminOrEditor(caller : Principal, admins : HashMap.HashMap<Principal, Bool>, editors : HashMap.HashMap<Principal, Bool>) : Result.Result<(), Text> {
        if (isAdmin(caller, admins) or isEditor(caller, editors)) {
            #ok(());
        } else {
            #err("Unauthorized: Admin o Editor role required.");
        };
    };
};
