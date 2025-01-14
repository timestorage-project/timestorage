import Result "mo:base/Result";
import Principal "mo:base/Principal";

module Types {
    public type UUID = Text;
    public type MintRequest = {
        uuids: [Text];
        structures: Text;
    };
    public type ValueUpdateRequest = {
        uuid: Text;
        key: Text;
        newValue: Text;
    };
    public type ValueLockRequest = {
        uuid: Text;
        key: Text;
        lock: Bool;
    };
    public type ValueLockStatusRequest = {
        uuid: Text;
        key: Text;
    };
    public type ValueLockStatus = {
        locked: Bool;
        lockedBy: ?Principal;
    };
    public type ValueLockAllRequest = {
        uuid: Text;
        lock: Bool;
    };
    public type ValueRequest = {
        uuid: Text;
        key: Text;
    };
    public type ErrorCode = {
        #InvalidUUID;
        #SchemaLocked;
        #ValueLocked;
        #KeyNotFound;
        #Unauthorized;
    };
    public type Result<T, E> = Result.Result<T, E>;
}