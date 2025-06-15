#!/bin/bash

# This script deploys the canister and populates it with a mock asset structure.
# It is intended for development and testing purposes.
#
# It performs the following steps:
# 1. Starts the local replica in the background.
# 2. Deploys the canisters.
# 3. Prepares a large JSON payload by minifying and escaping it.
# 4. Calls the 'insertUUIDStructure' method on the 'timestorage_backend' canister
#    with the mock data.
# 5. Stops the local replica.

# # Exit immediately if a command exits with a non-zero status.
# set -e

# echo "Starting local replica in the background..."
# dfx start --background

# # Wait a few seconds for dfx to start properly
# sleep 5

# echo "Deploying canisters..."
# dfx deploy

# Use a here-document to define the JSON payload. This is much cleaner than a single-line string.
# The 'EOF' is quoted to prevent shell expansion inside the here-document.
read -r -d '' JSON_DATA <<'EOF'
{
   "info": {
    "identification": "Mock",
    "subIdentification": "Mock",
    "issuer": {
        "identification": "Cardinal",
        "email": "info@cardinal.com",
        "name": "Cardinal",
        "phone": "+39 123456789",
        "website": "https://cardinal.solar",
        "principal": "Mock"
    },
    "version": "1.0",
    "createdAt": "2025-06-15T16:00:00.000Z"
   },
    "data": {
        "productInfo": {
            "id": "product-info", "title": "Informazioni sul Prodotto", "description": "Dettagli sul prodotto.", "type": "data", "icon": "info",
            "children": [
                {"icon": "📏", "label": "Dimensioni", "value": "#/values/productInfo/dimensions"},
                {"icon": "🔢", "label": "Numero di Modello", "value": "#/values/productInfo/modelNumber"},
                {"icon": "🏗️", "label": "Tipo di Materiale", "value": "#/values/productInfo/materialType"},
                {"icon": "🪟", "label": "Tipo di Vetro", "value": "#/values/productInfo/glassType"},
                {"icon": "⚡", "label": "Classe Energetica", "value": "#/values/productInfo/energyRating"},
                {"icon": "📅", "label": "Data di Produzione", "value": "#/values/productInfo/manufacturingDate"},
                {"icon": "🔢", "label": "Numero di Serie", "value": "#/values/productInfo/serialNumber"},
                {"icon": "📋", "label": "Stato dell'Installazione", "value": "#/values/productInfo/installationStatus"},
                {"icon": "🪟", "label": "Tipo di Finestra", "value": "#/values/productInfo/windowType"}
            ]
        },
        "productDocuments": {
            "id": "product-documents", "title": "Documenti del Prodotto", "description": "Documentazione relativa al prodotto.", "type": "data", "icon": "description",
            "children": [
                {"icon": "📄", "label": "Scheda Tecnica", "value": "#/values/productDocuments/schedaTecnica", "fileType": "PDF"},
                {"icon": "📄", "label": "Dichiarazione Sostanze Pericolose", "value": "#/values/productDocuments/dichiarazioneSostanzePericolose", "fileType": "PDF"},
                {"icon": "📄", "label": "Dichiarazione di Prestazione", "value": "#/values/productDocuments/dichiarazioneDiPrestazione", "fileType": "PDF"}
            ]
        },
        "ceMarking": {
            "id": "ce-marking", "title": "Marcatura CE", "description": "Documentazione della marcatura CE.", "type": "data", "icon": "verified",
            "children": [
                {"icon": "📄", "label": "Marcatura CE", "value": "#/values/ceMarking/marcaturaCE", "fileType": "PDF"},
                {"icon": "📄", "label": "Etichetta CE", "value": "#/values/ceMarking/etichettaCE", "fileType": "PDF"}
            ]
        },
        "maintenanceDocuments": {
            "id": "maintenance-documents", "title": "Documenti di Manutenzione", "description": "Documenti relativi alla manutenzione.", "type": "data", "icon": "build",
            "children": [
                {"icon": "📄", "label": "Manuale di Manutenzione", "value": "#/values/maintenanceDocuments/manualeDiManutenzione", "fileType": "PDF"}
            ]
        },
        "installationInformation": {
            "id": "installation-information", "title": "Informazioni sull'Installazione", "description": "Dettagli sull'installazione.", "type": "data", "icon": "construction",
            "children": [
                {"icon": "👤", "label": "Nome dell'Installatore", "value": "#/values/installationInformation/installerName"},
                {"icon": "📷", "label": "Giunto Secondario Frontale Alto SX", "value": "#/values/installationInformation/giuntoSecondarioFrontaleAltoSX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Frontale Basso SX", "value": "#/values/installationInformation/giuntoSecondarioFrontaleBassaSX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Frontale Alto DX", "value": "#/values/installationInformation/giuntoSecondarioFrontaleAltoDX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Frontale Basso DX", "value": "#/values/installationInformation/giuntoSecondarioFrontaleBassoDX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Frontale Generale", "value": "#/values/installationInformation/giuntoSecondarioFrontaleGenerale", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Laterale Alto SX", "value": "#/values/installationInformation/giuntoSecondarioLateraleAltoSX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Laterale Basso SX", "value": "#/values/installationInformation/giuntoSecondarioLateraleBassaSX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Laterale Alto DX", "value": "#/values/installationInformation/giuntoSecondarioLateraleAltoDX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Laterale Basso DX", "value": "#/values/installationInformation/giuntoSecondarioLateraleBassoDX", "fileType": "image"},
                {"icon": "📷", "label": "Giunto Secondario Laterale Generale", "value": "#/values/installationInformation/giuntoSecondarioLateraleGenerale", "fileType": "image"}
            ]
        },
        "installationInformationWizard": {
            "id": "installation-information-wizard", "title": "Procedura Guidata Informazioni Installazione", "description": "Processo guidato per raccogliere informazioni sull'installazione.", "type": "wizard", "icon": "construction",
            "questions": [
                {"id": "installer_name", "type": "text", "question": "Qual è il nome dell'installatore?", "refId": "#/values/installationInformation/installerName"},
                {"id": "giunto_secondario_frontale_alto_sx", "type": "photo", "question": "Carica una foto del giunto secondario frontale alto sinistro.", "refId": "#/values/installationInformation/giuntoSecondarioFrontaleAltoSX"},
                {"id": "giunto_secondario_frontale_basso_sx", "type": "photo", "question": "Carica una foto del giunto secondario frontale basso sinistro.", "refId": "#/values/installationInformation/giuntoSecondarioFrontaleBassaSX"},
                {"id": "giunto_secondario_frontale_alto_dx", "type": "photo", "question": "Carica una foto del giunto secondario frontale alto destro.", "refId": "#/values/installationInformation/giuntoSecondarioFrontaleAltoDX"},
                {"id": "giunto_secondario_frontale_basso_dx", "type": "photo", "question": "Carica una foto del giunto secondario frontale basso destro.", "refId": "#/values/installationInformation/giuntoSecondarioFrontaleBassoDX"},
                {"id": "giunto_secondario_frontale_generale", "type": "photo", "question": "Carica una foto generale del giunto secondario frontale.", "refId": "#/values/installationInformation/giuntoSecondarioFrontaleGenerale"},
                {"id": "giunto_secondario_laterale_alto_sx", "type": "photo", "question": "Carica una foto del giunto secondario laterale alto sinistro.", "refId": "#/values/installationInformation/giuntoSecondarioLateraleAltoSX"},
                {"id": "giunto_secondario_laterale_basso_sx", "type": "photo", "question": "Carica una foto del giunto secondario laterale basso sinistro.", "refId": "#/values/installationInformation/giuntoSecondarioLateraleBassaSX"},
                {"id": "giunto_secondario_laterale_alto_dx", "type": "photo", "question": "Carica una foto del giunto secondario laterale alto destro.", "refId": "#/values/installationInformation/giuntoSecondarioLateraleAltoDX"},
                {"id": "giunto_secondario_laterale_basso_dx", "type": "photo", "question": "Carica una foto del giunto secondario laterale basso destro.", "refId": "#/values/installationInformation/giuntoSecondarioLateraleBassoDX"},
                {"id": "giunto_secondario_laterale_generale", "type": "photo", "question": "Carica una foto generale del giunto secondario laterale.", "refId": "#/values/installationInformation/giuntoSecondarioLateraleGenerale"}
            ]
        }
    }
}
EOF

# Minify and escape the JSON for the dfx command line argument.
# 1. Remove newlines.
# 2. Escape all backslashes (for regex patterns).
# 3. Escape all double quotes.
ESCAPED_JSON=$(echo "$JSON_DATA" | tr -d '\n' | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

echo "Inserting mock asset data into the canister..."

# Call the canister method. The entire Candid argument is wrapped in double quotes
# to allow for the expansion of the $ESCAPED_JSON variable.
dfx canister call timestorage_backend insertUUIDStructure "( \"equipment-v3-mock\", \"$ESCAPED_JSON\" )"

echo "Script finished successfully."

# Stop the local replica
# dfx stop