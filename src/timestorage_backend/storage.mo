import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Types "./types";

module Storage {
    public type FileRecord = Types.FileRecord;
    public type ValueLockStatus = Types.ValueLockStatus;

    // Map for storing UUID -> Structure
    public func newUUIDStructure() : TrieMap.TrieMap<Text, Text> {
        TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    };

    // Map for storing UUID -> FileRecord
    public func newFileMap() : TrieMap.TrieMap<Text, FileRecord> {
        TrieMap.TrieMap<Text, FileRecord>(Text.equal, Text.hash);
    };

    // Map for storing UUID -> KeyValueMap
    public func newUUIDKeyValueMap() : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>> {
        TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>(Text.equal, Text.hash);
    };

    // Map to memorize the lock status of a value (UUID -> Key -> ValueLockStatus)
    public func newValueLockMap() : TrieMap.TrieMap<Text, ValueLockStatus> {
        TrieMap.TrieMap<Text, ValueLockStatus>(Text.equal, Text.hash);
    };

    // Generates the key for the value lock map
    public func makeLockKey(uuid : Text, key : Text) : Text {
        return uuid # "|" # key;
    };
}