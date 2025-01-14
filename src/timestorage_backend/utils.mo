import Text "mo:base/Text";

module Utils {
    // Controllo UUID semplificato: deve iniziare con "uuid-"
    public func isValidUUID(uuid: Text) : Bool {
        return Text.startsWith(uuid, #text "uuid-");
    };

    public func mapEntriesToJson(entries: [(Text, Text)]) : Text {
        var json = "{";
        for ((k, v) in entries.vals()) {
            // Eseguiamo escape basilare se necessario
            let escapedKey = escapeString(k);
            let escapedVal = escapeString(v);

            json #= "\"" # escapedKey # "\":\"" # escapedVal # "\",";
        };
        json := Text.trimEnd(json, #char(','));
        json #= "}";
        return json;
    };

    private func escapeString(str: Text) : Text {
        var r = str;
        r := Text.replace(r, #text "\\", "\\\\");
        r := Text.replace(r, #text "\"", "\\\"");
        return r;
    };
}

