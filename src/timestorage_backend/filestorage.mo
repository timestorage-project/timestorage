import Text "mo:base/Text";
import Array "mo:base/Array";
import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Types "./types";
import Storage "./storage";
import Auth "./auth";

module FileStorage {
    type UUID = Types.UUID;
    type FileRecord = Types.FileRecord;
    type Result<T, E> = Types.Result<T, E>;

    // Upload a file to the global storage
    public func uploadGlobalFile(
        base64FileData : Text,
        metadata : Types.FileMetadata,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
        fileCounter : Nat,
    ) : (Result<Text, Text>, Nat) {
        // Validate metadata
        if (metadata.fileName.size() == 0 or metadata.mimeType.size() == 0) {
            return (#err("Invalid metadata: File name and mimeType cannot be empty."), fileCounter);
        };

        // Generate a unique file ID
        let newFileCounter = fileCounter + 1;
        let fileId = "file-" # Nat.toText(newFileCounter);

        // Create a new file record
        let fileRecord : Types.FileRecord = {
            uuid = "global"; // Marker indicating this is a global file
            fileData = base64FileData; // Base64
            metadata = metadata;
        };

        globalFiles.put(fileId, fileRecord);

        return (#ok(fileId), newFileCounter); // Return file ID and updated counter
    };

    // Associate a global file with a UUID
    public func associateFileWithUUID(
        uuid : Text,
        fileId : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
    ) : Result<Text, Text> {
        // Check if the UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err("Error: UUID does not exist.");
        };

        // Check if the file exists in global storage
        switch (globalFiles.get(fileId)) {
            case (null) {
                return #err("File not found in global storage.");
            };
            case (?_) {
                // Update a key-value entry to associate the file with the UUID
                let subMapOpt = uuidKeyValueMap.get(uuid);
                let subMap = switch (subMapOpt) {
                    case (null) {
                        return #err("UUID not found or not initialized.");
                    };
                    case (?m) m;
                };

                // Use a special prefix for file associations
                let fileKey = Storage.makeFileAssociationKey(fileId);
                subMap.put(fileKey, fileId);

                return #ok("File successfully associated with UUID.");
            };
        };
    };

    // Disassociate a global file from a UUID
    public func disassociateFileFromUUID(
        uuid : Text,
        fileId : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Result<Text, Text> {
        // Check if the UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err("Error: UUID does not exist.");
        };

        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        // Remove the file association
        let fileKey = Storage.makeFileAssociationKey(fileId);
        subMap.delete(fileKey);

        return #ok("File successfully disassociated from UUID.");
    };

    // Get a global file by ID
    public func getGlobalFile(
        fileId : Text,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
    ) : Types.Result<Types.FileResponse, Text> {
        let fileOpt = globalFiles.get(fileId);

        switch (fileOpt) {
            case null {
                return #err("File not found.");
            };
            case (?fileRecord) {
                let response : Types.FileResponse = {
                    uuid = fileRecord.uuid;
                    metadata = {
                        fileData = fileRecord.fileData;
                        mimeType = fileRecord.metadata.mimeType;
                        fileName = fileRecord.metadata.fileName;
                        uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                    };
                };

                return #ok(response);
            };
        };
    };

    // Get metadata for a global file
    public func getGlobalFileMetadata(
        fileId : Text,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
    ) : Types.Result<Types.FileMetadataResponse, Text> {
        let fileOpt = globalFiles.get(fileId);

        switch (fileOpt) {
            case null {
                return #err("File not found.");
            };
            case (?fileRecord) {
                let response : Types.FileMetadataResponse = {
                    uuid = fileRecord.uuid;
                    metadata = {
                        mimeType = fileRecord.metadata.mimeType;
                        fileName = fileRecord.metadata.fileName;
                        uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                    };
                };

                return #ok(response);
            };
        };
    };

    // Get all files associated with a UUID
    public func getUUIDAssociatedFiles(
        uuid : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
    ) : Types.Result<[Types.FileMetadataResponse], Text> {
        // Check if the UUID exists
        if (uuidToStructure.get(uuid) == null) {
            return #err("Error: UUID does not exist.");
        };

        let subMapOpt = uuidKeyValueMap.get(uuid);
        let subMap = switch (subMapOpt) {
            case (null) { return #err("UUID not found or not initialized.") };
            case (?m) m;
        };

        var fileResponses : [Types.FileMetadataResponse] = [];

        // Iterate through all key-value pairs for this UUID
        for ((key, value) in subMap.entries()) {
            // Check if the key starts with our special file prefix
            if (Storage.isFileAssociationKey(key)) {
                let fileId = value;
                let fileOpt = globalFiles.get(fileId);

                switch (fileOpt) {
                    case (null) {
                        // File reference exists but file not found - could clean up here
                    };
                    case (?fileRecord) {
                        let response : Types.FileMetadataResponse = {
                            uuid = uuid; // Override with the current UUID, not "global"
                            metadata = {
                                mimeType = fileRecord.metadata.mimeType;
                                fileName = fileRecord.metadata.fileName;
                                uploadTimestamp = Int.toText(fileRecord.metadata.uploadTimestamp);
                            };
                        };
                        fileResponses := Array.append(fileResponses, [response]);
                    };
                };
            };
        };

        return #ok(fileResponses);
    };

    // Get all global files (admin only)
    public func getAllGlobalFiles(
        caller : Principal,
        admins : HashMap.HashMap<Principal, Bool>,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
    ) : Types.Result<[Types.FileMetadataResponse], Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        var fileResponses : [Types.FileMetadataResponse] = [];

        for ((fileId, record) in globalFiles.entries()) {
            let response : Types.FileMetadataResponse = {
                uuid = fileId; // Use fileId instead of "global" for more clarity
                metadata = {
                    mimeType = record.metadata.mimeType;
                    fileName = record.metadata.fileName;
                    uploadTimestamp = Int.toText(record.metadata.uploadTimestamp);
                };
            };
            fileResponses := Array.append(fileResponses, [response]);
        };

        return #ok(fileResponses);
    };

    // Delete a global file (admin only)
    public func deleteGlobalFile(
        fileId : Text,
        caller : Principal,
        admins : HashMap.HashMap<Principal, Bool>,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Result<Text, Text> {
        switch (Auth.requireAdmin(caller, admins)) {
            case (#err(e)) { return #err(e) };
            case (#ok(())) {};
        };

        let fileOpt = globalFiles.get(fileId);
        switch (fileOpt) {
            case (null) {
                return #err("File not found.");
            };
            case (?_) {
                globalFiles.delete(fileId);

                // Clean up any UUID associations with this file
                for ((_, subMap) in uuidKeyValueMap.entries()) {
                    let fileKey = Storage.makeFileAssociationKey(fileId);
                    subMap.delete(fileKey);
                };

                return #ok("File deleted successfully.");
            };
        };
    };

    // Count the references to a global file
    public func countFileReferences(
        fileId : Text,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Result<Nat, Text> {
        let fileOpt = globalFiles.get(fileId);

        switch (fileOpt) {
            case null {
                return #err("File not found.");
            };
            case (?_) {
                var count = 0;

                for ((_, subMap) in uuidKeyValueMap.entries()) {
                    for ((key, value) in subMap.entries()) {
                        if (Storage.isFileAssociationKey(key) and value == fileId) {
                            count += 1;
                        };
                    };
                };

                return #ok(count);
            };
        };
    };

    // Copy all file associations from one UUID to another
    public func copyFileAssociations(
        sourceUuid : Text,
        targetUuid : Text,
        uuidToStructure : TrieMap.TrieMap<Text, Text>,
        uuidKeyValueMap : TrieMap.TrieMap<Text, TrieMap.TrieMap<Text, Text>>,
    ) : Result<Text, Text> {
        // Check if both UUIDs exist
        if (uuidToStructure.get(sourceUuid) == null) {
            return #err("Source UUID does not exist.");
        };

        if (uuidToStructure.get(targetUuid) == null) {
            return #err("Target UUID does not exist.");
        };

        // Get source submap
        let sourceSubMapOpt = uuidKeyValueMap.get(sourceUuid);
        let sourceSubMap = switch (sourceSubMapOpt) {
            case (null) { return #err("Source UUID not initialized.") };
            case (?m) m;
        };

        // Get target submap
        let targetSubMapOpt = uuidKeyValueMap.get(targetUuid);
        let targetSubMap = switch (targetSubMapOpt) {
            case (null) { return #err("Target UUID not initialized.") };
            case (?m) m;
        };

        // Count of copied associations
        var copiedCount = 0;

        // Copy all file associations
        for ((key, value) in sourceSubMap.entries()) {
            if (Storage.isFileAssociationKey(key)) {
                targetSubMap.put(key, value);
                copiedCount += 1;
            };
        };

        return #ok("Copied " # Nat.toText(copiedCount) # " file associations successfully.");
    };

    // Create a duplicate of a file in the global storage
    public func duplicateGlobalFile(
        fileId : Text,
        globalFiles : TrieMap.TrieMap<Text, FileRecord>,
        fileCounter : Nat,
    ) : (Result<Text, Text>, Nat) {
        let fileOpt = globalFiles.get(fileId);

        switch (fileOpt) {
            case null {
                return (#err("File not found."), fileCounter);
            };
            case (?fileRecord) {
                // Generate a new file ID
                let newFileCounter = fileCounter + 1;
                let newFileId = "file-" # Nat.toText(newFileCounter);

                // Create a new file record with the same data
                let newFileRecord : Types.FileRecord = {
                    uuid = "global";
                    fileData = fileRecord.fileData;
                    metadata = fileRecord.metadata;
                };

                globalFiles.put(newFileId, newFileRecord);

                return (#ok(newFileId), newFileCounter);
            };
        };
    };
};
