import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Types "./types";

module Storage {
   // =================================================================
    // UUIDs STORAGE MAPS
    // =================================================================

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

    // =================================================================
    // PROJECT & LINKEDIN STRUCTURE STORAGE MAPS
    // =================================================================

    // projectUuid -> ProjectCore
    public func newProjectMap() : TrieMap.TrieMap<Types.UUID, Types.ProjectCore> {
      TrieMap.TrieMap<Types.UUID, Types.ProjectCore>(Text.equal, Text.hash);
    };

    // projectUuid -> [fileId] (for top-level project documents)
    public func newProjectDocumentsMap() : TrieMap.TrieMap<Types.UUID, [Types.FileId]> {
      TrieMap.TrieMap<Types.UUID, [Types.FileId]>(Text.equal, Text.hash);
    };

    // projectUuid -> [placementUuid]
    public func newProjectPlacementsMap() : TrieMap.TrieMap<Types.UUID, [Types.UUID]> {
      TrieMap.TrieMap<Types.UUID, [Types.UUID]>(Text.equal, Text.hash);
    };

    // Composite key "projectUuid|placementUuid" -> [fileId]
    public func newPlacementDocumentsMap() : TrieMap.TrieMap<Text, [Types.FileId]> {
      TrieMap.TrieMap<Text, [Types.FileId]>(Text.equal, Text.hash);
    };

    // itemUuid -> projectUuid (Enforces 1-to-many relationship)
    public func newUuidToProjectMap() : TrieMap.TrieMap<Types.UUID, Types.UUID> {
      TrieMap.TrieMap<Types.UUID, Types.UUID>(Text.equal, Text.hash);
    };
    
    // projectUuid -> [itemUuid] (For efficient reverse lookup)
    public func newProjectToUuidsMap() : TrieMap.TrieMap<Types.UUID, [Types.UUID]> {
      TrieMap.TrieMap<Types.UUID, [Types.UUID]>(Text.equal, Text.hash);
    };

    // uuid -> [linked_uuid] (For many-to-many linking)
    public func newUuidLinksMap() : TrieMap.TrieMap<Types.UUID, [Types.UUID]> {
      TrieMap.TrieMap<Types.UUID, [Types.UUID]>(Text.equal, Text.hash);
    };
};
