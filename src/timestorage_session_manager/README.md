# TimeStorage Session Manager Canister

This directory contains the source code for the `timestorage_session_manager` canister. This canister is responsible for managing user sessions and handling the Auth0 delegation flow for the TimeStorage application.

## Technology Stack

-   **Language**: [Rust](https://www.rust-lang.org/)
-   **Platform**: [Internet Computer](https://internetcomputer.org/)

## Key Dependencies

-   **`ic-cdk`**: Core IC canister development kit.
-   **`ic-cdk-timers`**: For managing timers within the canister.
-   **`ic-stable-structures`**: For working with stable memory.
-   **`ic-certification`**: For asset certification and certified data.
-   **`canister_sig_util`**: Utilities for canister signatures, likely used in the delegation flow. (from `dfinity/internet-identity`)
-   **`jsonwebtoken-rustcrypto`**: For handling JSON Web Tokens (JWTs), essential for Auth0 integration.
-   **`serde` / `serde_json`**: For data serialization and deserialization.
-   **`timestorage_session_manager_types`**: Local workspace crate containing type definitions for this canister.

## Functionality

This canister primarily:
-   Interacts with Auth0 to validate user authentication.
-   Prepares and retrieves delegations (using `prepare_delegation` and `get_delegation` methods) that allow the frontend to interact with other canisters on behalf of the user.
-   Manages session-related data.

## Building and Deploying

This canister is built using Cargo and deployed using the DFX command-line tool, as configured in the project's `dfx.json` file.

## Testing

The `tests/` directory contains integration tests, likely using `pocket-ic` for local canister testing.
