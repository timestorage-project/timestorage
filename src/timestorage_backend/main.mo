import Principal "mo:base/Principal";
import { mint, uploadUUIDImage, getUuidIndex, getUuidStructure, getUuidContainer, getCoreByKey, getDataByKey, getAllDataByKeys, assignRole, getRole } from "./logic";
import { MintRequest, ImageUploadRequest, UUIDStructure, UUIDContainer } from "./types";

actor timestorage_backend {
  // Initialization hook - could be used to assign an initial admin
  public func init() {
    let caller = Principal.fromActorId();
    // Assign the caller as admin initially
    logic.assignRole(caller, {admin = true; editor = true; reader = true});
  }

  // Query methods (read-only)
  public query func getUuidIndex() : async [Text] {
    return logic.getUuidIndex();
  }

  public query func getUuidStructure() : async [UUIDStructure] {
    // Convert from [(Text, Text)] to [UUIDStructure]
    let entries = logic.getUuidStructure();
    entries.map(func (e) { { uuid = e.0; structure = e.1 } })
  }

  public query func getUuidContainer() : async [UUIDContainer] {
    let entries = logic.getUuidContainer();
    entries.map(func (e) { { uuid = e.0; data = { key = e.0; value = e.1 } } })
  }

  public query func getCoreByKey(key: Text) : async ?{key: Text; value: Text} {
    logic.getCoreByKey(key)
  }

  public query func getDataByKey(key: Text) : async ?Text {
    logic.getDataByKey(key)
  }

  public query func getAllDataByKeys(keys: [Text]) : async [(Text, ?Text)] {
    logic.getAllDataByKeys(keys)
  }

  // Update methods (require authorization)
  public func mint(req: MintRequest) : async Text {
    logic.mint(req)
  }

  public func uploadUUIDImage(req: ImageUploadRequest) : async Text {
    logic.uploadUUIDImage(req)
  }

  public func assignRole(p: Principal, role: {admin: Bool; editor: Bool; reader: Bool}) : async Text {
    logic.assignRole(p, role)
  }

  public query func getRole(p: Principal) : async ?{admin: Bool; editor: Bool; reader: Bool} {
    logic.getRole(p)
  }

}
