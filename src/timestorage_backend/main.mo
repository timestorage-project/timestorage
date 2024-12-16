import Storage "./storage";
import Types "./types";
import Auth "./auth";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";

actor TimestorageBackend {
  // STABLE DATA: array di coppie per persistenza
  stable var uuidToStructureStable : [(Text, Text)] = [];
  stable var uuidToImagesStable : [(Text, Storage.ImageRecord)] = [];
  stable var adminsStable : [Principal] = [];
  stable var imageCounter : Nat = 0;

  // MAPPE DINAMICHE
  var uuidToStructure = Storage.newUUIDStructure();
  var uuidToImages = Storage.newImageMap();

  // Inizializza l'admin principale solo se la lista è vuota
  if (adminsStable.size() == 0) {
    let caller = Principal.fromActor(TimestorageBackend);
    adminsStable := [caller];
  };

  // Caricamento all'avvio
  system func postupgrade() {
    for ((k, v) in uuidToStructureStable.vals()) { uuidToStructure.put(k, v); };
    for ((k, v) in uuidToImagesStable.vals()) { uuidToImages.put(k, v); };
  };

  // Salvataggio prima dell'aggiornamento
  system func preupgrade() {
    uuidToStructureStable := Iter.toArray(uuidToStructure.entries());
    uuidToImagesStable := Iter.toArray(uuidToImages.entries());
  };

  // Aggiungere un nuovo admin
  public func addAdmin(newAdmin: Principal, caller: Principal) : async Text {
    adminsStable := Auth.addAdmin(newAdmin, caller, adminsStable);
    return "New admin added successfully.";
  };

  // Verifica se l'utente corrente è admin
  public shared query func isAdmin(caller: Principal) : async Bool {
    return Auth.isAdmin(caller, adminsStable);
  };

  // Inserire un UUID con struttura (solo admin)
  public func insertUUIDStructure(uuid : Text, structure : Text, caller: Principal) : async Text {
    Auth.requireAdmin(caller, adminsStable);
    uuidToStructure.put(uuid, structure);
    return "UUID inserted successfully.";
  };

  // Ottenere tutti gli UUID (solo admin)
  public shared query func getAllUUIDs(caller: Principal) : async [Text] {
    Auth.requireAdmin(caller, adminsStable);
    return Iter.toArray(uuidToStructure.keys());
  };

  // Caricare un'immagine (solo admin)
  public func uploadImage(uuid: Text, imgData: Blob, metadata: Types.ImageMetadata, caller: Principal) : async Text {
    Auth.requireAdmin(caller, adminsStable);

    if (uuidToStructure.get(uuid) == null) {
      Debug.trap("Error: UUID does not exist.");
    };

    let imageId = generateUniqueImageId();
    uuidToImages.put(imageId, { imageData = imgData; metadata = metadata });
    return "Image uploaded successfully with ID: " # imageId;
  };

  // Generare un ID immagine unico
  func generateUniqueImageId() : Text {
    imageCounter += 1;
    return "img-" # Nat.toText(imageCounter);
  };

  // Funzione di debug: ottenere tutti i dati
  public query func debugGetAllData() : async [(Text, Text)] {
    return Iter.toArray(uuidToStructure.entries());
  };
}
