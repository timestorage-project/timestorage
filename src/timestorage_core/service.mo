import Types "./types";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import StorageCanister "canister:timestorage_core_storage";
import Result "mo:base/Result";
import Text "mo:base/Text";

module Service {
    // Function to ensure authorization sync between canisters
    public func ensureAuthorization(selfId : Principal) : async Bool {
        try {
            // Use the manageAuthorization method to authorize the canister
            let result = await StorageCanister.manageAuthorization(selfId, true);
            return result;
        } catch (_) {
            return false;
        };
    };

    // Function to sync admin privileges with storage canister
    public func syncAdmin(admin : Principal, isAdd : Bool) : async Result.Result<Text, Text> {
        try {
            // Use the manageAuthorization method for both adding and removing admins
            let result = await StorageCanister.manageAuthorization(admin, isAdd);
            if (result) {
                if (isAdd) {
                    return #ok("Admin synchronized with storage canister");
                } else {
                    return #ok("Admin removed from storage canister");
                };
            } else {
                if (isAdd) {
                    return #err("Failed to synchronize admin with storage canister");
                } else {
                    return #err("Failed to remove admin from storage canister");
                };
            };
        } catch (e) {
            return #err("Error syncing admin with storage: " # Error.message(e));
        };
    };

    // Company management functions
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

    // User management functions
    public func createUser(email : Text, firstName : Text, lastName : Text, photo : Text, contacts : Text, bio : Text, typeValue : Nat, subtypeValue : Nat, roles : [Types.Role], companyId : ?Nat) : async Nat {
        await StorageCanister.createUser(email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, roles, companyId);
    };

    public func getUser(id : Nat) : async ?Types.User {
        await StorageCanister.getUser(id);
    };

    public func updateUser(id : Nat, email : ?Text, firstName : ?Text, lastName : ?Text, photo : ?Text, contacts : ?Text, bio : ?Text, typeValue : ?Nat, subtypeValue : ?Nat, companyId : ?Nat) : async Bool {
        await StorageCanister.updateUser(id, email, firstName, lastName, photo, contacts, bio, typeValue, subtypeValue, companyId);
    };

    // QR code management functions
    public func addQrInstalled(userId : Nat, qrCode : Text, timestamp : Nat64) : async Bool {
        await StorageCanister.addQrInstalled(userId, qrCode, timestamp);
    };

    public func addQrCreated(userId : Nat, qrCode : Text) : async Bool {
        await StorageCanister.addQrCreated(userId, qrCode);
    };
};
