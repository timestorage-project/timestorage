# TimeStorage Admin Dashboard

This directory contains the source code for the TimeStorage Admin Dashboard. It provides an interface for administrative tasks related to the TimeStorage application.

## Technology Stack

-   **Framework/Library**: [React](https://reactjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **UI Components**: [Material UI (MUI)](https://mui.com/)
-   **Styling**: [Emotion](https://emotion.sh/) (used by MUI)
-   **Routing**: [React Router DOM](https://reactrouter.com/)
-   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
-   **Internet Computer Interaction**:
    -   `@dfinity/agent`: For interacting with IC canisters.
    -   `@dfinity/auth-client`: For authentication with Internet Identity or other IC-compatible auth methods.
    -   `@dfinity/principal`: For handling IC principals.
-   **Linting & Formatting**:
    -   [ESLint](https://eslint.org/)
    -   [Prettier](https://prettier.io/)
-   **Charting**: [ApexCharts](https://apexcharts.com/) (via `react-apexcharts`)

## Project Purpose

This admin dashboard is intended to provide administrative functionalities for the TimeStorage application, such as:
-   User management (if applicable)
-   Viewing application statistics
-   Managing stored data or configurations
-   Other administrative tasks

(The exact functionalities would depend on the specific implementation and interaction with the backend admin canister.)

## Available Scripts

(Refer to `package.json` for the most up-to-date scripts and their exact commands)

-   **`dev`**: Starts the development server (e.g., `vite`).
-   **`build`**: Builds the application for production (e.g., `tsc && vite build`).
-   **`start` or `preview`**: Serves the production build locally (e.g., `vite preview`).
-   **`lint`**: Lints the codebase using ESLint.
-   **`fm:fix` or `format`**: Formats the codebase using Prettier.
