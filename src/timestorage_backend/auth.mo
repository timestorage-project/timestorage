import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Types "./types";

module {
  type AuthorizationRole = Types.AuthorizationRole;

  let requireEditorOrAbove = func(getRoleFunc : Principal -> ?AuthorizationRole) {
    let caller = Principal.fromActor();
    let role = getRoleFunc(caller);
    switch (role) {
      case (null) { Error.reject("Unauthorized: No role assigned") };
      case (?r) {
        if (not (r.admin or r.editor)) {
          Error.reject("Unauthorized: Insufficient permissions")
        }
      }
    }
  };

  let requireAdmin = func(getRoleFunc : Principal -> ?AuthorizationRole) {
    let caller = Principal.fromActor();
    let role = getRoleFunc(caller);
    switch (role) {
      case (null) { Error.reject("Unauthorized: No role assigned") };
      case (?r) {
        if (not r.admin) {
          Error.reject("Unauthorized: Admin role required")
        }
      }
    }
  };
}
