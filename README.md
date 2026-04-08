# Font Generator

React + TypeScript + Vite application for generating font preview tiles with custom images and text.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (starts both Vite and Express)
npm run dev

# Build for production
npm run build

# Format code
npm run format
```

## Documentation

📚 **[DOCS_INDEX.md](./DOCS_INDEX.md)** — Complete documentation index (start here!)

### For Developers
- **[QUICK_START.md](./QUICK_START.md)** — 5-minute guide for developers
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Complete project architecture
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** — Visual diagrams

### For AI Agents
- **[.cursor/rules/project-architecture.md](./.cursor/rules/project-architecture.md)** — Quick reference
- **[_bmad-output/project-context.md](./_bmad-output/project-context.md)** — Critical implementation rules

### Infrastructure
- **[docs/SUPABASE.md](./docs/SUPABASE.md)** — Supabase setup and database access

## Tech Stack

- React 19.2.4 + TypeScript 5.9.3 + Vite 8.0.1
- Zustand 5.0.12 (state management)
- Tailwind CSS 4.2.2 (styling)
- Express 5.2.1 (font upload server)
- html-to-image 1.11.13 (tile export)

## Project Structure

```
src/
├── components/     # React components (Grid, Tile, Toolbar, etc.)
├── hooks/          # Custom hooks
├── store/          # Zustand store (single source of truth)
├── types/          # TypeScript types
└── utils/          # Utilities (fonts, images, tileGenerator, etc.)
```

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
