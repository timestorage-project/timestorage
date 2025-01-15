# Time Storage - Backend Documentation

Welcome to the **Time Storage Backend**! This project provides a highly secure and scalable way to manage and store key-value pairs associated with unique identifiers (UUIDs). It also includes support for file uploads and value locking mechanisms to ensure data integrity. Let's dive into how to set up, use, and interact with the backend API!

---

## 📂 File Structure Overview
Here's a breakdown of the most important files:

- **auth.mo**: Handles admin authentication and access control.
- **logic.mo**: Core business logic of the backend.
- **main.mo**: Entry point of the backend canister.
- **storage.mo**: Defines storage maps and structures.
- **types.mo**: Contains custom types and data models.
- **utils.mo**: Utility functions for validation and JSON manipulation.

---

## 🛠️ Setup and Deployment

1. Clone the repository.
2. Navigate to the project directory.
3. Run the following command to start the local Internet Computer environment:
   ```bash
   dfx start --background
   ```
4. Deploy the canister using:
   ```bash
   dfx deploy timestorage_backend
   ```

---

# 📖 Canister Interaction Documentation

Here is a detailed list of the canister "endpoints" available in the Time Storage Backend. Each endpoint is explained with its parameters, usage examples, and expected responses.

---

## 🔸​ **isAdmin**

**Description:** Checks if the caller is an admin.

**Endpoint:**
```motoko
public shared query (msg) func isAdmin() : async Bool
```

**Example Command:**
```bash
dfx canister call timestorage_backend isAdmin
```

**Response:**
- Success: `true`
- Error: `false`

---

## 🔸​ **addAdmin**

**Description:** Adds a new admin to the system.

**Endpoint:**
```motoko
public shared (msg) func addAdmin(newAdmin: Principal) : async Result.Result<Text, Text>
```

**Parameters:**
- `newAdmin` (Principal): The principal ID of the new admin.

**Example Command:**
```bash
dfx canister call timestorage_backend addAdmin '(principal "[principal_id]")'
```

**Response:**
- Success: `(variant { ok = "New admin added successfully." })`
- Error: `(variant { err = "Unauthorized access." })`

---

## 1. **insertUUIDStructure**

**Description:** Inserts a new structure for a given UUID.

**Endpoint:**
```motoko
public shared (msg) func insertUUIDStructure(uuid: Text, schema: Text) : async Result.Result<Text, Text>
```

**Parameters:**
- `uuid` (Text): The unique identifier to associate with the structure.
- `schema` (Text): The structure in JSON format.

**Example Command:**
```bash
dfx canister call timestorage_backend insertUUIDStructure '("uuid-dummy", "{\"name\": \"value\"}")'
```

**Response:**
- Success: `(variant { ok = "UUID inserted successfully." })`
- Error: `(variant { err = "Invalid UUID format." })`

---

## 2. **uploadFile**

**Description:** Uploads a file and associates it with a given UUID.

**Endpoint:**
```motoko
public shared (msg) func uploadFile(uuid: Text, base64FileData: Text, metadata: Types.FileMetadata) : async Result.Result<Text, Text>
```

**Parameters:**
- `uuid` (Text): The UUID to associate the file with.
- `base64FileData` (Text): The file data in Base64 format.
- `metadata` (Types.FileMetadata): Metadata about the file (e.g., name, type).

**Example Command:**
```bash
dfx canister call timestorage_backend uploadFile '("uuid-dummy", "<base64_data>", record { fileName = "example.txt"; mimeType = "text/plain"; uploadTimestamp = 1234567890 })'
```

**Response:**
- Success: `(variant { ok = "File uploaded successfully with ID: file-{NUMBER_GENERATED}" })`
- Error: `(variant { err = "Error: UUID does not exist." })`

---

## 3. **getFileByUUIDAndId**

**Description:** Retrieves a file associated with a UUID and a file ID.

**Endpoint:**
```motoko
public shared query (msg) func getFileByUUIDAndId(uuid: Text, fileId: Text) : async Types.Result<Types.FileResponse, Text>
```

**Parameters:**
- `uuid` (Text): The UUID of the file.
- `fileId` (Text): The unique file ID.

**Example Command:**
```bash
dfx canister call timestorage_backend getFileByUUIDAndId '("uuid-dummy", "file-1")'
```

**Response:**
- Success: Returns file data and metadata.
  ```
  (
  variant {
    ok = record {
      metadata = record {
        fileData = "<base64_data>";
        mimeType = "text/plain";
        fileName = "example.txt";
        uploadTimestamp = "1234567890";
      };
      uuid = "uuid-dummy";
    }
  },
  )
  ```
- Error: `(variant { err = "File not found." })`

---

## 4. **updateValue**

**Description:** Updates a specific value associated with a UUID.

**Endpoint:**
```motoko
public shared (msg) func updateValue(req: Types.ValueUpdateRequest) : async Result.Result<Text, Text>
```

**Parameters:**
- `req` (Types.ValueUpdateRequest): The request containing the UUID, key, and new value.

**Example Command:**
```bash
dfx canister call timestorage_backend updateValue '(record { uuid = "uuid-dummy"; key = "exampleKey"; newValue = "newValue" })'
```

**Response:**
- Success: `(variant { ok = "Value updated successfully." })`
- Error: `(variant { err = "UUID not found or not initialized." })`

---

## 5. **updateManyValues**

**Description:** Updates multiple key-value pairs for a given UUID.

**Endpoint:**
```motoko
public shared (msg) func updateManyValues(uuid: Text, updates: [(Text, Text)]) : async Result.Result<Text, [Text]>
```

**Parameters:**
- `uuid` (Text): The UUID to update.
- `updates` ([(Text, Text)]): A list of key-value pairs to update.

**Example Command:**
```bash
dfx canister call timestorage_backend updateManyValues '("uuid-dummy", vec { record { "exampleKey"; "new-value1" }; record { "key2"; "new-value2" }; record { "key3"; "value3" } })'
```

**Response:**
- Success: `(variant { ok = "All values updated successfully." })`
- Error: `(variant { err = ["UUID not found", "Key not found"] })`
- Error: `(variant { ok = "Some keys could not be updated: key2, key3" })`

---

## 6. **lockValue**

**Description:** Locks or unlocks a specific value for a UUID.

**Endpoint:**
```motoko
public shared (msg) func lockValue(req: Types.ValueLockRequest) : async Result.Result<Text, Text>
```

**Parameters:**
- `req` (Types.ValueLockRequest): The request containing the UUID, key, and lock status.

**Example Command:**
```bash
dfx canister call timestorage_backend lockValue '(record { uuid = "uuid-dummy"; key = "exampleKey"; lock = true })'
```

**Response:**
- Success: `(variant { ok = "Value locked successfully." })`
- Success: `(variant { ok = "Value unlocked successfully." })`
- Error: `(variant { err = "UUID not found." })`


## 7. **lockAllValues**

**Description:** Locks or unlocks all values for a given UUID.

**Endpoint:**
```motoko
public shared (msg) func lockAllValues(req: Types.ValueLockAllRequest) : async Result.Result<Text, Text>
```

**Parameters:**
- `req` (Types.ValueLockAllRequest): The request containing the UUID and lock status.

**Example Command:**
```bash
dfx canister call timestorage_backend lockAllValues '(record { uuid = "uuid-dummy"; lock = true })'
```

**Response:**
- Success: `(variant { ok = "All values locked successfully." })`
- Success: `(variant { ok = "All values unlocked successfully." })`
- Error: `(variant { err = "UUID not found." })`

---

## 8. **getValue**

**Description:** Retrieves a specific value associated with a UUID.

**Endpoint:**
```motoko
public shared query (msg) func getValue(req: Types.ValueRequest) : async Result.Result<Text, Text>
```

**Parameters:**
- `req` (Types.ValueRequest): The request containing the UUID and key.

**Example Command:**
```bash
dfx canister call timestorage_backend getValue '(record { uuid = "uuid-dummy"; key = "exampleKey" })'
```

**Response:**
- Success: `(variant { ok = "new-value1" })`
- Error: `(variant { err = "Key not found." })`

---

## 9. **getAllValues**

**Description:** Retrieves all key-value pairs associated with a UUID.

**Endpoint:**
```motoko
public shared query (msg) func getAllValues(uuid: Text) : async Result.Result<[(Text, Text)], Text>
```

**Parameters:**
- `uuid` (Text): The UUID to retrieve values for.

**Example Command:**
```bash
dfx canister call timestorage_backend getAllValues '("uuid-dummy")'
```

**Response:**
- Success: `(variant { ok = vec { record { "exampleKey"; "new-value1" } } })`
- Error: `(variant { err = "UUID not found." })`

---

## 10. **getValueLockStatus**

**Description:** Retrieves the lock status of a specific value.

**Endpoint:**
```motoko
public shared query (msg) func getValueLockStatus(req: Types.ValueLockStatusRequest) : async Result.Result<Types.ValueLockStatus, Text>
```

**Parameters:**
- `req` (Types.ValueLockStatusRequest): The request containing the UUID and key.

**Example Command:**
```bash
dfx canister call timestorage_backend getValueLockStatus '(record { uuid = "uuid-dummy"; key = "exampleKey" })'
```

**Response:**
- Success: `(variant { ok = record { locked = true; lockedBy = ?principal "[principal_id]" } })`
- Error: `(variant { err = "No lock status found." })`

---

## 📌​ **getUUIDInfo**

**Description:** Retrieves all information associated with a UUID.

**Endpoint:**
```motoko
public shared query (msg) func getUUIDInfo(uuid: Text) : async Result.Result<(Text, [Types.FileResponse]), Text>
```

**Parameters:**
- `uuid` (Text): The UUID to retrieve information for.

**Example Command:**
```bash
dfx canister call timestorage_backend getUUIDInfo '("uuid-dummy")'
```

**Response:**
- Success: Returns schema, values, and file metadata.
```
  (
  variant {
    ok = record {
      "{{\"name\": \"value\"},\"values\":{{\"exampleKey\":\"new-value1\"}},\"lockStatus\":{{\"exampleKey\":\"unlocked\"}}}";
      vec {
        record {
          metadata = record {
            fileData = "<base64_data>";
            mimeType = "text/plain";
            fileName = "example.txt";
            uploadTimestamp = "1234567890";
          };
          uuid = "uuid-dummy";
        };
      };
    }
  },
)
```
- Error: `(variant { err = "UUID not found." })`

---
