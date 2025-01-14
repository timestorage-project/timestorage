import Types "./types";
import Auth "./auth";
import Utils "./utils";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

module {
    public func mint(
        req: Types.MintRequest,
        caller: Principal,
        admins: HashMap.HashMap<Principal, Bool>,
        insertUUID: (Text, Text) -> Result.Result<Text, Text>,
        uuidExists: (Text) -> Bool
    ) : Result.Result<Text, Text> {
        // Admin check
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e); };
            case (#ok(())) {};
        };

        // Validation
        if (req.uuids.size() == 0 or Text.size(req.structures) == 0) {
            return #err("Input validation failed: empty UUID list or structure.");
        };

        // Check each UUID
        for (u in Iter.fromArray(req.uuids)) {
            if (not Utils.isValidUUID(u)) {
                return #err("Invalid UUID format: " # u);
            };
            if (uuidExists(u)) {
                return #err("UUID already exists: " # u);
            };
        };

        // Insert each UUID with the associated structure
        for (u in Iter.fromArray(req.uuids)) {
            let res = insertUUID(u, req.structures);
            switch (res) {
                case (#err(e)) { return #err(e); };
                case (#ok(_)) {};
            };
        };

        return #ok("Mint successful");
    };
}
