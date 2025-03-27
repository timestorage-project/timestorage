import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Bool "mo:base/Bool";
import StorageService "./storage_service";
import StorageTypes "./storage_types";

shared (msg) actor class CoreStorage() {
    // Stable state for authorization and storage
    stable var authorizedPrincipalsStable : [(Principal, Bool)] = [];
    stable var authorizedCanistersStable : [(Principal, Bool)] = [];

    var authorizedPrincipals = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);
    var authorizedCanisters = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);

    // Stable data for companies and users
    stable var companiesStable : [(Nat, StorageTypes.Company)] = [];
    stable var usersStable : [(Nat, StorageTypes.User)] = [];
    stable var nextCompanyId : Nat = 1;
    stable var nextUserId : Nat = 1;

    // Set initial caller as authorized
    let initialPrincipal = msg.caller;
    authorizedPrincipals.put(initialPrincipal, true);

    // Initialize storage state
    var storageState = StorageService.restoreState(
        companiesStable,
        usersStable,
        nextCompanyId,
        nextUserId,
    );

    // Upgrade hooks
    system func preupgrade() {
        authorizedPrincipalsStable := Iter.toArray(authorizedPrincipals.entries());
        authorizedCanistersStable := Iter.toArray(authorizedCanisters.entries());
        companiesStable := Iter.toArray(storageState.companies.entries());
        usersStable := Iter.toArray(storageState.users.entries());
        nextCompanyId := storageState.nextCompanyId;
        nextUserId := storageState.nextUserId;
    };

    system func postupgrade() {
        // Restore authorized principals and canisters
        authorizedPrincipals := TrieMap.fromEntries<Principal, Bool>(
            authorizedPrincipalsStable.vals(),
            Principal.equal,
            Principal.hash,
        );

        authorizedCanisters := TrieMap.fromEntries<Principal, Bool>(
            authorizedCanistersStable.vals(),
            Principal.equal,
            Principal.hash,
        );

        // Restore storage state
        storageState := StorageService.restoreState(
            companiesStable,
            usersStable,
            nextCompanyId,
            nextUserId,
        );
    };

    // Check if a principal is authorized
    private func checkAuthorization(caller : Principal) : Bool {
        // Initial admin is always authorized
        if (Principal.equal(caller, initialPrincipal)) {
            return true;
        };

        switch (authorizedPrincipals.get(caller)) {
            case (?true) { return true };
            case _ {
                // Check if it's an authorized canister
                switch (authorizedCanisters.get(caller)) {
                    case (?true) { return true };
                    case _ { return false };
                };
            };
        };
    };

    // Authorization check for all operations
    private func requireAuthorization(caller : Principal) : () {
        assert (checkAuthorization(caller));
    };

    // Public method to manage authorization (add or remove)
    public shared (msg) func manageAuthorization(principal : Principal, shouldAuthorize : Bool) : async Bool {
        // Only authorized principals can modify authorizations
        if (not checkAuthorization(msg.caller)) {
            return false;
        };

        if (shouldAuthorize) {
            // Add authorization
            authorizedPrincipals.put(principal, true);
            return true;
        } else {
            // Don't allow removal of initial admin
            if (Principal.equal(principal, initialPrincipal)) {
                return false;
            };

            // Prevent removal of the last principal authorized
            let currentAuthorized = Iter.toArray(authorizedPrincipals.keys());
            if (currentAuthorized.size() <= 1) {
                return false;
            };

            // Remove authorization
            authorizedPrincipals.delete(principal);
            return true;
        };
    };

    // Storage management functions
    public shared (msg) func createCompany(brand : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat) : async Nat {
        requireAuthorization(msg.caller);
        StorageService.createCompany(storageState, brand, contacts, bio, typeValue, subtypeValue);
    };

    public shared (msg) func getCompany(id : Nat) : async ?StorageTypes.Company {
        requireAuthorization(msg.caller);
        StorageService.getCompany(storageState, id);
    };

    public shared (msg) func updateCompany(id : Nat, brand : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat) : async Bool {
        requireAuthorization(msg.caller);
        StorageService.updateCompany(storageState, id, brand, contacts, bio, typeValue, subtypeValue);
    };

    public shared (msg) func addWorkspaceToCompany(companyId : Nat, title : Text, image : Text, qrCodes : [Text], models : [Text]) : async Bool {
        requireAuthorization(msg.caller);
        StorageService.addWorkspaceToCompany(storageState, companyId, title, image, qrCodes, models);
    };

    public shared (msg) func createUser(email : Text, firstName : Text, lastName : Text, photo : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat, roles : [StorageTypes.Role], companyId : ?Nat) : async Nat {
        requireAuthorization(msg.caller);
        StorageService.createUser(storageState, email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, roles, companyId);
    };

    public shared (msg) func getUser(id : Nat) : async ?StorageTypes.User {
        requireAuthorization(msg.caller);
        StorageService.getUser(storageState, id);
    };

    public shared (msg) func updateUser(id : Nat, email : ?Text, firstName : ?Text, lastName : ?Text, photo : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat, companyId : ?Nat) : async Bool {
        requireAuthorization(msg.caller);
        StorageService.updateUser(storageState, id, email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, companyId);
    };

    public shared (msg) func addQrInstalled(userId : Nat, qrCode : Text, timestamp : Nat64) : async Bool {
        requireAuthorization(msg.caller);
        StorageService.addQrInstalled(storageState, userId, qrCode, timestamp);
    };

    public shared (msg) func addQrCreated(userId : Nat, qrCode : Text) : async Bool {
        requireAuthorization(msg.caller);
        StorageService.addQrCreated(storageState, userId, qrCode);
    };
};
