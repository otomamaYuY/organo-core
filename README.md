# organo-core

An interactive organization chart editor built with React Flow.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-green)

---

> Screenshot coming soon

---

## Features

- Interactive drag-and-drop organization chart editor
- Person and Department node creation and editing
- Export to JSON, CSV, HTML, PNG, SVG, and PDF
- Japanese and English UI (i18n)
- Dark and Light theme support
- Playwright E2E test suite

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| UI         | React 19, TailwindCSS               |
| Language   | TypeScript                          |
| Bundler    | Vite                                |
| Graph      | React Flow                          |
| State      | Zustand                             |
| Testing    | Vitest, Playwright                  |

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Installation

```bash
git clone https://github.com/otomamaYuY/organo-core.git
cd organo-core
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Scripts

| Script        | Command              | Description                         |
|---------------|----------------------|-------------------------------------|
| `dev`         | `npm run dev`        | Start the Vite development server   |
| `build`       | `npm run build`      | Type-check and build for production |
| `lint`        | `npm run lint`       | Run ESLint across the project       |
| `test`        | `npm test`           | Run unit tests with Vitest          |
| `test:e2e`    | `npm run test:e2e`   | Run Playwright end-to-end tests     |

## Deployment

### Deploy to Cloudflare Pages

1. Connect your repository to [Cloudflare Pages](https://pages.cloudflare.com/).
2. Set the following build configuration:

   | Setting           | Value           |
   |-------------------|-----------------|
   | Build command     | `npm run build` |
   | Output directory  | `dist`          |
   | Node.js version   | `20`            |

3. Deploy. Cloudflare Pages will automatically rebuild on every push to the main branch.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/).
4. Open a Pull Request against `main`.

Please ensure all tests pass (`npm test` and `npm run test:e2e`) before submitting.

## License

This project is licensed under the [MIT License](./LICENSE).
