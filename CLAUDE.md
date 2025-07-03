# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TimeStorage is a decentralized asset management system built on the Internet Computer (IC) blockchain. It consists of:
- A Motoko backend canister for asset management
- A Rust session manager canister for Auth0 integration
- Two React frontends (main app and admin panel)

## Development Commands

### Build Commands
```bash
# Build all workspaces
npm run build

# Build specific components
dfx deploy timestorage_backend  # Deploy backend canister
pnpm --filter timestorage_frontend build  # Build main frontend
pnpm --filter timestorage_admin build  # Build admin frontend
```

### Development Servers
```bash
# Start local IC replica
dfx start --background

# Run frontend dev servers
cd src/timestorage_frontend && yarn dev  # Main frontend (port 5173)
cd src/timestorage_admin && yarn dev     # Admin frontend (port specified by vite)
```

### Testing
```bash
# Run Motoko tests
dfx canister call test_runner runTests

# Run unit tests for Rust components
cargo test --package timestorage_session_manager
```

### Linting & Formatting
```bash
# Frontend linting
cd src/timestorage_frontend && yarn lint
cd src/timestorage_admin && yarn lint

# Fix linting issues
cd src/timestorage_frontend && yarn lint:fix
cd src/timestorage_admin && yarn lint:fix
```

## Architecture Overview

### Canister Structure
1. **timestorage_backend** (Motoko)
   - Entry point: `src/timestorage_backend/main.mo`
   - Modules: `auth.mo` (access control), `storage.mo` (data persistence), `types.mo` (type definitions), `utils.mo` (utilities)
   - Handles: Asset management, file storage, project structures, role-based access control

2. **timestorage_session_manager** (Rust)
   - Entry point: `src/timestorage_session_manager/src/lib.rs`
   - Purpose: Bridge Auth0 JWT tokens to IC delegated identities
   - Key files: `delegation.rs`, `users.rs`, `id_token.rs`

3. **Frontend Applications**
   - Main app: `src/timestorage_frontend/` - Asset management interface
   - Admin app: `src/timestorage_admin/` - Administrative functions

### Authentication Flow
1. Frontend generates Ed25519 session key pair
2. User logs in via Auth0, receives JWT
3. Frontend sends JWT + session public key to session manager
4. Session manager validates JWT and creates IC delegation
5. Frontend uses delegation for authenticated canister calls

### Data Model
- **UUID-based assets**: Each asset has a unique identifier
- **JSON schemas**: Flexible data structures stored as JSON
- **Key-value pairs**: Additional metadata per asset
- **File attachments**: Base64-encoded files linked to assets
- **Projects & Placements**: Hierarchical organization of assets

### Key Design Patterns
- **Stable storage**: All data uses stable variables for upgrade safety
- **TrieMap collections**: Efficient lookups for UUID-based data
- **Role-based access**: System-wide admin/editor roles + per-asset grants
- **Composite keys**: Format like "projectUuid|placementUuid" for relationships

## Important Considerations

### Canister Interactions
- Frontend → Backend: Direct actor calls using @dfinity/agent
- Frontend → Session Manager: Only for authentication
- No direct canister-to-canister calls between backend and session manager

### State Management
- Backend: Stable variables with upgrade hooks
- Frontend: Zustand for auth, React Context for data
- Session persistence via localStorage

### Development Tips
- Always run `dfx start --background` before development
- Check `canister_ids.json` for deployed canister IDs
- Use `dfx canister id <canister_name>` to get local IDs
- Frontend builds output to `dist/` directories
- Rust canister builds require `./scripts/build-canister.sh`

### Common Pitfalls
- Forgetting to start dfx before deploying
- Not building Rust canisters before deployment
- Missing environment variables (check `.env` file)
- CORS issues in local development (use proper canister URLs)