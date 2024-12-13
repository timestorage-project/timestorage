import Trie "mo:base/TrieMap";
import Types "./types";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";

module {
  type UUID = Types.UUID;
  type CoreData = Types.CoreData;
  type ImageMetadata = Types.ImageMetadata;
  type AuthorizationRole = Types.AuthorizationRole;

  type ImageRecord = {
    imageData : Blob;
    metadata : ImageMetadata;
  };

  // STABLE VARIABLES
  stable var uuidToStructure : Trie.Map<Text, Text> = Trie.empty();
  stable var uuidToCoreData : Trie.Map<Text, Text> = Trie.empty();
  stable var uuidToImages : Trie.Map<Text, ImageRecord> = Trie.empty();
  stable var principalRoles : Trie.Map<Principal, AuthorizationRole> = Trie.empty();
  stable var imageCounter : Nat = 0n;

  func getAllUUIDs() : [Text] {
    Trie.keys(uuidToStructure)
  };

  func getAllUUIDStructures() : [(Text, Text)] {
    Trie.entries(uuidToStructure)
  };

  func getAllUUIDContainers() : [(Text, Text)] {
    Trie.entries(uuidToCoreData)
  };

  func getCoreData(key : Text) : ?CoreData {
    switch (Trie.get(uuidToCoreData, key)) {
      case (null) { null };
      case (?v) { ?{ key = key; value = v } };
    }
  };

  func getDataValue(key : Text) : ?Text {
    Trie.get(uuidToCoreData, key)
  };

  func uuidExists(uuid : Text) : Bool {
    Trie.containsKey(uuidToStructure, uuid)
  };

  func insertUUIDStructure(uuid : Text, structure : Text) {
    uuidToStructure := Trie.put(uuidToStructure, uuid, structure)
  };

  func insertCoreData(key : Text, value : Text) {
    uuidToCoreData := Trie.put(uuidToCoreData, key, value)
  };

  func insertImage(imageId : Text, imgData : Blob, meta : ImageMetadata) {
    uuidToImages := Trie.put(uuidToImages, imageId, { imageData = imgData; metadata = meta })
  };

  func linkImageToUUID(uuid : Text, imageId : Text) {
    switch (Trie.get(uuidToStructure, uuid)) {
      case (null) { /* do nothing, uuid not found */ };
      case (?structure) {
        let newStructure = structure # "\n[image_ref]:" # imageId;
        uuidToStructure := Trie.put(uuidToStructure, uuid, newStructure);
      };
    }
  };

  func generateUniqueImageId() : Text {
    imageCounter += 1n;
    return "img-" # Nat.toText(imageCounter)
  };

  func setPrincipalRole(p : Principal, role : AuthorizationRole) {
    principalRoles := Trie.put(principalRoles, p, role)
  };

  func getPrincipalRole(p : Principal) : ?AuthorizationRole {
    Trie.get(principalRoles, p)
  };
}
