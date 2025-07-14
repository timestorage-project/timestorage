# Project Structure

This document outlines the directory structure of the TimeStorage project, providing a reference for understanding its organization.

## Root Directory

The root directory contains essential configuration files, source code, scripts, and other project-related assets.

- **`.dfx/`**: Directory managed by DFX, containing local canister state and other build artifacts.
- **`.env`**: Environment variables for the project.
- **`.git/`**: Git version control system directory.
- **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.
- **`.vscode/`**: Workspace settings for Visual Studio Code.
- **`Cargo.lock`**: Records the exact versions of Rust dependencies.
- **`Cargo.toml`**: The manifest file for the Rust backend canisters, defining metadata and dependencies.
- **`README.md`**: The main README file for the project (this structure guide is separate for clarity).
- **`canister_ids.json`**: Stores the principal IDs of deployed canisters on a network.
- **`cli.cjs`**: A CommonJS module, likely a command-line interface tool for the project.
- **`deps/`**: Contains project dependencies, possibly related to Rust or other build processes.
- **`dfx.json`**: The DFX project configuration file, defining canisters, networks, and build settings.
- **`dist/`**: Typically contains the distributable files for the frontend after a build process.
- **`init.sh`**: A shell script likely used for project initialization or setup tasks.
- **`node_modules/`**: Directory where Node.js packages (dependencies for frontend or tooling) are stored.
- **`package-lock.json` / `pnpm-lock.yaml`**: Lock files for npm/pnpm, ensuring consistent dependency installation.
- **`package.json`**: Defines Node.js project metadata, scripts, and dependencies.
- **`pnpm-workspace.yaml`**: Configuration file for pnpm workspaces, if the project uses a monorepo structure managed by pnpm.
- **`scripts/`**: Contains utility scripts for building, deploying, testing, or other development tasks.
- **`src/`**: The main source code directory for the project (see details below).
- **`target/`**: Directory where Rust build artifacts are stored.
- **`test/`**: Contains test files and configurations for automated testing.
- **`timestorage.code-workspace`**: VS Code workspace file.
- **`tsconfig.json`**: TypeScript configuration file for the project.

## `src` Directory

The `src` directory houses the core logic of the application, organized into subdirectories typically representing different canisters or modules:

- **`src/app/`**: Contains a nested `src/declarations/` directory. The exact purpose of this 'app' module and its declarations needs further investigation but might represent a distinct functional unit or canister within the project.
- **`src/declarations/`**: This directory likely holds Candid interface declarations for the project's canisters. These files define the public interface of each canister, enabling inter-canister communication and frontend interaction.
- **`src/timestorage_admin/`**: Contains the source code for an administrative canister or functionalities related to managing the TimeStorage application.
- **`src/timestorage_backend/`**: This is the primary backend canister for the TimeStorage application, containing the core business logic and data management.
- **`src/timestorage_frontend/`**: Contains the source code for the frontend user interface of the TimeStorage application. This is likely built using a modern web framework (e.g., React, Svelte, Vue).
- **`src/timestorage_session_manager/`**: This canister is responsible for managing user sessions and handling the Auth0 delegation flow, as per project design. It interacts with Auth0 to authenticate users and issue delegations for accessing other canisters.
- **`src/timestorage_session_manager_types/`**: Contains data type definitions (likely Rust structs or TypeScript interfaces/types) specifically used by the `timestorage_session_manager` canister.

## Other Key Directories

- **`scripts/`**: Contains various helper scripts for automating tasks such as building the project, deploying canisters, running tests, or other development workflows.
- **`test/`**: Houses automated tests for the project, ensuring code quality and correctness. This might include unit tests, integration tests, and end-to-end tests for both backend canisters and frontend components.
- **`deps/`**: This directory likely holds external dependencies or submodules required by the project, potentially for specific build processes or third-party libraries not managed by standard package managers like Cargo or npm/pnpm.

This structure provides a modular and organized way to manage the different components of the TimeStorage application. For more detailed information on specific canisters or modules, refer to their respective subdirectories within `src/`.
