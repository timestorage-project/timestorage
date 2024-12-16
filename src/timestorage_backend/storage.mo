import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Types "./types";
import Principal "mo:base/Principal";

module Storage {
  public type UUID = Types.UUID;
  public type ImageRecord = {
    imageData : Blob;
    metadata : Types.ImageMetadata;
  };

  // Funzione per creare una nuova mappa di UUID -> Struttura
  public func newUUIDStructure() : TrieMap.TrieMap<Text, Text> {
    TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
  };

  // Funzione per creare una nuova mappa di immagini
  public func newImageMap() : TrieMap.TrieMap<Text, ImageRecord> {
    TrieMap.TrieMap<Text, ImageRecord>(Text.equal, Text.hash);
  };

  // Funzione per creare una nuova mappa dei ruoli principali
  public func newPrincipalRoles() : TrieMap.TrieMap<Principal, Types.AuthorizationRole> {
    TrieMap.TrieMap<Principal, Types.AuthorizationRole>(Principal.equal, Principal.hash);
  };

  // Funzione per controllare se un UUID esiste nella mappa
  public func uuidExists(map : TrieMap.TrieMap<Text, Text>, uuid : Text) : Bool {
    return map.get(uuid) != null;
  };
}
