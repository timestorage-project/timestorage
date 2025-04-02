# 1. Carica un file nel repository globale
dfx canister call timestorage_backend uploadGlobalFile '(
  "SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGZpbGUgY29udGVudCE=", 
  record { 
    fileName = "finestra1.jpg"; 
    mimeType = "image/jpeg"; 
    uploadTimestamp = 1680123456 
  }
)'

# Salva l'ID del file restituito
# Ad esempio, se viene restituito "file-1", usa questo nelle chiamate successive


# BONUS Ottieni i metadati di un file globale
dfx canister call timestorage_backend getGlobalFileMetadata '("file-1")'

# BONUS  Ottieni tutti i file globali (solo admin)
dfx canister call timestorage_backend getAllGlobalFiles '()'

# 2. Carica un secondo file
dfx canister call timestorage_backend uploadGlobalFile '(
  "VGhpcyBpcyBhbm90aGVyIHRlc3QgZmlsZSBjb250ZW50IQ==", 
  record { 
    fileName = "finestra2.jpg"; 
    mimeType = "image/jpeg"; 
    uploadTimestamp = 1680123457 
  }
)'

# 3. Crea un UUID per un prodotto
dfx canister call timestorage_backend createEmptyUUID '("prodotto-finestra-1")'

# 4. Aggiorna la struttura dell'UUID con uno schema
dfx canister call timestorage_backend updateUUIDStructure '(
  "prodotto-finestra-1", 
  "{\"nome\": \"string\", \"dimensioni\": \"string\", \"prezzo\": \"number\"}"
)'

# 5. Associa il primo file all'UUID
dfx canister call timestorage_backend associateFileWithUUID '("prodotto-finestra-1", "file-1")'

# 6. Verifica i file associati all'UUID
dfx canister call timestorage_backend getUUIDAssociatedFiles '("prodotto-finestra-1")'

# 7. Crea un secondo UUID
dfx canister call timestorage_backend createEmptyUUID '("prodotto-finestra-2")'

# 8. Aggiorna la struttura del secondo UUID
dfx canister call timestorage_backend updateUUIDStructure '(
  "prodotto-finestra-2", 
  "{\"nome\": \"string\", \"dimensioni\": \"string\", \"prezzo\": \"number\"}"
)'

# 9. Associa entrambi i file al secondo UUID
dfx canister call timestorage_backend associateFileWithUUID '("prodotto-finestra-2", "file-1")'
dfx canister call timestorage_backend associateFileWithUUID '("prodotto-finestra-2", "file-2")'

# 10. Verifica i file associati al secondo UUID
dfx canister call timestorage_backend getUUIDAssociatedFiles '("prodotto-finestra-2")'

# 11. Aggiorna valori per il primo UUID
dfx canister call timestorage_backend updateValue '(
  record { 
    uuid = "prodotto-finestra-1"; 
    key = "nome"; 
    newValue = "Finestra Scorrevole Deluxe" 
  }
)'

dfx canister call timestorage_backend updateValue '(
  record { 
    uuid = "prodotto-finestra-1"; 
    key = "dimensioni"; 
    newValue = "120x80cm" 
  }
)'

dfx canister call timestorage_backend updateValue '(
  record { 
    uuid = "prodotto-finestra-1"; 
    key = "prezzo"; 
    newValue = "499.99" 
  }
)'

# 12. Ottieni tutte le informazioni sul primo UUID
dfx canister call timestorage_backend getUUIDInfo '("prodotto-finestra-1")'

# 13. Conta i riferimenti al primo file
dfx canister call timestorage_backend countFileReferences '("file-1")'

# 14. Copia le associazioni di file dal secondo UUID a un nuovo UUID
dfx canister call timestorage_backend createEmptyUUID '("prodotto-finestra-3")'
dfx canister call timestorage_backend copyFileAssociations '("prodotto-finestra-2", "prodotto-finestra-3")'

# 15. Verifica i file nel nuovo UUID
dfx canister call timestorage_backend getUUIDAssociatedFiles '("prodotto-finestra-3")'

# 16. Rimuovi l'associazione di un file da un UUID
dfx canister call timestorage_backend disassociateFileFromUUID '("prodotto-finestra-1", "file-1")'

# 17. Verifica che il file non sia più associato
dfx canister call timestorage_backend getUUIDAssociatedFiles '("prodotto-finestra-1")'