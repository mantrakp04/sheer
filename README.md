# React + Vite + TypeScript Template (react-vite-ui)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Dan5py/react-vite-ui/blob/main/LICENSE)

A React + Vite template powered by shadcn/ui.

## 🎉 Features

- **React** - A JavaScript library for building user interfaces.
- **Vite** - A fast, opinionated frontend build tool.
- **TypeScript** - A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS** - A utility-first CSS framework.
- **Tailwind Prettier Plugin** - A Prettier plugin for formatting Tailwind CSS classes.
- **ESLint** - A pluggable linting utility for JavaScript and TypeScript.
- **PostCSS** - A tool for transforming CSS with JavaScript.
- **Autoprefixer** - A PostCSS plugin to parse CSS and add vendor prefixes.
- **shadcn/ui** - Beautifully designed components that you can copy and paste into your apps.

## ⚙️ Prerequisites

Make sure you have the following installed on your development machine:

- Node.js (version 16 or above)
- pnpm (package manager)

## 🚀 Getting Started

Follow these steps to get started with the react-vite-ui template:

1. Clone the repository:

   ```bash
   git clone https://github.com/dan5py/react-vite-ui.git
   ```

2. Navigate to the project directory:

   ```bash
   cd react-vite-ui
   ```

3. Install the dependencies:

   ```bash
   pnpm install
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

## 📜 Available Scripts

- pnpm dev - Starts the development server.
- pnpm build - Builds the production-ready code.
- pnpm lint - Runs ESLint to analyze and lint the code.
- pnpm preview - Starts the Vite development server in preview mode.

## 📂 Project Structure

The project structure follows a standard React application layout:

```python
react-vite-ui/
  ├── node_modules/      # Project dependencies
  ├── public/            # Public assets
  ├── src/               # Application source code
  │   ├── components/    # React components
  │   │   └── ui/        # shadc/ui components
  │   ├── styles/        # CSS stylesheets
  │   ├── lib/           # Utility functions
  │   ├── App.tsx        # Application entry point
  │   └── index.tsx      # Main rendering file
  ├── eslint.config.js     # ESLint configuration
  ├── index.html         # HTML entry point
  ├── postcss.config.js  # PostCSS configuration
  ├── tailwind.config.ts # Tailwind CSS configuration
  ├── tsconfig.json      # TypeScript configuration
  └── vite.config.ts     # Vite configuration
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](https://choosealicense.com/licenses/mit/) file for details.

# AI Platform with Integrations

This platform allows you to configure and use various AI providers and models, with integrations for Hugging Face and Google Drive.

## Setting Up Integrations

### Hugging Face Integration

To set up the Hugging Face integration:

1. Go to [Hugging Face](https://huggingface.co/) and create an account if you don't have one.
2. Navigate to your profile settings and go to "Access Tokens".
3. Create a new OAuth application:
   - Name: Your App Name
   - Redirect URI: `https://your-domain.com/integrations/huggingface-callback`
   - Scopes: `inference-api`
4. Copy the Client ID and Client Secret.
5. Update the environment variables in your application:
   ```
   OAUTH_CLIENT_ID=your_client_id
   OAUTH_CLIENT_SECRET=your_client_secret
   ```

### Google Drive Integration

To set up the Google Drive integration:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to "APIs & Services" > "Credentials".
4. Click "Create Credentials" > "OAuth client ID".
5. Configure the OAuth consent screen:
   - User Type: External
   - App name: Your App Name
   - User support email: Your email
   - Developer contact information: Your email
6. Add the following scopes:
   - `https://www.googleapis.com/auth/drive.file`
7. Create the OAuth client ID:
   - Application type: Web application
   - Name: Your App Name
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/integrations/google-callback`
8. Copy the Client ID and Client Secret.
9. Update the environment variables in your application:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## Using the Integrations

### Hugging Face

Once authenticated, you can use the Hugging Face Inference API to access models hosted on Hugging Face. The integration provides the following functionality:

- Call the Inference API with any model
- Access to all public and your private models

### Google Drive

Once authenticated, you can use the Google Drive API to read and write files. The integration provides the following functionality:

- List files in your Google Drive
- Upload files to your Google Drive
- Download files from your Google Drive

## Development

To run the application locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
OAUTH_CLIENT_ID=your_huggingface_client_id
OAUTH_CLIENT_SECRET=your_huggingface_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## License

MIT
