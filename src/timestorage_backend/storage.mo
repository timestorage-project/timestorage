import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Types "./types";

module Storage {
    public type UUID = Types.UUID;
    public type ImageRecord = Types.ImageRecord;
    public type ParamLockStatus = Types.ParamLockStatus;
    public type SchemaLockStatus = Types.SchemaLockStatus;

    // Mappa per memorizzare UUID -> Struttura JSON
    public func newUUIDStructure() : TrieMap.TrieMap<Text, Text> {
        TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    };

    // Mappa per memorizzare UUID -> Immagini
    public func newImageMap() : TrieMap.TrieMap<Text, ImageRecord> {
        TrieMap.TrieMap<Text, ImageRecord>(Text.equal, Text.hash);
    };

    // Mappa per memorizzare lo stato di blocco dei parametri
    public func newParamLockMap() : TrieMap.TrieMap<Text, ParamLockStatus> {
        TrieMap.TrieMap<Text, ParamLockStatus>(Text.equal, Text.hash);
    };

    // Mappa per memorizzare lo stato di blocco dell'intero schema
    public func newSchemaLockMap() : TrieMap.TrieMap<Text, SchemaLockStatus> {
        TrieMap.TrieMap<Text, SchemaLockStatus>(Text.equal, Text.hash);
    };

    // Funzione per verificare se un UUID esiste
    public func uuidExists(map : TrieMap.TrieMap<Text, Text>, uuid : Text) : Bool {
        return map.get(uuid) != null;
    };
}
