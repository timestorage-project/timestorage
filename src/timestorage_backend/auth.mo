import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Array "mo:base/Array";

module {
  // Verifica se un Principal è un admin
  public func isAdmin(caller: Principal, admins: [Principal]) : Bool {
    for (admin in admins.vals()) {
      if (admin == caller) {
        return true;
      };
    };
    return false;
  };

  // Aggiunge un nuovo admin, garantendo unicità
  public func addAdmin(newAdmin: Principal, caller: Principal, admins: [Principal]) : [Principal] {
    if (not isAdmin(caller, admins)) {
      Debug.trap("Unauthorized: Only admins can add new admins.");
    };
    if (isAdmin(newAdmin, admins)) {
      Debug.trap("Admin already exists.");
    };
    return Array.append<Principal>(admins, [newAdmin]);
  };

  // Richiede che il chiamante sia un admin
  public func requireAdmin(caller: Principal, admins: [Principal]) {
    if (not isAdmin(caller, admins)) {
      Debug.trap("Unauthorized: Admin role required.");
    };
  };
}


