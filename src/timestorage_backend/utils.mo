import Text "mo:base/Text";

module Utils {
    // Controlla se un UUID è valido
    public func isValidUUID(uuid: Text) : Bool {
        return Text.startsWith(uuid, #text("uuid-"));
    }
}