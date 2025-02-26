#!/usr/bin/env node

const { exec } = require("child_process");
const { program } = require("commander");
const prompts = require("prompts");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const os = require("os");

program
  .name("timestorage-cli")
  .description("CLI tool for managing Time Storage admins and editors")
  .version("1.0.0")
  .option("--network <network>", "Network to use (local or ic)", "local");

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

program
  .command("add-admin")
  .description("Add a new admin to the system")
  .action(async () => {
    try {
      const response = await prompts({
        type: "text",
        name: "principalId",
        message: "Enter the Principal ID of the new admin:",
        validate: (value) =>
          value.length > 0 ? true : "Principal ID cannot be empty",
      });

      if (!response.principalId) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      console.log(chalk.blue("Adding new admin..."));

      const network = program.opts().network;
      const command = `dfx canister call timestorage_backend addAdmin '(principal "${response.principalId}")'  --network=${network}`;
      const result = await executeCommand(command);

      if (result.includes("ok")) {
        console.log(chalk.green("✓ Admin added successfully"));
      } else {
        console.log(chalk.red("✗ Failed to add admin"), result);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
    }
  });

program
  .command("add-editor")
  .description("Add a new editor to the system")
  .action(async () => {
    try {
      const response = await prompts({
        type: "text",
        name: "principalId",
        message: "Enter the Principal ID of the new editor:",
        validate: (value) =>
          value.length > 0 ? true : "Principal ID cannot be empty",
      });

      if (!response.principalId) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      console.log(chalk.blue("Adding new editor..."));

      const network = program.opts().network;
      const command = `dfx canister call timestorage_backend addEditor '(principal "${response.principalId}")' --network=${network}`;
      const result = await executeCommand(command);

      if (result.includes("ok")) {
        console.log(chalk.green("✓ Editor added successfully"));
      } else {
        console.log(chalk.red("✗ Failed to add editor"), result);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
    }
  });

program
  .command("create-empty-uuid")
  .description("Create a new empty UUID (admin only)")
  .action(async () => {
    try {
      const response = await prompts({
        type: "text",
        name: "uuid",
        message: "Enter the UUID to create:",
        validate: (value) => (value.length > 0 ? true : "UUID cannot be empty"),
      });

      if (!response.uuid) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      console.log(chalk.blue("Creating empty UUID..."));
      const network = program.opts().network;
      const command = `dfx canister call timestorage_backend createEmptyUUID '("${response.uuid}")' --network=${network}`;
      const result = await executeCommand(command);

      if (result.includes("ok")) {
        console.log(
          chalk.green(`✓ UUID "${response.uuid}" created successfully`)
        );
      } else {
        console.log(chalk.red("✗ Failed to create UUID"), result);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
    }
  });

program
  .command("update-uuid-structure")
  .description("Update the structure of an existing UUID (admin only)")
  .option("-f, --file <path>", "Path to JSON schema file")
  .action(async (options) => {
    try {
      // First get the UUID
      const uuidResponse = await prompts({
        type: "text",
        name: "uuid",
        message: "Enter the UUID to update:",
        validate: (value) => (value.length > 0 ? true : "UUID cannot be empty"),
      });

      if (!uuidResponse.uuid) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      let jsonSchema;

      if (options.file) {
        // Read schema from file
        try {
          const filePath = path.resolve(options.file);
          jsonSchema = fs.readFileSync(filePath, "utf8");
          // Validate it's valid JSON
          JSON.parse(jsonSchema);
        } catch (err) {
          console.error(
            chalk.red("Error reading or parsing JSON file:"),
            err.message
          );
          return;
        }
      } else {
        // Ask for JSON input
        const schemaResponse = await prompts({
          type: "text",
          name: "schema",
          message:
            "Enter the JSON schema (or use -f option to provide a file):",
          validate: (value) => {
            try {
              JSON.parse(value);
              return true;
            } catch (e) {
              return "Invalid JSON. Please enter valid JSON.";
            }
          },
        });

        if (!schemaResponse.schema) {
          console.log(chalk.yellow("Operation cancelled"));
          return;
        }

        jsonSchema = schemaResponse.schema;
      }

      console.log(
        chalk.blue(`Updating structure for UUID: ${uuidResponse.uuid}...`)
      );

      // Properly serialize and encode the JSON for command line
      const jsonObj =
        typeof jsonSchema === "string" ? JSON.parse(jsonSchema) : jsonSchema;
      const serializedJson = JSON.stringify(jsonObj);

      // Use single quotes for the outer dfx command and escape inner quotes
      const encodedJson = serializedJson.replace(/"/g, '\\"');
      const network = program.opts().network;
      const command = `dfx canister call timestorage_backend updateUUIDStructure '("${uuidResponse.uuid}", "${encodedJson}")' --network=${network}`;

      const result = await executeCommand(command);

      if (result.includes("ok")) {
        console.log(
          chalk.green(
            `✓ Structure for UUID "${uuidResponse.uuid}" updated successfully`
          )
        );
      } else {
        console.log(chalk.red("✗ Failed to update UUID structure"), result);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
    }
  });

program
  .command("upload-file")
  .description("Upload a file associated with a UUID")
  .option("-f, --file <path>", "Path to file to upload")
  .action(async (options) => {
    try {
      // Get the UUID
      const uuidResponse = await prompts({
        type: "text",
        name: "uuid",
        message: "Enter the UUID to associate with the file:",
        validate: (value) => (value.length > 0 ? true : "UUID cannot be empty"),
      });

      if (!uuidResponse.uuid) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      let filePath;
      if (options.file) {
        filePath = path.resolve(options.file);
      } else {
        const fileResponse = await prompts({
          type: "text",
          name: "path",
          message: "Enter the path to the file:",
          validate: (value) =>
            value.length > 0 ? true : "File path cannot be empty",
        });

        if (!fileResponse.path) {
          console.log(chalk.yellow("Operation cancelled"));
          return;
        }

        filePath = path.resolve(fileResponse.path);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red("File not found:", filePath));
        return;
      }

      // Check file size before proceeding
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      if (fileSizeInMB > 2) {
        console.log(
          chalk.yellow(
            `Warning: File size is ${fileSizeInMB.toFixed(
              2
            )} MB. Files larger than 2MB may cause issues with command-line uploads.`
          )
        );
        const continueResponse = await prompts({
          type: "confirm",
          name: "continue",
          message: "Do you want to continue?",
          initial: false,
        });

        if (!continueResponse.continue) {
          console.log(chalk.yellow("Upload cancelled"));
          return;
        }
      }

      // Get file metadata from user
      const metadataResponse = await prompts([
        {
          type: "text",
          name: "fileName",
          message: "Enter file name:",
          initial: path.basename(filePath),
          validate: (value) =>
            value.length > 0 ? true : "File name cannot be empty",
        },
        {
          type: "text",
          name: "mimeType",
          message: "Enter MIME type (e.g., image/jpeg, application/pdf):",
          validate: (value) =>
            value.length > 0 ? true : "MIME type cannot be empty",
        },
      ]);

      if (!metadataResponse.fileName || !metadataResponse.mimeType) {
        console.log(chalk.yellow("Operation cancelled"));
        return;
      }

      // Current timestamp
      const timestamp = Date.now();

      // Create metadata object
      const metadata = {
        fileName: metadataResponse.fileName,
        mimeType: metadataResponse.mimeType,
        uploadTimestamp: timestamp,
      };

      // For large files, create a temporary file
      console.log(chalk.blue("Reading file and preparing for upload..."));

      // Create a temporary file with the upload command
      const tempDir = path.join(os.tmpdir(), "timestorage-cli");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `upload-${Date.now()}.js`);

      // Read the file and convert to base64
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString("base64");

      // Create dfx command in a temp file
      const encodedMetadata = JSON.stringify(metadata);
      const network = program.opts().network;
      const dfxScript = `
      const { execSync } = require('child_process');
      
      try {
        const result = execSync('dfx canister call timestorage_backend uploadFile \\'("${uuidResponse.uuid}", "${base64Data}", ${encodedMetadata})\\' --network=local', {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        console.log(result);
      } catch (error) {
        console.error('Error executing command:', error.message);
        process.exit(1);
      }
      `;

      fs.writeFileSync(tempFilePath, dfxScript);

      console.log(
        chalk.blue(`Uploading file to UUID: ${uuidResponse.uuid}...`)
      );
      console.log(chalk.blue("This may take a while for large files..."));

      // Execute the temp file
      const result = await executeCommand(`node ${tempFilePath}`);

      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.log(
          chalk.yellow("Warning: Could not delete temporary file", tempFilePath)
        );
      }

      if (result.includes("ok")) {
        // Extract the file ID from the result
        const fileIdMatch = result.match(/ID: ([a-zA-Z0-9-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          const fileId = fileIdMatch[1];
          console.log(
            chalk.green(`✓ File uploaded successfully with ID: ${fileId}`)
          );
          console.log(chalk.blue("Save this ID to access your file later"));
        } else {
          console.log(chalk.green("✓ File uploaded successfully"));
        }
      } else {
        console.log(chalk.red("✗ Failed to upload file"), result);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
    }
  });

program.parse();
