# TimeStorage Session Manager Types

This directory contains the Rust library crate `timestorage_session_manager_types`. Its primary purpose is to define shared data types used by the `timestorage_session_manager` canister and potentially other components that interact with it.

## Technology Stack

-   **Language**: [Rust](https://www.rust-lang.org/)

## Key Dependencies

-   **`candid`**: Enables these types to be used in the public Candid interfaces of Internet Computer canisters. This allows for seamless data exchange between canisters and with frontends.
-   **`serde`**: Provides traits for serializing and deserializing Rust data structures efficiently.
    -   **`serde_bytes`**: A specific helper for serializing byte arrays, often useful in canister development.

## Purpose

This crate centralizes type definitions related to session management, user delegations, and other data structures handled by the `timestorage_session_manager` canister. By having these types in a separate crate:
-   It promotes code reuse and consistency.
-   It allows the `timestorage_session_manager` canister to have a clean separation of its core logic from its data type definitions.
-   It can be easily included as a dependency by other Rust crates within the workspace that need to understand or use these types.

## Usage

This crate is intended to be used as a dependency in the `Cargo.toml` of other Rust canisters or libraries within the `timestorage` project, particularly the `timestorage_session_manager` canister.
