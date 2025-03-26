import Types "./types";
import StorageCanister "canister:timestorage_core_storage";

module {
    public func createCompany(brand : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat) : async Nat {
        await StorageCanister.createCompany(brand, contacts, bio, typeValue, subtypeValue);
    };

    public func getCompany(id : Nat) : async ?Types.Company {
        await StorageCanister.getCompany(id);
    };

    public func updateCompany(id : Nat, brand : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat) : async Bool {
        await StorageCanister.updateCompany(id, brand, contacts, bio, typeValue, subtypeValue);
    };

    public func addWorkspaceToCompany(companyId : Nat, title : Text, image : Text, qrCodes : [Text], models : [Text]) : async Bool {
        await StorageCanister.addWorkspaceToCompany(companyId, title, image, qrCodes, models);
    };

    public func createUser(email : Text, firstName : Text, lastName : Text, photo : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat, roles : [Types.Role], companyId : ?Nat) : async Nat {
        await StorageCanister.createUser(email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, roles, companyId);
    };

    public func getUser(id : Nat) : async ?Types.User {
        await StorageCanister.getUser(id);
    };

    public func updateUser(id : Nat, email : ?Text, firstName : ?Text, lastName : ?Text, photo : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat, companyId : ?Nat) : async Bool {
        await StorageCanister.updateUser(id, email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, companyId);
    };

    public func addQrInstalled(userId : Nat, qrCode : Text, timestamp : Nat64) : async Bool {
        await StorageCanister.addQrInstalled(userId, qrCode, timestamp);
    };

    public func addQrCreated(userId : Nat, qrCode : Text) : async Bool {
        await StorageCanister.addQrCreated(userId, qrCode);
    };
};
