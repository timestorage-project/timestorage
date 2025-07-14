# TimeStorage Frontend

This directory contains the source code for the TimeStorage application's frontend.

## Technology Stack

-   **Framework/Library**: [React](https://reactjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**:
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [Emotion](https://emotion.sh/)
    -   [Material UI (MUI)](https://mui.com/)
-   **Routing**: [React Router](https://reactrouter.com/)
-   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
-   **Internet Computer Interaction**:
    -   `@dfinity/agent`
    -   `@dfinity/candid`
    -   `@dfinity/identity`
    -   `@dfinity/principal`
-   **Authentication**: [Auth0](https://auth0.com/) (via `@auth0/auth0-react` and `@auth0/auth0-spa-js`)
-   **Linting & Formatting**:
    -   [ESLint](https://eslint.org/)
    -   [Prettier](https://prettier.io/)

## Project Structure

(Based on common React project structure and observed files/directories)

-   **`src/main.tsx`**: The main entry point of the application.
-   **`src/App.tsx`**: The root application component, typically handling routing and global layout.
-   **`src/components/`**: Reusable UI components.
-   **`src/pages/`**: Top-level page components corresponding to different application views/routes.
-   **`src/store/`**: Zustand store(s) for global state management.
-   **`src/services/`**: Modules for interacting with backend canisters or external APIs.
-   **`src/context/`**: React context providers for sharing state or functions.
-   **`src/hooks/`**: Custom React hooks (e.g., from `@caldwell619/react-hooks` if used extensively).
-   **`src/utils/`**: Utility functions and helpers.
-   **`src/assets/` or `public/`**: Static assets like images, fonts, etc.
-   **`src/globals.css`**: Global styles or Tailwind CSS base styles.
-   **`src/timestorage_backend/` & `src/timestorage_session_manager/`**: These appear to be auto-generated client code or type definitions for interacting with the respective canisters.

## Available Scripts

(Refer to `package.json` for the most up-to-date scripts and their exact commands)

-   **`dev`**: Starts the development server (e.g., `vite`).
-   **`build`**: Builds the application for production (e.g., `tsc --noEmit && vite build`).
-   **`serve` or `preview`**: Serves the production build locally (e.g., `vite preview`).
-   **`lint`**: Lints the codebase using ESLint.
-   **`format`**: Formats the codebase using Prettier.
-   **`analyze`**: Builds the application and analyzes the bundle size.