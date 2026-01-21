# Todo App

A personal todo list application with features inspired by Todoist. Built with React and designed for simplicity, readability, and speed.

## Features

- **Password Protection** - App is locked with your personal password
- **6 Priority Tiers** - None, P1-P5 with color-coded visual indicators
- **Calendar View** - Navigate every day of the year
- **Recurring Tasks** - Daily, weekly, monthly, yearly patterns
- **Parent/Sub-items** - Group related tasks under parent items
- **Notes** - Add detailed notes to any task
- **Completion Sound** - Satisfying pop sound when completing tasks
- **Multi-select** - Select multiple items and bulk move/delete
- **Similar Item Detection** - Suggests adding as sub-item when similar tasks exist
- **Voice Input** - Add tasks using speech recognition
- **Todoist Import** - One-time import from Todoist CSV/JSON exports
- **GitHub Sync** - Store data in a private GitHub repository

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd todo-app
npm install
npm run dev
```

Open http://localhost:5173/todo-app/ in your browser.

## Deployment to GitHub Pages

### 1. Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `todo-app` (or any name you prefer)
3. Set to **Private** for personal use
4. Create the repository

### 2. Update Configuration

If your repository name is different from `todo-app`, update `vite.config.js`:

```js
base: '/your-repo-name/',
```

### 3. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/todo-app.git
git push -u origin main
```

### 4. Deploy

```bash
npm run deploy
```

### 5. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages (in the sidebar)
3. Under "Branch", select `gh-pages`
4. Save

Your app will be available at: `https://YOUR_USERNAME.github.io/todo-app/`

## Setting Up Data Sync

The app can store your tasks in a private GitHub repository for backup and sync across devices.

### 1. Create a Data Repository

1. Create a new **private** repository (e.g., `todo-data`)
2. Initialize it with a README

### 2. Create a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Todo App")
4. Select the `repo` scope
5. Generate and copy the token

### 3. Configure in the App

1. Open the app and click the Settings (gear) icon
2. Paste your token in "Personal Access Token"
3. Enter your data repository (e.g., `username/todo-data`)
4. Click "Test Connection" to verify
5. Save Settings

Your data will now sync automatically to your private repository.

## Importing from Todoist

1. In Todoist, go to Settings → Backups
2. Create or download an existing backup (CSV or JSON)
3. In the Todo app, click the Import (cloud upload) icon
4. Select your backup file
5. Preview the items and click Import

## Keyboard Shortcuts

- **Enter** - Add new task (when input is focused)
- **Escape** - Close menus and modals

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Voice input requires Chrome, Edge, or Safari (uses Web Speech API).

## Tech Stack

- React 18 + Vite
- Zustand (state management)
- date-fns (date utilities)
- Fuse.js (fuzzy search)
- CSS Modules
- GitHub API (data storage)
