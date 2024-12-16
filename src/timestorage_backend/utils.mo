import Text "mo:base/Text";

module Utils {

    // Funzione startsWith per verificare il prefisso di una stringa
    // Utils.startsWith("uuid-", "uuid-");     // true
    // Utils.startsWith("uuid-12345", "uuid-"); // true
    // Utils.startsWith("abc-12345", "uuid-"); // false
    // Utils.startsWith("", "uuid-");          // false
    public func startsWith(s: Text, prefix: Text) : Bool {
        let sChars = Text.toIter(s);
        let prefixChars = Text.toIter(prefix);

        var sIter = sChars.next();
        var prefixIter = prefixChars.next();

        while (prefixIter != null) { // Continua finché ci sono caratteri nel prefisso
            switch (sIter) {
                case (null) { return false; }; // La stringa principale è più corta del prefisso
                case (?char) {
                    switch (prefixIter) {
                        case (?pChar) {
                            if (char != pChar) { return false; };
                        };
                        case (null) { return false; }; // Prefisso finisce in modo inatteso
                    };
                };
            };
            sIter := sChars.next();
            prefixIter := prefixChars.next();
        };
        return true; // Prefisso corrisponde interamente
    };
}

