import Text "mo:base/Text";

module Utils {
    // Controlla se un UUID è valido: deve iniziare con "uuid-" ed essere lungo almeno 5 caratteri
    public func isValidUUID(uuid: Text) : Bool {
        let prefix = "uuid-";
        if (Text.size(uuid) < Text.size(prefix)) {
            return false;
        };

        // Controlla manualmente il prefisso
        let uuidChars = Text.toIter(uuid);
        let prefixChars = Text.toIter(prefix);

        var uuidIter = uuidChars.next();
        var prefixIter = prefixChars.next();

        while (prefixIter != null) {
            switch (uuidIter) {
                case (null) { return false; };
                case (?char) {
                    switch (prefixIter) {
                        case (?pChar) {
                            if (char != pChar) { return false; };
                        };
                        case (null) { return true; };
                    };
                };
            };
            uuidIter := uuidChars.next();
            prefixIter := prefixChars.next();
        };

        return true;
    };
}