#!/usr/bin/env node

const { exec } = require("child_process");
const { program } = require("commander");
const prompts = require("prompts");
const chalk = require("chalk");

program
  .name("timestorage-cli")
  .description("CLI tool for managing Time Storage admins and editors")
  .version("1.0.0");

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

      const command = `dfx canister call timestorage_backend addAdmin '(principal "${response.principalId}")' --network=ic`;
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

      const command = `dfx canister call timestorage_backend addEditor '(principal "${response.principalId}")' --network=ic`;
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

      const command = `dfx canister call timestorage_backend createEmptyUUID '("${response.uuid}")' --network=ic`;
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

      // Escape double quotes for command line
      const escapedSchema = jsonSchema.replace(/"/g, '\\"');
      const command = `dfx canister call timestorage_backend updateUUIDStructure '("${uuidResponse.uuid}", "${escapedSchema}")' --network=ic`;

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

program.parse();
