import Array "mo:base/Array";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Hash "mo:base/Hash";
import StorageTypes "./storage_types";

module {
    // Riutilizzo i tipi definiti in storage_types.mo
    public type Role = StorageTypes.Role;
    public type Category = StorageTypes.Category;
    public type Workspace = StorageTypes.Workspace;
    public type Company = StorageTypes.Company;
    public type QRInstallation = StorageTypes.QRInstallation;
    public type Review = StorageTypes.Review;
    public type InstallerData = StorageTypes.InstallerData;
    public type ProducerData = StorageTypes.ProducerData;
    public type User = StorageTypes.User;

    // Funzione di hash personalizzata per Nat
    public func natHash(n : Nat) : Hash.Hash {
        let text = Nat.toText(n);
        let hashValue = Text.hash(text);
        return hashValue;
    };

    // Definizione del tipo di stato che verrà gestito dall'actor
    public type StorageState = {
        var companies : TrieMap.TrieMap<Nat, Company>;
        var users : TrieMap.TrieMap<Nat, User>;
        var nextCompanyId : Nat;
        var nextUserId : Nat;
    };

    // Funzione per creare un nuovo stato con valori default
    public func createNewState() : StorageState {
        {
            var companies = TrieMap.TrieMap<Nat, Company>(Nat.equal, natHash);
            var users = TrieMap.TrieMap<Nat, User>(Nat.equal, natHash);
            var nextCompanyId = 1;
            var nextUserId = 1;
        };
    };

    // Funzione per ripristinare uno stato da dati stabili
    public func restoreState(
        companiesEntries : [(Nat, Company)],
        usersEntries : [(Nat, User)],
        nextCompanyId : Nat,
        nextUserId : Nat,
    ) : StorageState {
        {
            var companies = TrieMap.fromEntries<Nat, Company>(companiesEntries.vals(), Nat.equal, natHash);
            var users = TrieMap.fromEntries<Nat, User>(usersEntries.vals(), Nat.equal, natHash);
            var nextCompanyId = nextCompanyId;
            var nextUserId = nextUserId;
        };
    };

    // Funzioni di gestione delle aziende
    public func createCompany(
        state : StorageState,
        brand : Text,
        contacts : Text,
        bio : Text,
        typeValue : Nat,
        subtypeValue : Nat,
    ) : Nat {
        let id = state.nextCompanyId;
        state.nextCompanyId += 1;

        let newCompany : Company = {
            id = id;
            brand = brand;
            contacts = contacts;
            bio = bio;
            category = { categoryType = typeValue; subtype = subtypeValue };
            workspaces = [];
        };
        state.companies.put(id, newCompany);
        return id;
    };

    public func getCompany(state : StorageState, id : Nat) : ?Company {
        state.companies.get(id);
    };

    public func updateCompany(
        state : StorageState,
        id : Nat,
        brand : ?Text,
        contacts : ?Text,
        bio : ?Text,
        typeValue : ?Nat,
        subtypeValue : ?Nat,
    ) : Bool {
        switch (state.companies.get(id)) {
            case null { return false };
            case (?company) {
                let updatedCompany : Company = {
                    id = company.id;
                    brand = Option.get(brand, company.brand);
                    contacts = Option.get(contacts, company.contacts);
                    bio = Option.get(bio, company.bio);
                    category = {
                        categoryType = Option.get(typeValue, company.category.categoryType);
                        subtype = Option.get(subtypeValue, company.category.subtype);
                    };
                    workspaces = company.workspaces;
                };
                state.companies.put(id, updatedCompany);
                return true;
            };
        };
    };

    public func addWorkspaceToCompany(
        state : StorageState,
        companyId : Nat,
        title : Text,
        image : Text,
        qrCodes : [Text],
        models : [Text],
    ) : Bool {
        switch (state.companies.get(companyId)) {
            case null { return false };
            case (?company) {
                let newWorkspace : Workspace = {
                    title = title;
                    image = image;
                    qrCodes = qrCodes;
                    models = models;
                };
                let updatedWorkspaces = Array.append<Workspace>(company.workspaces, [newWorkspace]);
                let updatedCompany : Company = {
                    id = company.id;
                    brand = company.brand;
                    contacts = company.contacts;
                    bio = company.bio;
                    category = company.category;
                    workspaces = updatedWorkspaces;
                };
                state.companies.put(companyId, updatedCompany);
                return true;
            };
        };
    };

    // Funzioni di gestione degli utenti
    public func createUser(
        state : StorageState,
        email : Text,
        firstName : Text,
        lastName : Text,
        photo : Text,
        contacts : Text,
        bio : Text,
        typeValue : Nat,
        subtypeValue : Nat,
        roles : [Role],
        companyId : ?Nat,
    ) : Nat {
        let id = state.nextUserId;
        state.nextUserId += 1;

        let newUser : User = {
            id = id;
            email = email;
            firstName = firstName;
            lastName = lastName;
            photo = photo;
            contacts = contacts;
            bio = bio;
            category = { categoryType = typeValue; subtype = subtypeValue };
            roles = roles;
            companyId = companyId;
            installerData = null;
            producerData = null;
        };
        state.users.put(id, newUser);
        return id;
    };

    public func getUser(state : StorageState, id : Nat) : ?User {
        state.users.get(id);
    };

    public func updateUser(
        state : StorageState,
        id : Nat,
        email : ?Text,
        firstName : ?Text,
        lastName : ?Text,
        photo : ?Text,
        contacts : ?Text,
        bio : ?Text,
        typeValue : ?Nat,
        subtypeValue : ?Nat,
        companyId : ?Nat,
    ) : Bool {
        switch (state.users.get(id)) {
            case null { return false };
            case (?user) {
                let updatedUser : User = {
                    id = user.id;
                    email = Option.get(email, user.email);
                    firstName = Option.get(firstName, user.firstName);
                    lastName = Option.get(lastName, user.lastName);
                    photo = Option.get(photo, user.photo);
                    contacts = Option.get(contacts, user.contacts);
                    bio = Option.get(bio, user.bio);
                    category = {
                        categoryType = Option.get(typeValue, user.category.categoryType);
                        subtype = Option.get(subtypeValue, user.category.subtype);
                    };
                    // Gestiamo correttamente la situazione di opzione dentro opzione
                    companyId = switch (companyId) {
                        case null { user.companyId };
                        case (?id) { ?id };
                    };
                    roles = user.roles;
                    installerData = user.installerData;
                    producerData = user.producerData;
                };
                state.users.put(id, updatedUser);
                return true;
            };
        };
    };

    // Funzioni per i ruoli specifici
    private func hasRole(user : User, role : Role) : Bool {
        for (r in user.roles.vals()) {
            if (r == role) {
                return true;
            };
        };
        return false;
    };

    public func addQrInstalled(
        state : StorageState,
        userId : Nat,
        qrCode : Text,
        timestamp : Nat64,
    ) : Bool {
        switch (state.users.get(userId)) {
            case null { return false };
            case (?user) {
                if (not hasRole(user, #Installer)) {
                    return false;
                };

                let currentData = switch (user.installerData) {
                    case null { { qrInstalled = []; reviews = []; level = 0 } };
                    case (?data) { data };
                };

                let newQrInstallation : QRInstallation = {
                    qrCode = qrCode;
                    timestamp = timestamp;
                };

                let updatedQrInstalled = Array.append<QRInstallation>(currentData.qrInstalled, [newQrInstallation]);
                let updatedData : InstallerData = {
                    qrInstalled = updatedQrInstalled;
                    reviews = currentData.reviews;
                    level = currentData.level;
                };

                let updatedUser : User = {
                    id = user.id;
                    email = user.email;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    photo = user.photo;
                    contacts = user.contacts;
                    bio = user.bio;
                    category = user.category;
                    roles = user.roles;
                    companyId = user.companyId;
                    installerData = ?updatedData;
                    producerData = user.producerData;
                };
                state.users.put(userId, updatedUser);
                return true;
            };
        };
    };

    public func addQrCreated(
        state : StorageState,
        userId : Nat,
        qrCode : Text,
    ) : Bool {
        switch (state.users.get(userId)) {
            case null { return false };
            case (?user) {
                if (not hasRole(user, #Producer)) {
                    return false;
                };

                let currentData = switch (user.producerData) {
                    case null { { qrCreated = [] } };
                    case (?data) { data };
                };

                let updatedQrCreated = Array.append<Text>(currentData.qrCreated, [qrCode]);
                let updatedData : ProducerData = {
                    qrCreated = updatedQrCreated;
                };

                let updatedUser : User = {
                    id = user.id;
                    email = user.email;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    photo = user.photo;
                    contacts = user.contacts;
                    bio = user.bio;
                    category = user.category;
                    roles = user.roles;
                    companyId = user.companyId;
                    installerData = user.installerData;
                    producerData = ?updatedData;
                };
                state.users.put(userId, updatedUser);
                return true;
            };
        };
    };
};
