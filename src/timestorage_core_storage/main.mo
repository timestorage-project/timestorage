import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import StorageService "./storage_service";
import StorageTypes "./storage_types";

shared (msg) actor class CoreStorage() {
    // Stato stabile per autorizzazione e storage
    stable var authorizedPrincipalsStable : [(Principal, Bool)] = [];
    var authorizedPrincipals = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);

    // Dati stabili per le aziende e gli utenti
    stable var companiesStable : [(Nat, StorageTypes.Company)] = [];
    stable var usersStable : [(Nat, StorageTypes.User)] = [];
    stable var nextCompanyId : Nat = 1;
    stable var nextUserId : Nat = 1;

    // Imposta il chiamante iniziale come autorizzato
    let initialPrincipal = msg.caller;
    authorizedPrincipals.put(initialPrincipal, true);

    // Inizializza lo stato dello storage
    var storageState = StorageService.restoreState(
        companiesStable,
        usersStable,
        nextCompanyId,
        nextUserId,
    );

    // Upgrade hooks
    system func preupgrade() {
        authorizedPrincipalsStable := Iter.toArray(authorizedPrincipals.entries());
        companiesStable := Iter.toArray(storageState.companies.entries());
        usersStable := Iter.toArray(storageState.users.entries());
        nextCompanyId := storageState.nextCompanyId;
        nextUserId := storageState.nextUserId;
    };

    system func postupgrade() {
        // Ripristina i principal autorizzati
        authorizedPrincipals := TrieMap.fromEntries<Principal, Bool>(
            authorizedPrincipalsStable.vals(),
            Principal.equal,
            Principal.hash,
        );

        // Ripristina lo stato dello storage
        storageState := StorageService.restoreState(
            companiesStable,
            usersStable,
            nextCompanyId,
            nextUserId,
        );
    };

    // Funzione per verificare se un principal è autorizzato
    private func isAuthorized(caller : Principal) : Bool {
        switch (authorizedPrincipals.get(caller)) {
            case (?true) { return true };
            case _ { return false };
        };
    };

    // Controllo di autorizzazione
    private func requireAuthorization(caller : Principal) : () {
        assert (isAuthorized(caller));
    };

    // Funzioni di gestione dello storage
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
