import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Types "./types";

module Storage {
    public type UUID = Types.UUID;
    public type ValueLockStatus = Types.ValueLockStatus;

    // Mappa per memorizzare UUID -> schema
    public func newUUIDStructure() : TrieMap.TrieMap<Text, Text> {
        TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    };

    // Mappa per memorizzare: UUID -> (key -> value)
    public func newUUIDKeyValueMap() : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>> {
        TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>(Text.equal, Text.hash);
    };

    // Mappa per memorizzare lo stato di blocco dei valori (UUID|key -> ValueLockStatus)
    public func newValueLockMap() : TrieMap.TrieMap<Text, ValueLockStatus> {
        TrieMap.TrieMap<Text, ValueLockStatus>(Text.equal, Text.hash);
    };

    // Helper: genera la chiave per la mappa di lock dei valori
    public func makeLockKey(uuid : Text, key : Text) : Text {
        return uuid # "|" # key;
    };
}