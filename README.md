# 🗄️ LinkVault

> Your personal bookmark manager and note-taking dashboard.

LinkVault is a modern, lightweight, and fast web application designed to help you organize your internet life. It allows you to save bookmarks, categorize them, and attach nested notes. You can also create standalone notes for quick thoughts, all presented in a sleek, glassmorphism-inspired SaaS dashboard interface.

---

## ✨ Features

- **🔒 Secure Authentication:** JWT-based login and registration system. 
- **📂 Categorization:** Group your bookmarks and notes into custom categories for easy organization.
- **🔖 Bookmark Management:** Save URLs, toggle them as favorites, or archive them to clear up your dashboard.
- **📝 Nested & Standalone Notes:** Attach specific notes directly to your saved bookmarks, or create standalone pinned notes.
- **🌓 Dark Mode:** Beautiful, fully-integrated dark theme that automatically persists to your browser storage.
- **📱 Responsive UI:** Built with a modern aesthetic featuring glassmorphism, soft shadows, and micro-animations that look great on any device.
- **⚡ Client-Side Magic:** Fast, client-side pagination, searching, sorting, and native drag-and-drop reordering.
- **💾 Export Functionality:** Easily download backups of your bookmarks and notes in JSON format.

## 🛠️ Technology Stack

LinkVault is intentionally built to be as lightweight and accessible as possible. **No build steps. No bundlers. No Node.js required.**

- **HTML5 & CSS3** (Custom variables, animations, glassmorphism)
- **Vanilla JavaScript** (ES6+, DOM Manipulation, Fetch API)
- **Bootstrap 5** (Layout, Grids, Modals, Toasts, imported via CDN)
- **REST API** (Connected to a remote ASP.NET Core backend)

## 🚀 Quick Start (Local Development)

Because there are no complex build tools or dependencies, getting started is completely effortless.

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/link-vault.git
   ```
2. Navigate to the project folder:
   ```bash
   cd link-vault
   ```
3. Open `login.html` directly in your favorite web browser!
   *(No local server or installation commands are required).*

## 🌐 Deployment

This project is configured out-of-the-box for zero-config deployment on static hosting providers like Vercel, Netlify, or GitHub Pages.

**Deploying to Vercel:**
1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. Leave all build settings blank.
4. Deploy! 
   *(Note: The included `vercel.json` file ensures that visitors hitting the root URL are automatically redirected to `login.html`).*

## ⌨️ Keyboard Shortcuts

- Press `N` anywhere (outside of a text input) to instantly open the "Create" modal for your current page.

---
*Built with Vanilla JS and modern CSS.*
