import Text "mo:base/Text";
import Int "mo:base/Int";

module Utils {

    // Check if a string is a valid UUID
    public func isValidUUID(uuid: Text) : Bool {
        return Text.startsWith(uuid, #text "uuid-");
    };

    // Map a list of key-value pairs to a JSON object
    public func mapEntriesToJson(entries: [(Text, Text)]) : Text {
        if (entries.size() == 0) {
            return "{}";
        };

        var json = "{";
        let lastIndex = Int.abs(entries.size() - 1 : Int);
        var i = 0;
        
        for ((k, v) in entries.vals()) {
            let escapedKey = escapeString(k);
            let escapedVal = escapeString(v);
            json #= "\"" # escapedKey # "\":\"" # escapedVal # "\"";
            
            if (i < lastIndex) {
                json #= ",";
            };
            i += 1;
        };
        
        json #= "}";
        return json;
    };

    // Escape special characters in a string
    private func escapeString(str: Text) : Text {
        var r = str;
        r := Text.replace(r, #text "\\", "\\\\");
        r := Text.replace(r, #text "\"", "\\\"");
        r := Text.replace(r, #text "\n", "\\n");
        r := Text.replace(r, #text "\t", "\\t");
        r := Text.replace(r, #text "\r", "\\r");
        return r;
    };
}

