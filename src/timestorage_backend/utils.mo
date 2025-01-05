import Text "mo:base/Text";
import Char "mo:base/Char";
import Iter "mo:base/Iter";

module Utils {
    // Controlla se un UUID è valido
    public func isValidUUID(uuid: Text) : Bool {
        return Text.startsWith(uuid, #text("uuid-"));
    };

    // Estrae una sottostringa da un testo
    public func substring(text: Text, start: Nat, length: Nat) : Text {
        let chars = Text.toIter(text); // Converti il testo in un iteratore di caratteri
        var result = "";
        var i = 0;

        label l for (char in chars) {
        if (i >= start and i < start + length) {
            result := result # Char.toText(char); // Aggiungi il carattere alla sottostringa
        };
        i += 1;
        if (i >= start + length) { break l }; // Interrompi il ciclo dopo aver raggiunto la lunghezza desiderata
        };
        return result;
    };

    // Trova l'indice di una sottostringa in un testo
    public func indexOf(text: Text, substring: Text) : ?Nat {
        let textSize = Text.size(text);
        let subSize = Text.size(substring);

        // Evita errori se la sottostringa è più lunga del testo
        if (subSize > textSize) { return null; };

        var i = 0;
        while (i + subSize <= textSize) {
        let slice = Utils.substring(text, i, subSize); // Usiamo la nostra funzione substring
        if (slice == substring) {
            return ?i;
        };
        i += 1;
        };
        return null;
    };

    // Trova e sostituisce un valore in una stringa JSON
    public func updateJsonValue(json: Text, key: Text, newValue: Text) : Text {
        let keyWithQuotes = "\"" # key # "\"";
        let keyIndex = indexOf(json, keyWithQuotes);

        switch (keyIndex) {
        case null { return json; }; // Chiave non trovata
        case (?index) {
            let afterKey = substring(json, index + Text.size(keyWithQuotes), Text.size(json) - (index + Text.size(keyWithQuotes))); // Usiamo substring
            let valueStart = indexOf(afterKey, ":");

            switch (valueStart) {
            case null { return json; }; // Formato non valido
            case (?start) {
                let valueEnd = indexOf(afterKey, ",");

                let beforeValue = substring(json, 0, index + Text.size(keyWithQuotes) + start + 1); // Usiamo substring
                let afterValue = switch (valueEnd) {
                case (?end) { substring(json, index + Text.size(keyWithQuotes) + start + 1 + end, Text.size(json) - (index + Text.size(keyWithQuotes) + start + 1 + end)); }; // Usiamo substring
                case null { ""; }; // Fine del JSON
                };

                return beforeValue # newValue # afterValue;
            };
            };
        };
        };
    };

    // Verifica se una chiave esiste nello schema JSON
    public func keyExistsInSchema(json: Text, key: Text) : Bool {
        let keys = Iter.toArray(Text.split(key, #text("."))); // Divide la chiave in parti (es. "data.productInfo.dimensions" -> ["data", "productInfo", "dimensions"])
        var currentJson = json;

        for (k in keys.vals()) {
        let keyWithQuotes = "\"" # k # "\"";
        let keyIndex = indexOf(currentJson, keyWithQuotes);

        switch (keyIndex) {
            case null { return false; }; // La chiave non esiste
            case (?index) {
            let afterKey = substring(currentJson, index + Text.size(keyWithQuotes), Text.size(currentJson) - (index + Text.size(keyWithQuotes))); // Usiamo substring
            let valueStart = indexOf(afterKey, ":");

            switch (valueStart) {
                case null { return false; }; // Formato non valido
                case (?start) {
                let valueEnd = indexOf(afterKey, ",");

                let value = switch (valueEnd) {
                    case (?end) { substring(afterKey, start + 1, end - start - 1); }; // Usiamo substring
                    case null { substring(afterKey, start + 1, Text.size(afterKey) - start - 1); }; // Fine del JSON
                };

                currentJson := value;
                };
            };
            };
        };
        };

        return true; // La chiave esiste
    };
};