import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Char "mo:base/Char";
import Buffer "mo:base/Buffer";
import Types "./types";

module Storage {
    public type FileRecord = Types.FileRecord;
    public type ValueLockStatus = Types.ValueLockStatus;

    // Map for storing UUID -> Structure
    public func newUUIDStructure() : TrieMap.TrieMap<Text, Text> {
        TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    };

    // Map for storing UUID -> Owner
    public func newUUIDOwnerMap() : TrieMap.TrieMap<Text, Principal> {
        TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
    };

    // Map for storing FileID -> FileRecord (for global files)
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

    // Generates the file association key
    public func makeFileAssociationKey(fileId : Text) : Text {
        return "__file__" # fileId;
    };

    public func extractFileIdFromKey(key : Text) : ?Text {
        if (Text.startsWith(key, #text "__file__")) {
            let prefixLength = Text.size("__file__");
            var idx = 0;
            let buffer = Buffer.Buffer<Char.Char>(Text.size(key)); // Buffer di caratteri

            for (c in Text.toIter(key)) {
                if (idx >= prefixLength) {
                    buffer.add(c);
                };
                idx += 1;
            };

            ?Text.fromIter(buffer.vals()); // corretto per Buffer<Char>
        } else {
            null;
        };
    };

    // Check if a key is a file association key
    public func isFileAssociationKey(key : Text) : Bool {
        Text.startsWith(key, #text "__file__");
    };
};
