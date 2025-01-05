import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import TrieMap "mo:base/TrieMap";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";

module Utils {
    //
    // 1) substring semplificato
    //
    private func substring(text: Text, start: Nat, length: Nat) : Text {
        let textSize = Text.size(text);
        if (start >= textSize) {
            return "";
        };
        let end = if (start + length > textSize) {
            textSize;
        } else {
            start + length;
        };

        var result = "";
        var i = 0;
        for (char in text.chars()) {
            if (i >= start and i < end) {
                result #= Text.fromChar(char);
            };
            i += 1;
        };
        return result;
    };

    //
    // 2) indexOf semplificato
    //
    private func indexOf(text: Text, target: Text) : ?Nat {
        let textSize = Text.size(text);
        let targetSize = Text.size(target);
        if (targetSize == 0 or targetSize > textSize) {
            return null;
        };

        for (i in Iter.range(0, textSize - targetSize)) {
            let candidate = substring(text, i, targetSize);
            if (candidate == target) {
                return ?i;
            };
        };
        return null;
    };

    //
    // 3) ExtractNextValue: estrae la prossima coppia chiave:valore
    //
    private func extractNextValue(json: Text) : (Text, Text) {
        let trimmedJson = Text.trim(json, #text(" "));
        switch (indexOf(trimmedJson, ",")) {
            case (?commaPos) {
                let value = Text.trim(substring(trimmedJson, 0, commaPos), #text(" \""));
                let remaining = Text.trim(
                    substring(trimmedJson, commaPos + 1, Text.size(trimmedJson) - (commaPos + 1)),
                    #text(" ")
                );
                return (value, remaining);
            };
            case null {
                // Ultimo valore, non c’è più virgola
                let lastValue = Text.trim(trimmedJson, #text(" \""));
                return (lastValue, "");
            };
        };
    };

    //
    // 4) Parser semplificato JSON -> Mappa (chiave -> valore)
    //
    public func jsonToMap(json: Text) : ?TrieMap.TrieMap<Text, Text> {
        let map = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
        var processedJson = Text.trim(json, #text("{}")); // Rimuovi le parentesi graffe esterne

        var keepParsing = true;
        while (keepParsing) {
            switch (indexOf(processedJson, ":")) {
                case null {
                    // Fine parsing
                    keepParsing := false;
                };
                case (?colonPos) {
                    let rawKey = substring(processedJson, 0, colonPos);
                    let key = Text.trim(rawKey, #text(" \""));

                    let afterColon = substring(
                        processedJson,
                        colonPos + 1,
                        Text.size(processedJson) - (colonPos + 1)
                    );

                    let (value, remaining) = extractNextValue(afterColon);

                    // Inserisci in mappa
                    map.put(key, value);

                    // Aggiorna la stringa rimanente
                    processedJson := remaining;
                };
            };
        };
        return ?map;
    };
     

    //
    // 5) Parser semplificato JSON -> Array di Text
    //
    public func jsonToArray(json: Text) : ?[Text] {
        let trimmed = Text.trim(json, #text("[]")); // Rimuove le eventuali parentesi quadre
        let splitted = Text.split(trimmed, #char(',')); // Divide in base alla virgola
        return ?Iter.toArray(splitted);
    };

    //
    // 6) Mappa -> JSON string
    //
    public func mapToJson(map: TrieMap.TrieMap<Text, Text>) : Text {
        let buffer = Buffer.Buffer<Text>(map.size());
        for ((key, value) in map.entries()) {
            buffer.add("\"" # key # "\":\"" # escapeJson(value) # "\"");
        };
        return "{" # Text.join(",", buffer.vals()) # "}";
    };

    //
    // 7) Escape JSON basilare (backslash, virgolette, ecc.)
    //
    private func escapeJson(value: Text) : Text {
        var result = value;
        let replacements = [
            ("\\", "\\\\"),
            ("\"", "\\\""),
            ("\n", "\\n"),
            ("\t", "\\t"),
            ("\r", "\\r")
        ];
        for ((orig, repl) in replacements.vals()) {
            result := Text.replace(result, #text(orig), repl);
        };
        return result;
    };

    //
    // 8) Controllo UUID semplificato
    //
    public func isValidUUID(uuid: Text) : Bool {
        return Text.startsWith(uuid, #text("uuid-"));
    };

    //
    // 9) Estrai tutte le chiavi dal JSON schema
    //
    public func extractKeysFromSchema(schema: Text) : [Text] {
        let mapOpt = jsonToMap(schema);
        switch (mapOpt) {
            case null { return []; };
            case (?map) {
                let keysBuffer = Buffer.Buffer<Text>(map.size());
                for ((key, _) in map.entries()) {
                    keysBuffer.add(key);
                };
                return Buffer.toArray(keysBuffer);
            };
        };
    };

    //
    // 10) generateInitialJson(schema): crea un JSON iniziale con i campi = "" (vuoti)
    //
    public func generateInitialJson(schema: Text) : (Text, [Text]) {
        Debug.print("Parsing schema...");

        let schemaMapOpt = jsonToMap(schema);
        switch (schemaMapOpt) {
            case null {
                Debug.print("Failed to parse schema into map.");
                return ("{}", []);
            };
            case (?_) {
                Debug.print("Schema map parsed successfully.");

                // Estrai tutte le chiavi dal schemaMap
                let keys = extractKeysFromSchema(schema);

                // Crea un JSON iniziale con tutte le chiavi estratte
                var jsonBuffer = "{";
                for (key in keys.vals()) {
                    jsonBuffer #= "\"" # key # "\":\"\",";
                };
                // Rimuove l’ultima virgola se presente e chiude con "}"
                jsonBuffer := Text.trimEnd(jsonBuffer, #char(','));
                jsonBuffer #= "}";

                Debug.print("Final JSON: " # jsonBuffer);
                return (jsonBuffer, keys);
            };
        };
    };
    //
    // 11) updateJsonValue: aggiorna il valore di una chiave nel JSON (semplice)
    //
    public func updateJsonValue(json: Text, key: Text, newValue: Text) : Text {
        let keyWithQuotes = "\"" # key # "\"";
        switch (indexOf(json, keyWithQuotes)) {
            case null {
                Debug.print("Key not found in JSON: " # key);
                return json;
            };
            case (?pos) {
                let afterKeyPos = pos + Text.size(keyWithQuotes);
                let afterKey = substring(json, afterKeyPos, Text.size(json) - afterKeyPos);

                switch (indexOf(afterKey, ":")) {
                    case null {
                        Debug.print("Invalid JSON structure after key: " # key);
                        return json;
                    };
                    case (?colonPos) {
                        let valueStart = afterKeyPos + colonPos + 1; // Dopo i due punti
                        let tail = substring(json, valueStart, Text.size(json) - valueStart);

                        // Trova la virgola successiva (o la fine) per capire dove finisce il vecchio valore
                        let commaIndex = indexOf(tail, ",");
                        let valueEndPos = switch (commaIndex) {
                            case (?cPos) cPos;
                            case null {
                                // Nessuna virgola, siamo probabilmente a fine oggetto
                                Text.size(tail);
                            };
                        };

                        let beforeValue = substring(json, 0, valueStart);
                        let afterValue = substring(tail, valueEndPos, Text.size(tail) - valueEndPos);

                        // Sovrascriviamo con " newValue "
                        let updated = beforeValue # " \"" # newValue # "\"" # afterValue;
                        return updated;
                    };
                };
            };
        };
    };
};